import { supabase } from './api/supabase';
import { ChatMessage, Conversation, ConversationMember } from '../types/chat';
import { Activity } from '../types/activity';
import { usersAreBlocked } from './safetyService';
import { consumeRateLimit } from './rateLimitService';
import { trackProductEvent } from './analyticsService';

const withRetry = async <T>(action: () => Promise<T>, retries: number = 1): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown chat service failure');
};

export const getOrCreateDirectConversation = async (
  targetUserId: string,
  currentUserId?: string
): Promise<string> => {
  if (currentUserId) {
    if (await usersAreBlocked(currentUserId, targetUserId)) {
      throw new Error('You cannot message this user.');
    }
    await consumeRateLimit('chat_create', currentUserId);
  }

  const { data, error } = await withRetry(() =>
    supabase.rpc('get_or_create_direct_conversation', {
      target_user_id: targetUserId,
    })
  );

  if (error) {
    throw new Error(`Failed to open direct chat: ${error.message}`);
  }

  if (!data) {
    throw new Error('No conversation id returned for direct chat.');
  }

  return data as string;
};

export const ensureActivityGroupConversation = async (activityId: string): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await consumeRateLimit('chat_create', user.id);
  }

  const { data, error } = await withRetry(() =>
    supabase.rpc('ensure_activity_group_conversation', {
      target_activity_id: activityId,
    })
  );

  if (error) {
    throw new Error(`Failed to open game chat: ${error.message}`);
  }

  if (!data) {
    throw new Error('No conversation id returned for game chat.');
  }

  return data as string;
};

/** @deprecated Use ensureActivityGroupConversation */
export const createActivityGroupConversation = ensureActivityGroupConversation;

export const getActivityGroupConversationId = async (
  activityId: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('activity_id', activityId)
    .eq('conversation_type', 'activity_group')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load activity conversation: ${error.message}`);
  }

  return data?.id || null;
};

export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load conversation: ${error.message}`);
  }

  return (data as Conversation) || null;
};

export const getMyConversations = async (userId: string): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('conversation_members')
    .select(
      `
      conversation:conversations(
        *,
        activity:activities(
          id,
          sport_type,
          start_time,
          duration,
          status,
          player_count,
          location:activity_locations(name)
        )
      )
    `
    )
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to load conversations: ${error.message}`);
  }

  const rows = (data || []) as { conversation: Conversation & { activity?: Activity | null } }[];
  return rows
    .map((row) => row.conversation)
    .filter(Boolean)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
};

export const getConversationMembers = async (
  conversationId: string
): Promise<ConversationMember[]> => {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  return (data || []) as ConversationMember[];
};

export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> => {
  const { data, error } = await withRetry(() =>
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
  );

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return ((data || []) as ChatMessage[]).reverse();
};

export const sendConversationMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }

  const { data: members, error: membersErr } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('is_active', true);

  if (membersErr) {
    throw new Error(`Failed to verify conversation: ${membersErr.message}`);
  }

  for (const member of members || []) {
    const otherId = member.user_id as string;
    if (otherId !== senderId && (await usersAreBlocked(senderId, otherId))) {
      throw new Error('You cannot message this conversation because of a block.');
    }
  }

  await consumeRateLimit('chat_message', senderId);

  const { data, error } = await withRetry(() =>
    supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: 'text',
        content: trimmed,
      })
      .select()
      .single()
  );

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  await trackProductEvent(
    'message_sent',
    { conversation_id: conversationId, message_id: (data as ChatMessage).id },
    senderId
  );

  return data as ChatMessage;
};

export const getConversationPeerUserIds = async (
  conversationId: string,
  currentUserId: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to load conversation members: ${error.message}`);
  }

  return (data || [])
    .map((row) => row.user_id as string)
    .filter((id) => id !== currentUserId);
};

export const markConversationRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await withRetry(() =>
    supabase
      .from('conversation_members')
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
  );

  if (error) {
    throw new Error(`Failed to mark conversation read: ${error.message}`);
  }
};

export const subscribeToConversationMessages = (
  conversationId: string,
  onNewMessage: (message: ChatMessage) => void
) => {
  return supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();
};

export const getUnreadConversationCounts = async (
  userId: string
): Promise<Record<string, number>> => {
  const { data: memberRows, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id,last_read_at')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (memberError) {
    throw new Error(`Failed to load unread state: ${memberError.message}`);
  }

  const members = (memberRows || []) as { conversation_id: string; last_read_at?: string | null }[];
  if (members.length === 0) {
    return {};
  }

  const conversationIds = members.map((row) => row.conversation_id);
  const { data: messageRows, error: messageError } = await supabase
    .from('messages')
    .select('id,conversation_id,created_at')
    .in('conversation_id', conversationIds)
    .is('deleted_at', null);

  if (messageError) {
    throw new Error(`Failed to load unread messages: ${messageError.message}`);
  }

  const counts: Record<string, number> = {};
  for (const member of members) {
    const lastReadMs = member.last_read_at ? new Date(member.last_read_at).getTime() : 0;
    const unread = ((messageRows || []) as { conversation_id: string; created_at: string }[]).filter(
      (msg) =>
        msg.conversation_id === member.conversation_id &&
        new Date(msg.created_at).getTime() > lastReadMs
    ).length;
    counts[member.conversation_id] = unread;
  }

  return counts;
};

export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  const counts = await getUnreadConversationCounts(userId);
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
};

export type ActivityAnnouncement = Pick<
  Conversation,
  'pinned_announcement' | 'pinned_announcement_at' | 'pinned_announcement_by'
>;

export const getActivityConversationAnnouncement = async (
  activityId: string
): Promise<ActivityAnnouncement | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('pinned_announcement, pinned_announcement_at, pinned_announcement_by')
    .eq('activity_id', activityId)
    .eq('conversation_type', 'activity_group')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data as ActivityAnnouncement) || null;
};

export const setGameRoomAnnouncement = async (
  activityId: string,
  text: string | null
): Promise<void> => {
  const { error } = await supabase.rpc('set_game_room_announcement', {
    p_activity_id: activityId,
    p_text: text,
  });
  if (error) {
    throw new Error(error.message);
  }
};

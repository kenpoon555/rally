import { supabase } from './api/supabase';
import { MessageReaction, ReactionEmoji } from '../types/chat';

export const getReactionsForMessages = async (
  messageIds: string[]
): Promise<MessageReaction[]> => {
  if (!messageIds.length) return [];
  const { data, error } = await supabase
    .from('message_reactions')
    .select('*')
    .in('message_id', messageIds);
  if (error) throw new Error(`Failed to load reactions: ${error.message}`);
  return (data || []) as MessageReaction[];
};

export const addReaction = async (
  messageId: string,
  emoji: ReactionEmoji
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('message_reactions')
    .upsert(
      { message_id: messageId, user_id: user.id, emoji },
      { onConflict: 'message_id,user_id,emoji', ignoreDuplicates: true }
    );
  if (error) throw new Error(`Failed to add reaction: ${error.message}`);
};

export const removeReaction = async (
  messageId: string,
  emoji: ReactionEmoji
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji);
  if (error) throw new Error(`Failed to remove reaction: ${error.message}`);
};

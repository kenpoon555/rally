import { useCallback, useState } from 'react';
import { Activity } from '../types/activity';
import { Conversation } from '../types/chat';
import { Friend } from '../types/friends';
import { RegularGroup } from '../types/regularGroup';
import { getMyGames, MyGameEntry, MyGameRole } from '../services/activityService';
import { getMyConversations, getUnreadConversationCounts } from '../services/chatService';
import { getMyRegularGroups } from '../services/regularGroupService';
import { getUserFriends } from '../services/friendsService';
import { supabase } from '../services/api/supabase';
import { useSupabaseRealtimeReload } from './useSupabaseRealtimeReload';
import { formatActivityTime, getGameStatusLabel } from '../utils/activityHelpers';

export type ChatInboxFilter = 'all' | 'games' | 'friends';

export type GroupChatInboxItem = {
  kind: 'group';
  key: string;
  group: RegularGroup;
  /** Soonest upcoming game for this group, if one is scheduled. */
  nextActivity: Activity | null;
  conversationId: string | null;
  unread: number;
  title: string;
  subtitle: string;
};

export type GameChatInboxItem = {
  kind: 'game';
  key: string;
  activity: Activity;
  role: MyGameRole;
  conversationId: string | null;
  unread: number;
  isPast: boolean;
  title: string;
  subtitle: string;
  statusLabel: string;
};

export type FriendChatInboxItem = {
  kind: 'friend';
  key: string;
  userId: string;
  username: string;
  conversationId: string | null;
  unread: number;
  title: string;
  subtitle: string;
};

export type ChatInboxItem = GroupChatInboxItem | GameChatInboxItem | FriendChatInboxItem;

function gameTitle(activity: Activity): string {
  const court = activity.location?.name;
  return court ? `${activity.sport_type} · ${court}` : activity.sport_type;
}

async function buildDirectConversationPeerMap(
  userId: string,
  conversations: Conversation[]
): Promise<Record<string, string>> {
  const directIds = conversations
    .filter((c) => c.conversation_type === 'friend_direct')
    .map((c) => c.id);

  if (directIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id')
    .in('conversation_id', directIds)
    .eq('is_active', true);

  if (error) {
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of data || []) {
    const convoId = row.conversation_id as string;
    const memberId = row.user_id as string;
    if (memberId !== userId) {
      map[convoId] = memberId;
    }
  }
  return map;
}

function buildChatInbox(params: {
  games: { active: MyGameEntry[]; past: MyGameEntry[] };
  groups: RegularGroup[];
  conversations: Conversation[];
  friends: Friend[];
  unreadCounts: Record<string, number>;
  directPeerMap: Record<string, string>;
}): ChatInboxItem[] {
  const convoByActivityId = new Map<string, Conversation>();
  const directConvos = params.conversations.filter((c) => c.conversation_type === 'friend_direct');
  const directConvoByFriendId = new Map<string, Conversation>();

  for (const convo of params.conversations) {
    if (convo.conversation_type === 'activity_group' && convo.activity_id) {
      convoByActivityId.set(convo.activity_id, convo);
    }
  }

  for (const convo of directConvos) {
    const peerId = params.directPeerMap[convo.id];
    if (peerId) {
      directConvoByFriendId.set(peerId, convo);
    }
  }

  const gameItems: GameChatInboxItem[] = [];
  const appendGame = (entry: MyGameEntry, isPast: boolean) => {
    const { activity, role } = entry;
    const convo = convoByActivityId.get(activity.id);
    gameItems.push({
      kind: 'game',
      key: `game-${activity.id}`,
      activity,
      role,
      conversationId: convo?.id ?? null,
      unread: convo ? params.unreadCounts[convo.id] || 0 : 0,
      isPast,
      title: gameTitle(activity),
      subtitle: formatActivityTime(activity.start_time, activity.duration),
      statusLabel: getGameStatusLabel(activity),
    });
  };

  for (const entry of params.games.active) {
    appendGame(entry, false);
  }
  for (const entry of params.games.past) {
    appendGame(entry, true);
  }

  gameItems.sort((a, b) => {
    if (a.isPast !== b.isPast) {
      return a.isPast ? 1 : -1;
    }
    return new Date(b.activity.start_time).getTime() - new Date(a.activity.start_time).getTime();
  });

  const friendItems: FriendChatInboxItem[] = params.friends.map((friend) => {
    const friendId = friend.friend?.id || friend.friend_id;
    const username = friend.friend?.username || 'Friend';
    const convo = directConvoByFriendId.get(friendId);
    return {
      kind: 'friend',
      key: `friend-${friendId}`,
      userId: friendId,
      username,
      conversationId: convo?.id ?? null,
      unread: convo ? params.unreadCounts[convo.id] || 0 : 0,
      title: `@${username}`,
      subtitle: convo ? 'Friend chat' : 'Start a conversation',
    };
  });

  friendItems.sort((a, b) => a.username.localeCompare(b.username));

  const activeByGroupId = new Map<string, Activity>();
  for (const entry of params.games.active) {
    const groupId = entry.activity.regular_group_id;
    if (!groupId || !entry.activity.start_time) {
      continue;
    }
    const existing = activeByGroupId.get(groupId);
    if (
      !existing ||
      new Date(entry.activity.start_time).getTime() < new Date(existing.start_time).getTime()
    ) {
      activeByGroupId.set(groupId, entry.activity);
    }
  }

  const groupItems: GroupChatInboxItem[] = params.groups.map((group) => {
    const nextActivity = activeByGroupId.get(group.id) ?? null;
    const convo = nextActivity ? convoByActivityId.get(nextActivity.id) : undefined;
    return {
      kind: 'group',
      key: `group-${group.id}`,
      group,
      nextActivity,
      conversationId: convo?.id ?? null,
      unread: convo ? params.unreadCounts[convo.id] || 0 : 0,
      title: group.name,
      subtitle: nextActivity
        ? `Next: ${formatActivityTime(nextActivity.start_time, nextActivity.duration)}`
        : 'No game scheduled yet',
    };
  });

  groupItems.sort((a, b) => a.group.name.localeCompare(b.group.name));

  return [...groupItems, ...gameItems, ...friendItems];
}

export function useChatInbox(userId: string | undefined) {
  const [items, setItems] = useState<ChatInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setTotalUnread(0);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const [games, groups, conversations, friends, unreadCounts] = await Promise.all([
        getMyGames(userId),
        getMyRegularGroups(userId),
        getMyConversations(userId),
        getUserFriends(userId),
        getUnreadConversationCounts(userId),
      ]);

      const directPeerMap = await buildDirectConversationPeerMap(userId, conversations);
      const inbox = buildChatInbox({
        games,
        groups,
        conversations,
        friends,
        unreadCounts,
        directPeerMap,
      });

      setItems(inbox);
      setTotalUnread(Object.values(unreadCounts).reduce((sum, n) => sum + n, 0));
    } catch (error) {
      console.error('Chat inbox load failed:', error);
      setErrorText('Could not load chats. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { items, loading, errorText, totalUnread, load };
}

export function useChatInboxWithRealtime(userId: string | undefined) {
  const inbox = useChatInbox(userId);
  useSupabaseRealtimeReload(['activities', 'join_requests'], inbox.load, Boolean(userId));
  return inbox;
}

export function filterChatInbox(items: ChatInboxItem[], filter: ChatInboxFilter): ChatInboxItem[] {
  if (filter === 'games') {
    return items.filter((item) => item.kind === 'game' || item.kind === 'group');
  }
  if (filter === 'friends') {
    return items.filter((item) => item.kind === 'friend');
  }
  return items;
}

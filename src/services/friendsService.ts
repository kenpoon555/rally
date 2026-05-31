import { supabase } from './api/supabase';
import { Friend } from '../types/friends';
import { trackProductEvent } from './analyticsService';

/**
 * Send friend request
 */
export const sendFriendRequest = async (
  userId: string,
  friendId: string
): Promise<Friend> => {
  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .single();

  if (existing) {
    return existing as Friend;
  }

  const { data, error } = await supabase
    .from('friends')
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send friend request: ${error.message}`);
  }

  return data as Friend;
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (friendshipId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('friends')
    .update({
      status: 'accepted',
    })
    .eq('id', friendshipId);

  if (error) {
    throw new Error(`Failed to accept friend request: ${error.message}`);
  }

  if (user) {
    await trackProductEvent('friend_connection_made', { friendship_id: friendshipId }, user.id);
  }
};

/**
 * Reject or remove friend
 */
export const removeFriend = async (friendshipId: string): Promise<void> => {
  const { error } = await supabase.from('friends').delete().eq('id', friendshipId);

  if (error) {
    throw new Error(`Failed to remove friend: ${error.message}`);
  }
};

/**
 * Get user's friends
 */
export const getUserFriends = async (userId: string): Promise<Friend[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select(
      `
      *,
      user:profiles!friends_user_id_fkey(id, username, profile_photo_url),
      friend:profiles!friends_friend_id_fkey(id, username, profile_photo_url)
    `
    )
    .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`);

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  const normalized = ((data || []) as Friend[]).map((row) => {
    const isRequester = row.user_id === userId;
    return {
      ...row,
      friend: isRequester ? row.friend : row.user,
    };
  });

  return normalized;
};

/**
 * Get pending friend requests (received)
 */
export const getPendingFriendRequests = async (userId: string): Promise<Friend[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select(
      `
      *,
      user:profiles!friends_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending friend requests:', error);
    return [];
  }

  return (data || []) as Friend[];
};

/**
 * Get outgoing pending friend requests (sent by current user)
 */
export const getOutgoingFriendRequests = async (userId: string): Promise<Friend[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select(
      `
      *,
      friend:profiles!friends_friend_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching outgoing friend requests:', error);
    return [];
  }

  return (data || []) as Friend[];
};

/**
 * Check if two users are friends
 */
export const areFriends = async (
  userId1: string,
  userId2: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`)
    .eq('status', 'accepted')
    .single();

  return !!data;
};

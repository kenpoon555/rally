import { supabase } from './api/supabase';

/**
 * Ask server to send FCM to activity host (Phase 4).
 * Requires FIREBASE_SERVER_KEY secret on Supabase Edge Function `send-push`.
 */
export async function notifyHostOfJoinRequest(activityId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'join_request',
      activity_id: activityId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Push dispatch skipped:', error.message);
    }
  }
}

/** Notify the player their join request was approved (push when FCM is configured). */
export async function notifyPlayerOfJoinApproval(
  activityId: string,
  playerUserId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'join_request_approved',
      activity_id: activityId,
      target_user_id: playerUserId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Approval push skipped:', error.message);
    }
  }
}

/** Notify the player their join request was declined. */
export async function notifyPlayerOfJoinRejection(
  activityId: string,
  playerUserId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'join_request_rejected',
      activity_id: activityId,
      target_user_id: playerUserId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Rejection push skipped:', error.message);
    }
  }
}

/** Remind approved players who have not tapped I'm in yet. */
export async function notifyRosterNudge(activityId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'roster_nudge',
      activity_id: activityId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Nudge push skipped:', error.message);
    }
  }
}

/** Notify a free agent that a host invited them to a game. */
export async function notifyFreeAgentInvite(
  activityId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'free_agent_invite',
      activity_id: activityId,
      target_user_id: targetUserId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Free agent invite push skipped:', error.message);
    }
  }
}

/** Notify a friend they were invited to a specific game. */
export async function notifyGameFriendInvite(
  activityId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'game_friend_invite',
      activity_id: activityId,
      target_user_id: targetUserId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Game friend invite push skipped:', error.message);
    }
  }
}

/** Notify a player that the host invited them to fill an open spot. */
export async function notifyFillInInvite(
  activityId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'fill_in_invite',
      activity_id: activityId,
      target_user_id: targetUserId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Fill-in invite push skipped:', error.message);
    }
  }
}

/** Notify other conversation members of a new chat message (background push). */
export async function notifyConversationMessage(
  conversationId: string,
  messagePreview: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'chat_message',
      conversation_id: conversationId,
      message_preview: messagePreview,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Chat push skipped:', error.message);
    }
  }
}

/** Notify approved players that the host finalized the roster. */
export async function notifyGameFinalized(activityId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'game_finalized',
      activity_id: activityId,
    },
  });

  if (error) {
    if (__DEV__) {
      console.warn('Finalize push skipped:', error.message);
    }
  }
}

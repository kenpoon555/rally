import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/api/supabase';
import { navigateFromNotificationData } from '../navigation/navigationRef';
import { isFocusedGameRoomActivity } from '../utils/gameRoomFocus';

/**
 * In-app join-request alerts via Supabase Realtime (works on simulators without FCM).
 * - Hosts: new pending request on any active game they host
 * - Players: approved / rejected updates on their own requests
 */
export function useJoinRequestNotifications(userId: string | undefined): void {
  const hostedActivityIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channels: ReturnType<typeof supabase.channel>[] = [];
    let cancelled = false;

    const openActivity = (activityId: string) => {
      navigateFromNotificationData({
        type: 'join_request',
        activity_id: activityId,
      });
    };

    const setupHostListeners = async () => {
      const { data: hosted } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (cancelled) return;

      hostedActivityIdsRef.current = (hosted || []).map((row) => row.id as string);

      for (const activityId of hostedActivityIdsRef.current) {
        const channel = supabase
          .channel(`host-join-${activityId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'join_requests',
              filter: `activity_id=eq.${activityId}`,
            },
            (payload) => {
              const row = payload.new as { status?: string };
              if (row.status !== 'pending') {
                return;
              }
              Alert.alert('New join request', 'Someone wants to join your game.', [
                { text: 'Later', style: 'cancel' },
                { text: 'Review', onPress: () => openActivity(activityId) },
              ]);
            }
          )
          .subscribe();
        channels.push(channel);
      }
    };

    const playerChannel = supabase
      .channel(`player-join-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string; activity_id?: string };
          const activityId = row.activity_id;
          if (!activityId) {
            return;
          }
          if (row.status === 'approved') {
            if (isFocusedGameRoomActivity(activityId)) {
              return;
            }
            Alert.alert("You're in!", 'The host approved your join request.', [
              { text: 'OK', style: 'cancel' },
              { text: 'View game', onPress: () => openActivity(activityId) },
            ]);
            return;
          }
          if (row.status === 'rejected') {
            Alert.alert('Request declined', 'The host declined your join request.', [
              { text: 'OK', style: 'cancel' },
            ]);
          }
        }
      )
      .subscribe();
    channels.push(playerChannel);

    void setupHostListeners();

    return () => {
      cancelled = true;
      for (const channel of channels) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);
}

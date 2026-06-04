import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/api/supabase';
import { navigateFromNotificationData } from '../navigation/navigationRef';

/**
 * In-app alerts when a game you're in is finalized (Realtime — not push).
 */
export function useGameLifecycleNotifications(userId: string | undefined): void {
  const seenFinalizedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`game-lifecycle-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activities',
        },
        async (payload) => {
          const row = payload.new as {
            id?: string;
            match_status?: string;
            user_id?: string;
            sport_type?: string;
          };
          if (!row.id || row.match_status !== 'finalized') {
            return;
          }
          if (seenFinalizedRef.current.has(row.id)) {
            return;
          }

          const isHost = row.user_id === userId;
          if (!isHost) {
            const { data: joinRow } = await supabase
              .from('join_requests')
              .select('id')
              .eq('activity_id', row.id)
              .eq('user_id', userId)
              .eq('status', 'approved')
              .maybeSingle();
            if (!joinRow) {
              return;
            }
          }

          seenFinalizedRef.current.add(row.id);
          const sport = row.sport_type || 'Game';
          Alert.alert(
            `${sport} finalized`,
            'The host locked the roster. Tap to view game details.',
            [
              { text: 'OK', style: 'cancel' },
              {
                text: 'View game',
                onPress: () =>
                  navigateFromNotificationData({
                    type: 'join_request_approved',
                    activity_id: row.id!,
                  }),
              },
            ]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}

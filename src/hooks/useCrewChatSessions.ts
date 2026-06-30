import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity } from '../types/activity';
import { ConversationSessionCard } from '../types/sessionCard';
import { listConversationSessionCards } from '../services/sessionCardService';
import { getRegularGroupById, joinCrewGame } from '../services/regularGroupService';
import {
  finalizeGameCommitment,
  nudgeSessionRoster,
  setGameReady,
} from '../services/activityService';
import { PRODUCT_COPY } from '../constants/productCopy';
import { ROUTES } from '../constants/routes';

type Params = {
  conversationId: string | null;
  groupId: string;
  userId?: string;
  onAfterAction?: () => void;
};

export function useCrewChatSessions({
  conversationId,
  groupId,
  userId,
  onAfterAction,
}: Params) {
  const navigation = useNavigation();
  const [crewSessions, setCrewSessions] = useState<ConversationSessionCard[]>([]);
  const [focusedActivityId, setFocusedActivityId] = useState<string | undefined>();
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);
  const [crewHostId, setCrewHostId] = useState<string | null>(null);

  useEffect(() => {
    void getRegularGroupById(groupId)
      .then((g) => setCrewHostId(g?.host_id ?? null))
      .catch(() => setCrewHostId(null));
  }, [groupId]);

  const reloadCrewSessions = useCallback(async () => {
    if (!conversationId) {
      setCrewSessions([]);
      return [];
    }
    const sessions = await listConversationSessionCards(conversationId);
    setCrewSessions(sessions);
    const now = Date.now();
    const upcoming = sessions
      .filter((s) => {
        const card = s.card;
        if (card.status !== 'active') {
          return false;
        }
        const endMs =
          new Date(card.start_time).getTime() + (card.duration ?? 60) * 60 * 1000;
        return endMs >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.card.start_time).getTime() - new Date(b.card.start_time).getTime()
      );
    const current =
      sessions.find((s) => s.is_current) ?? upcoming[0] ?? sessions[sessions.length - 1];
    setFocusedActivityId((prev) => prev ?? current?.activity_id);
    return sessions;
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      void reloadCrewSessions();
    } else {
      setCrewSessions([]);
    }
  }, [conversationId, reloadCrewSessions]);

  const runSessionAction = useCallback(
    async (activityId: string, action: () => Promise<void>) => {
      setBusyActivityId(activityId);
      try {
        await action();
        await reloadCrewSessions();
        onAfterAction?.();
      } finally {
        setBusyActivityId(null);
      }
    },
    [onAfterAction, reloadCrewSessions]
  );

  const onJoin = useCallback(
    async (act: Activity) => {
      await runSessionAction(act.id, async () => {
        try {
          const result = await joinCrewGame(act.id);
          if (result === 'waitlisted') {
            Alert.alert(
              'Waitlist',
              'Game is full. You are on the waitlist if a spot opens.'
            );
          }
        } catch (error: unknown) {
          Alert.alert(
            'Join failed',
            error instanceof Error ? error.message : 'Could not join.'
          );
          throw error;
        }
      });
    },
    [runSessionAction]
  );

  const onConfirmIn = useCallback(
    async (act: Activity) => {
      await runSessionAction(act.id, async () => {
        try {
          await setGameReady(act.id, true);
        } catch (error: unknown) {
          Alert.alert(
            "Couldn't save",
            error instanceof Error ? error.message : 'Try again.'
          );
          throw error;
        }
      });
    },
    [runSessionAction]
  );

  const onUndoImIn = useCallback(
    (act: Activity) => {
      void runSessionAction(act.id, async () => {
        try {
          await setGameReady(act.id, false);
        } catch (error: unknown) {
          Alert.alert(
            "Couldn't save",
            error instanceof Error ? error.message : 'Try again.'
          );
          throw error;
        }
      });
    },
    [runSessionAction]
  );

  const onLockRoster = useCallback(
    async (act: Activity) => {
      await runSessionAction(act.id, async () => {
        try {
          await finalizeGameCommitment(act.id);
        } catch (error: unknown) {
          Alert.alert(
            'Lock failed',
            error instanceof Error ? error.message : 'Try again.'
          );
          throw error;
        }
      });
    },
    [runSessionAction]
  );

  const onNudge = useCallback(
    async (act: Activity) => {
      await runSessionAction(act.id, async () => {
        try {
          const count = await nudgeSessionRoster(act.id);
          Alert.alert(
            PRODUCT_COPY.nudgeRosterSent,
            `Reminder sent to ${count} player${count === 1 ? '' : 's'}.`
          );
        } catch (error: unknown) {
          Alert.alert(
            'Could not nudge',
            error instanceof Error ? error.message : 'Try again.'
          );
          throw error;
        }
      });
    },
    [runSessionAction]
  );

  const onOpenDetails = useCallback(
    (act: Activity) => {
      navigation.navigate(ROUTES.ACTIVITY.DETAIL, {
        activityId: act.id,
        fromGameRoom: true,
      });
    },
    [navigation]
  );

  const focusedSession = crewSessions.find((s) => s.activity_id === focusedActivityId);
  const bannerIsHost =
    Boolean(userId && crewHostId && userId === crewHostId) ||
    focusedSession?.activity?.user_id === userId;
  const crewPollsHost = Boolean(userId && crewHostId && userId === crewHostId);

  return {
    crewSessions,
    focusedActivityId,
    setFocusedActivityId,
    busyActivityId,
    crewHostId,
    bannerIsHost,
    crewPollsHost,
    reloadCrewSessions,
    sessionHandlers: {
      onJoin,
      onConfirmIn,
      onUndoImIn,
      onLockRoster,
      onNudge,
      onOpenDetails,
    },
  };
}

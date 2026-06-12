import { Alert } from 'react-native';
import { useMemo } from 'react';
import { PRODUCT_COPY } from '../constants/productCopy';
import {
  finalizeGameCommitment,
  nudgeSessionRoster,
  setGameReady,
} from '../services/activityService';
import { joinCrewGame } from '../services/regularGroupService';

type Options = {
  activityId: string;
  isHost: boolean;
  canNudge: boolean;
  setBusyActivityId: (id: string | null) => void;
  onReload: () => Promise<void>;
};

export type GameCardSessionActionHandlers = {
  onJoin: () => Promise<void>;
  onConfirmIn: () => Promise<void>;
  onUndoImIn?: () => void;
  onLockRoster: () => Promise<void>;
  onNudge?: () => Promise<void>;
};

/** Factory for list rendering — safe to call inside `.map()`. */
export function createGameCardSessionActions({
  activityId,
  isHost,
  canNudge,
  setBusyActivityId,
  onReload,
}: Options): GameCardSessionActionHandlers {
  const runBusy = async (fn: () => Promise<void>) => {
    setBusyActivityId(activityId);
    try {
      await fn();
      await onReload();
    } finally {
      setBusyActivityId(null);
    }
  };

  const onJoin = async () => {
    setBusyActivityId(activityId);
    try {
      const result = await joinCrewGame(activityId);
      if (result === 'waitlisted') {
        Alert.alert('Waitlist', 'Game is full. You are on the waitlist if a spot opens.');
      }
      await onReload();
    } catch (error: unknown) {
      Alert.alert('Join failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusyActivityId(null);
    }
  };

  const onConfirmIn = () => runBusy(() => setGameReady(activityId, true));
  const onLockRoster = () => runBusy(() => finalizeGameCommitment(activityId));

  const onUndoImIn = isHost
    ? undefined
    : () => {
        Alert.alert(PRODUCT_COPY.undoImInTitle, PRODUCT_COPY.undoImInBody, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: PRODUCT_COPY.undoImIn,
            style: 'destructive',
            onPress: () => {
              void runBusy(() => setGameReady(activityId, false));
            },
          },
        ]);
      };

  const onNudge = canNudge
    ? async () => {
        setBusyActivityId(activityId);
        try {
          const count = await nudgeSessionRoster(activityId);
          Alert.alert(
            PRODUCT_COPY.nudgeRosterSent,
            `Reminder sent to ${count} player${count === 1 ? '' : 's'}.`
          );
        } catch (error: unknown) {
          Alert.alert('Could not nudge', error instanceof Error ? error.message : 'Try again.');
        } finally {
          setBusyActivityId(null);
        }
      }
    : undefined;

  return {
    onJoin,
    onConfirmIn,
    onUndoImIn,
    onLockRoster,
    onNudge,
  };
}

/** Hook wrapper when a single activity id is stable for the component lifetime. */
export function useGameCardSessionActions(options: Options): GameCardSessionActionHandlers {
  return useMemo(
    () => createGameCardSessionActions(options),
    [
      options.activityId,
      options.isHost,
      options.canNudge,
      options.onReload,
      options.setBusyActivityId,
    ]
  );
}

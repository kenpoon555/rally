import { useMemo } from 'react';
import { Alert } from 'react-native';
import { PRODUCT_COPY } from '../constants/productCopy';
import {
  confirmUndoImIn,
  joinCrewGameWithFeedback,
  lockGameRoster,
  nudgeGameRoster,
  setGameReadyState,
  showNudgeSent,
} from '../services/gameCardSessionActions';

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
      await joinCrewGameWithFeedback(activityId);
      await onReload();
    } catch (error: unknown) {
      Alert.alert('Join failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusyActivityId(null);
    }
  };

  const onConfirmIn = () => runBusy(() => setGameReadyState(activityId, true));
  const onLockRoster = () => runBusy(() => lockGameRoster(activityId));

  const onUndoImIn = isHost
    ? undefined
    : () => {
        confirmUndoImIn(() => {
          void runBusy(() => setGameReadyState(activityId, false));
        });
      };

  const onNudge = canNudge
    ? async () => {
        setBusyActivityId(activityId);
        try {
          const count = await nudgeGameRoster(activityId);
          showNudgeSent(count);
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

import { Alert } from 'react-native';
import { PRODUCT_COPY } from '../constants/productCopy';
import {
  finalizeGameCommitment,
  nudgeSessionRoster,
  setGameReady,
} from './activityService';
import { joinCrewGame } from './regularGroupService';

export async function joinCrewGameWithFeedback(activityId: string): Promise<void> {
  const result = await joinCrewGame(activityId);
  if (result === 'waitlisted') {
    Alert.alert(PRODUCT_COPY.waitlistSectionTitle, PRODUCT_COPY.onWaitlistHint);
  }
}

export async function setGameReadyState(activityId: string, ready: boolean): Promise<void> {
  await setGameReady(activityId, ready);
}

export async function lockGameRoster(activityId: string): Promise<void> {
  await finalizeGameCommitment(activityId);
}

export async function nudgeGameRoster(activityId: string): Promise<number> {
  return nudgeSessionRoster(activityId);
}

export function confirmUndoImIn(onConfirm: () => void): void {
  Alert.alert(PRODUCT_COPY.undoImInTitle, PRODUCT_COPY.undoImInBody, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: PRODUCT_COPY.undoImIn,
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}

export function confirmLockRoster(onConfirm: () => void): void {
  Alert.alert(
    'Lock roster?',
    'Roster will lock. Only confirmed players stay on the court list.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lock roster', onPress: onConfirm },
    ]
  );
}

export function showNudgeSent(count: number): void {
  Alert.alert(
    PRODUCT_COPY.nudgeRosterSent,
    `Reminder sent to ${count} player${count === 1 ? '' : 's'}.`
  );
}

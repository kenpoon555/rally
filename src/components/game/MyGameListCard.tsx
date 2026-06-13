import React, { useMemo } from 'react';
import { MyGameEntry } from '../../services/activityService';
import {
  getApprovedParticipants,
  getMyGameListCardSpots,
  needsConfirmPlaying,
} from '../../utils/activityHelpers';
import { GameCardShell } from './GameCardShell';
import { gameListCardVariantForActivity } from '../../config/gameCardLayouts';
import { ImInTrailingAction } from './ImInTrailingAction';

export type MyGameListCardProps = {
  entry: MyGameEntry;
  userLocation?: { latitude: number; longitude: number } | null;
  busy?: boolean;
  muted?: boolean;
  showImInAction?: boolean;
  currentUserId?: string;
  actionBusy?: boolean;
  onPress: () => void;
  onConfirmIn?: () => void;
};

export const MyGameListCard: React.FC<MyGameListCardProps> = ({
  entry,
  userLocation,
  busy,
  muted,
  showImInAction,
  currentUserId,
  actionBusy,
  onPress,
  onConfirmIn,
}) => {
  const { activity, role } = entry;
  const isHost = role === 'host';
  const spots = getMyGameListCardSpots(activity);

  const trailingAction = useMemo(() => {
    if (!showImInAction) {
      return undefined;
    }
    const isFinalized = activity.match_status === 'finalized';
    const needsConfirm = !isHost && needsConfirmPlaying(activity, currentUserId);
    const approved = getApprovedParticipants(activity);
    const myJoinRequest = approved.find((row) => row.user_id === currentUserId);
    const isReady =
      isHost || isFinalized || Boolean(myJoinRequest?.ready_at);

    return (
      <ImInTrailingAction
        needsConfirm={needsConfirm}
        isReady={isReady}
        actionBusy={actionBusy}
        onConfirmIn={onConfirmIn}
      />
    );
  }, [
    activity,
    actionBusy,
    currentUserId,
    isHost,
    onConfirmIn,
    showImInAction,
  ]);

  return (
    <GameCardShell
      presetKey="myGamesRow"
      activity={activity}
      userLocation={userLocation}
      isHost={isHost}
      variant={gameListCardVariantForActivity(activity)}
      onPress={onPress}
      busy={busy}
      muted={muted}
      rosterCount={spots.rosterCount}
      capacityCount={spots.capacityCount}
      openSpots={spots.openSpots}
      showChevron={!showImInAction}
      trailingAction={trailingAction}
    />
  );
};

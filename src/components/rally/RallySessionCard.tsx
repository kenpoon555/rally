import React from 'react';
import { Activity } from '../../types/activity';
import { SessionCardPayload } from '../../types/sessionCard';
import { GAME_CARD_PRESETS } from '../../config/gameCardLayouts';
import { createGameCardSessionActions } from '../../hooks/useGameCardSessionActions';
import { CrewGameSessionCard } from '../CrewGameSessionCard';

type Props = {
  card: SessionCardPayload;
  activity: Activity;
  isCurrent: boolean;
  busyActivityId: string | null;
  setBusyActivityId: (id: string | null) => void;
  onReload: () => Promise<void>;
  onOpenDetails: (activityId: string) => void;
};

const preset = GAME_CARD_PRESETS.rallySession;

export const RallySessionCard: React.FC<Props> = ({
  card,
  activity,
  isCurrent,
  busyActivityId,
  setBusyActivityId,
  onReload,
  onOpenDetails,
}) => {
  const viewer = card.viewer;
  const actions = createGameCardSessionActions({
    activityId: activity.id,
    isHost: viewer.is_host,
    canNudge: viewer.can_nudge,
    setBusyActivityId,
    onReload,
  });

  return (
    <CrewGameSessionCard
      activity={activity}
      variant={preset.sessionVariant ?? 'default'}
      isCurrent={isCurrent}
      showActions={viewer.show_actions}
      isHost={viewer.is_host}
      isOnRoster={viewer.is_on_roster}
      isReady={viewer.is_ready}
      isFinalized={viewer.is_finalized}
      isWaitlisted={viewer.is_waitlisted}
      isFull={viewer.is_full}
      readyCount={card.ready_count}
      canLock={viewer.can_lock}
      lockReadiness={viewer.lock_readiness}
      waitlistPosition={viewer.waitlist_position}
      busy={busyActivityId === activity.id}
      onJoin={actions.onJoin}
      onConfirmIn={actions.onConfirmIn}
      onUndoImIn={actions.onUndoImIn}
      onLockRoster={actions.onLockRoster}
      showNudge={viewer.can_nudge}
      onNudge={actions.onNudge}
      onOpenDetails={() => onOpenDetails(activity.id)}
    />
  );
};

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConversationSessionCard } from '../types/sessionCard';
import { CrewGameSessionCard } from './CrewGameSessionCard';
import { colors, spacing, typography } from '../constants/theme';
import { activityFromSessionCard } from '../utils/sessionCardHelpers';
import { Activity } from '../types/activity';

type Props = {
  sessions: ConversationSessionCard[];
  focusedActivityId: string | undefined;
  busyActivityId?: string | null;
  onFocusActivity: (activityId: string) => void;
  onJoin: (activity: Activity) => void;
  onConfirmIn: (activity: Activity) => void;
  onUndoImIn: (activity: Activity) => void;
  onLockRoster: (activity: Activity) => void;
  onNudge: (activity: Activity) => void;
  onOpenDetails: (activity: Activity) => void;
};

export const CrewChatSessionList: React.FC<Props> = ({
  sessions,
  focusedActivityId,
  busyActivityId,
  onFocusActivity,
  onJoin,
  onConfirmIn,
  onUndoImIn,
  onLockRoster,
  onNudge,
  onOpenDetails,
}) => {
  const upcoming = sessions.filter((s) => s.card.status === 'active');
  const past = sessions.filter((s) => {
    const status = s.card.status;
    return status === 'completed' || status === 'cancelled';
  });

  const renderSession = (session: ConversationSessionCard) => {
    const card = session.card;
    const activity = activityFromSessionCard(card);
    const viewer = card.viewer;
    const isCurrent =
      session.activity_id === focusedActivityId || session.is_current;

    return (
      <CrewGameSessionCard
        key={session.conversation_activity_id}
        activity={activity}
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
        busy={busyActivityId === card.activity_id}
        onJoin={() => onJoin(activity)}
        onConfirmIn={() => onConfirmIn(activity)}
        onUndoImIn={() => onUndoImIn(activity)}
        onLockRoster={() => onLockRoster(activity)}
        showNudge={viewer.can_nudge}
        onNudge={() => onNudge(activity)}
        onOpenDetails={() => {
          onFocusActivity(card.activity_id);
          onOpenDetails(activity);
        }}
      />
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Games</Text>
      {upcoming.map(renderSession)}
      {past.length > 0 ? (
        <>
          <Text style={styles.pastTitle}>Past</Text>
          {past.slice(0, 5).map(renderSession)}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pastTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConversationActivity } from '../types/chat';
import { Activity } from '../types/activity';
import { CrewGameSessionCard } from './CrewGameSessionCard';
import { colors, spacing, typography } from '../constants/theme';

type Props = {
  sessions: ConversationActivity[];
  focusedActivityId: string | undefined;
  userId?: string;
  busyActivityId?: string | null;
  onFocusActivity: (activityId: string) => void;
  onJoin: (activity: Activity) => void;
  onConfirmIn: (activity: Activity) => void;
  onLockRoster: (activity: Activity) => void;
  onOpenDetails: (activity: Activity) => void;
};

export const CrewChatSessionList: React.FC<Props> = ({
  sessions,
  focusedActivityId,
  userId,
  busyActivityId,
  onFocusActivity,
  onJoin,
  onConfirmIn,
  onLockRoster,
  onOpenDetails,
}) => {
  const upcoming = sessions.filter((s) => {
    const a = s.activity;
    return a && a.status === 'active';
  });
  const past = sessions.filter((s) => {
    const a = s.activity;
    return a && (a.status === 'completed' || a.status === 'cancelled');
  });

  const renderSession = (session: ConversationActivity) => {
    const activity = session.activity;
    if (!activity) {
      return null;
    }
    const isHost = activity.user_id === userId;
    const myJoin = activity.join_requests?.find(
      (jr) => jr.user_id === userId && jr.status === 'approved'
    );
    const isOnRoster = isHost || Boolean(myJoin);
    const isReady = isHost || Boolean(myJoin?.ready_at);
    const isFinalized = activity.match_status === 'finalized';
    const isCurrent = session.activity_id === focusedActivityId || session.is_current;
    const endMs =
      new Date(activity.start_time).getTime() + (activity.duration ?? 60) * 60 * 1000;
    const isUpcoming =
      activity.status === 'active' && endMs >= Date.now() && activity.match_status !== 'finalized';
    const showActions = isUpcoming;

    return (
      <CrewGameSessionCard
        key={session.activity_id}
        activity={activity}
        isCurrent={isCurrent}
        showActions={showActions}
        isHost={isHost}
        isOnRoster={isOnRoster}
        isReady={isReady}
        isFinalized={isFinalized}
        busy={busyActivityId === activity.id}
        onJoin={() => onJoin(activity)}
        onConfirmIn={() => onConfirmIn(activity)}
        onLockRoster={() => onLockRoster(activity)}
        onOpenDetails={() => {
          onFocusActivity(activity.id);
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

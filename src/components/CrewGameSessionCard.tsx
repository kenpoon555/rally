import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '../types/activity';
import { Button } from './ui';
import { formatActivityTime } from '../utils/activityHelpers';
import { PRODUCT_COPY } from '../constants/productCopy';
import { SportBadge } from './SportBadge';
import { colors, radius, spacing, typography } from '../constants/theme';
import { SessionCardLockReadiness } from '../types/sessionCard';

export type CrewGameSessionCardProps = {
  activity: Activity;
  isCurrent: boolean;
  showActions: boolean;
  isHost: boolean;
  isOnRoster: boolean;
  isReady: boolean;
  isFinalized: boolean;
  isWaitlisted?: boolean;
  isFull?: boolean;
  busy?: boolean;
  readyCount?: number;
  canLock?: boolean;
  lockReadiness?: SessionCardLockReadiness;
  waitlistPosition?: number | null;
  onJoin?: () => void;
  onConfirmIn?: () => void;
  onUndoImIn?: () => void;
  onLockRoster?: () => void;
  onNudge?: () => void;
  showNudge?: boolean;
  onOpenDetails?: () => void;
};

export const CrewGameSessionCard: React.FC<CrewGameSessionCardProps> = ({
  activity,
  isCurrent,
  showActions,
  isHost,
  isOnRoster,
  isReady,
  isFinalized,
  isWaitlisted = false,
  isFull = false,
  busy,
  readyCount,
  canLock = true,
  lockReadiness,
  waitlistPosition,
  onJoin,
  onConfirmIn,
  onUndoImIn,
  onLockRoster,
  onNudge,
  showNudge = false,
  onOpenDetails,
}) => {
  const court = activity.location?.name || 'Court TBD';
  const timeLabel = formatActivityTime(activity.start_time, activity.duration);
  const rosterCount = activity.player_count ?? 1;
  const openSpots = activity.missing_players ?? 0;
  const isPast = activity.status === 'completed' || activity.status === 'cancelled';
  const resolvedReadyCount = readyCount ?? rosterCount;
  const lockHint =
    isHost && !isFinalized && lockReadiness === 'ready'
      ? ' · Ready to lock'
      : isHost && !isFinalized && lockReadiness === 'waiting_im_in'
        ? ' · Waiting on I\'m in'
        : isHost && !isFinalized && lockReadiness === 'needs_players'
          ? ' · Need more players'
          : '';

  return (
    <View style={[styles.card, isCurrent && styles.cardCurrent, isPast && styles.cardPast]}>
      <TouchableOpacity onPress={onOpenDetails} disabled={!onOpenDetails}>
        <SportBadge sport={activity.sport_type} style={styles.sportBadge} />
        <Text style={styles.title}>{court}</Text>
        <Text style={styles.meta}>
          {timeLabel} · {rosterCount} in ·{' '}
          {openSpots > 0 ? `${openSpots} open` : PRODUCT_COPY.gameFull}
          {` · ${resolvedReadyCount} ready`}
          {isFinalized ? ' · Roster locked' : lockHint}
          {isWaitlisted
            ? ` · ${PRODUCT_COPY.onWaitlist}${waitlistPosition ? ` #${waitlistPosition}` : ''}`
            : ''}
        </Text>
        {isWaitlisted ? (
          <Text style={styles.waitlistHint}>{PRODUCT_COPY.onWaitlistHint}</Text>
        ) : null}
        {activity.session_note ? (
          <Text style={styles.sessionNote}>{activity.session_note}</Text>
        ) : null}
        {activity.cost_note ? (
          <Text style={styles.costNote}>Cost: {activity.cost_note}</Text>
        ) : null}
      </TouchableOpacity>

      {!isPast && showActions ? (
        <View style={styles.actions}>
          {isWaitlisted ? (
            <Text style={styles.waitlistBadge}>{PRODUCT_COPY.onWaitlist}</Text>
          ) : null}
          {!isOnRoster && !isWaitlisted && !isHost && onJoin ? (
            <Button
              title={isFull ? PRODUCT_COPY.joinWaitlist : 'Join game'}
              size="sm"
              variant={isFull ? 'secondary' : 'primary'}
              onPress={onJoin}
              disabled={busy}
              loading={busy}
            />
          ) : null}
          {isOnRoster && !isReady && !isFinalized && onConfirmIn ? (
            <Button
              title={busy ? 'Saving…' : "I'm in"}
              size="sm"
              onPress={onConfirmIn}
              disabled={busy}
            />
          ) : null}
          {isOnRoster && isReady && !isFinalized && onUndoImIn ? (
            <Button
              title={PRODUCT_COPY.undoImIn}
              size="sm"
              variant="secondary"
              onPress={onUndoImIn}
              disabled={busy}
            />
          ) : null}
          {isOnRoster && isReady && !isFinalized && !onUndoImIn ? (
            <Text style={styles.readyLabel}>{PRODUCT_COPY.imInConfirm}</Text>
          ) : null}
          {isHost && !isFinalized && showNudge && onNudge ? (
            <Button
              title={PRODUCT_COPY.nudgeRoster}
              variant="ghost"
              size="sm"
              onPress={onNudge}
              disabled={busy}
            />
          ) : null}
          {isHost && !isFinalized && onLockRoster ? (
            <Button
              title="Lock roster"
              variant="secondary"
              size="sm"
              onPress={onLockRoster}
              disabled={busy || !canLock}
            />
          ) : null}
          {busy ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCurrent: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardPast: {
    opacity: 0.75,
  },
  sportBadge: {
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sessionNote: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  costNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  readyLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.success,
  },
  waitlistHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  waitlistBadge: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.warning,
  },
});

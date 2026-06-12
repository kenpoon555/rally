import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../types/activity';
import { Button } from './ui';
import {
  formatActivityTime,
} from '../utils/activityHelpers';
import { RosterSeatBar } from './game/RosterSeatBar';
import { GameCardParticipantStack } from './game/GameCardParticipantStack';
import { PRODUCT_COPY } from '../constants/productCopy';
import { SportBadge } from './SportBadge';
import { SportIconForSurface } from './SportIconForSurface';
import { getSportMetadata } from '../constants/sports';
import { colors, radius, spacing, typography } from '../constants/theme';
import { SessionCardLockReadiness } from '../types/sessionCard';
export type CrewGameSessionCardVariant = 'default' | 'rally';

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
  variant?: CrewGameSessionCardVariant;
  onJoin?: () => void;
  onConfirmIn?: () => void;
  onUndoImIn?: () => void;
  onLockRoster?: () => void;
  onNudge?: () => void;
  showNudge?: boolean;
  onOpenDetails?: () => void;
};

function YourGameTag() {
  return (
    <View style={styles.yourGameTag}>
      <Ionicons name="people" size={12} color={colors.text} />
      <Text style={styles.yourGameText}>{PRODUCT_COPY.yourGame}</Text>
    </View>
  );
}

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
  variant = 'default',
  onJoin,
  onConfirmIn,
  onUndoImIn,
  onLockRoster,
  onNudge,
  showNudge = false,
  onOpenDetails,
}) => {
  const isRally = variant === 'rally';
  const court = activity.location?.name || 'Court TBD';
  const timeLabel = formatActivityTime(activity.start_time, activity.duration);
  const rosterCount = activity.player_count ?? 1;
  const isPast = activity.status === 'completed' || activity.status === 'cancelled';
  const resolvedReadyCount = readyCount ?? rosterCount;
  const listingTitle = activity.listing_title?.trim();
  const lockHint =
    isHost && !isFinalized && lockReadiness === 'ready'
      ? ' · Ready to lock'
      : isHost && !isFinalized && lockReadiness === 'waiting_im_in'
        ? " · Waiting on I'm in"
        : isHost && !isFinalized && lockReadiness === 'needs_players'
          ? ' · Need more players'
          : '';

  const headline = isRally
    ? listingTitle || timeLabel
    : court;

  const statusBits = [
    !isFinalized && resolvedReadyCount > 1 ? `${resolvedReadyCount} ready` : null,
    isFinalized ? 'Roster locked' : null,
    lockHint ? lockHint.replace(/^ · /, '') : null,
    isWaitlisted
      ? `${PRODUCT_COPY.onWaitlist}${waitlistPosition ? ` #${waitlistPosition}` : ''}`
      : null,
  ].filter(Boolean);

  const metaLine = isRally
    ? statusBits.join(' · ')
    : [timeLabel, ...statusBits].join(' · ');

  const noteParts = [
    activity.session_note?.trim(),
    activity.cost_note?.trim() ? activity.cost_note.trim() : null,
  ].filter(Boolean);

  const showYourGameTag = isRally && !isPast && (isOnRoster || isHost);
  const sportLabel = getSportMetadata(activity.sport_type)?.shortLabel ?? activity.sport_type;

  return (
    <View
      style={[
        styles.card,
        isRally && styles.cardRally,
        isCurrent && styles.cardCurrent,
        isPast && styles.cardPast,
      ]}
    >
      <TouchableOpacity onPress={onOpenDetails} disabled={!onOpenDetails}>
        {!isRally ? <SportBadge sport={activity.sport_type} style={styles.sportBadge} /> : null}
        {isRally ? (
          <View style={styles.rallyHeaderRow}>
            <SportIconForSurface
              sport={activity.sport_type}
              surface="rallySessionCard"
              style={styles.rallySportIcon}
            />
            <View style={styles.rallyHeaderMain}>
              <Text style={[styles.title, styles.titleRally]} numberOfLines={2}>
                {headline}
              </Text>
              <Text style={styles.rallySportLabel} numberOfLines={1}>
                {sportLabel}
              </Text>
            </View>
            {showYourGameTag ? <YourGameTag /> : null}
          </View>
        ) : null}
        {isRally && listingTitle ? (
          <Text style={styles.subline} numberOfLines={1}>
            {timeLabel}
          </Text>
        ) : null}
        {!isRally ? (
          <Text style={styles.title} numberOfLines={1}>
            {court}
          </Text>
        ) : null}
        {metaLine ? (
          <Text style={styles.meta} numberOfLines={2}>
            {metaLine}
          </Text>
        ) : null}
        <View style={styles.seatBar}>
          <RosterSeatBar
            sportType={activity.sport_type}
            activity={activity}
            onRoster={rosterCount}
            variant="wide"
            align="left"
          />
        </View>
        {isWaitlisted ? (
          <Text style={styles.waitlistHint}>{PRODUCT_COPY.onWaitlistHint}</Text>
        ) : null}
        {!isPast && noteParts.length > 0 ? (
          <Text style={styles.sessionNote} numberOfLines={2}>
            {noteParts.join(' · ')}
          </Text>
        ) : null}
        {isRally && onOpenDetails ? (
          <View style={styles.openRow}>
            <Text style={styles.openLink}>{isPast ? 'View summary' : 'View game'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
        ) : null}
        <GameCardParticipantStack activity={activity} maxVisible={4} style={styles.avatarRow} />
      </TouchableOpacity>

      {!isPast && showActions ? (
        <View style={[styles.actions, isRally && styles.actionsRally]}>
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
          {isOnRoster && isReady && !isFinalized && isHost ? (
            <Text style={styles.readyLabel}>{PRODUCT_COPY.hostingConfirm}</Text>
          ) : null}
          {isOnRoster && isReady && !isFinalized && !isHost && onUndoImIn ? (
            <>
              <Text style={styles.readyLabel}>{PRODUCT_COPY.imInConfirm}</Text>
              <Button
                title={busy ? 'Saving…' : PRODUCT_COPY.undoImIn}
                size="sm"
                variant="ghost"
                onPress={onUndoImIn}
                disabled={busy}
              />
            </>
          ) : null}
          {isOnRoster && isReady && !isFinalized && !isHost && !onUndoImIn ? (
            <Text style={styles.readyLabel}>{PRODUCT_COPY.imInConfirm}</Text>
          ) : null}
          {isOnRoster && !isReady && !isFinalized && !isHost && onConfirmIn ? (
            <Button
              title={busy ? 'Saving…' : PRODUCT_COPY.imIn}
              size="sm"
              variant="secondary"
              onPress={onConfirmIn}
              disabled={busy}
            />
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
  cardRally: {
    marginHorizontal: 0,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cardCurrent: {
    borderColor: colors.accent,
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
  titleRally: {
    marginTop: 0,
    fontSize: 15,
    lineHeight: 20,
  },
  rallyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rallySportIcon: {
    marginRight: 0,
    marginTop: 2,
  },
  rallyHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  rallySportLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  yourGameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    flexShrink: 0,
    marginTop: 2,
  },
  yourGameText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  subline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  seatBar: {
    marginTop: spacing.sm,
  },
  sessionNote: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  actionsRally: {
    marginTop: spacing.xs,
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
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  openLink: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  avatarRow: {
    marginTop: spacing.sm,
  },
});

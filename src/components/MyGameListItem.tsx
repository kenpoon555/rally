import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '../types/activity';
import { MyGameRole } from '../services/activityService';
import { formatActivityTime, getGameStatusLabel, isPastGameActivity, isTonightUrgency } from '../utils/activityHelpers';
import { colors, radius, shadows, spacing, typography } from '../constants/theme';
import { Badge } from './ui';

interface MyGameListItemProps {
  activity: Activity;
  role: MyGameRole;
  onPress: () => void;
  busy?: boolean;
}

const MyGameListItem: React.FC<MyGameListItemProps> = ({ activity, role, onPress, busy }) => {
  const timeLabel = formatActivityTime(activity.start_time, activity.duration);
  const statusLabel = getGameStatusLabel(activity);
  const isPast =
    isPastGameActivity(activity) ||
    statusLabel === 'Expired' ||
    statusLabel === 'Played' ||
    statusLabel === 'Cancelled';
  const showTonight = !isPast && isTonightUrgency(activity);

  const statusTone =
    statusLabel === 'Expired' || statusLabel === 'Played' || statusLabel === 'Cancelled'
      ? 'muted'
      : statusLabel === 'Open'
        ? 'primary'
        : statusLabel === 'Finalized'
          ? 'success'
          : 'default';

  return (
    <TouchableOpacity
      style={[styles.card, isPast && styles.cardPast]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={busy}
    >
      <View style={styles.row}>
        <Text style={styles.sport}>{activity.sport_type}</Text>
        <View style={styles.badgeRow}>
          {isPast ? (
            <>
              {role === 'host' ? (
                <Badge label="Hosted" tone="primary" />
              ) : role === 'waitlisted' ? (
                <Badge label="Waitlist" tone="accent" />
              ) : null}
              <Badge label={statusLabel} tone={statusTone} style={styles.badgeGap} />
            </>
          ) : (
            <>
              <Badge
                label={
                  role === 'host' ? 'Hosting' : role === 'waitlisted' ? 'Waitlist' : 'Joined'
                }
                tone={
                  role === 'host' ? 'primary' : role === 'waitlisted' ? 'accent' : 'success'
                }
              />
              {statusLabel !== 'Open' ? (
                <Badge label={statusLabel} tone={statusTone} style={styles.badgeGap} />
              ) : null}
              {activity.visibility === 'invite_only' ? (
                <Badge label="Invite" tone="muted" style={styles.badgeGap} />
              ) : null}
              {showTonight ? (
                <Badge label="Tonight" tone="accent" style={styles.badgeGap} />
              ) : null}
            </>
          )}
        </View>
      </View>
      <Text style={styles.location} numberOfLines={1}>
        {activity.location?.name || 'Court TBD'}
      </Text>
      <Text style={styles.meta}>{timeLabel}</Text>
      {!isPast ? (
        <Text style={styles.meta}>
          {activity.player_count} player{activity.player_count === 1 ? '' : 's'}
        </Text>
      ) : null}
      {busy ? <ActivityIndicator size="small" color={colors.primary} style={styles.busy} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardPast: {
    paddingVertical: spacing.sm + 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  badgeGap: {
    marginLeft: spacing.xs + 2,
  },
  sport: {
    ...typography.bodyMedium,
    flex: 1,
    marginRight: spacing.sm,
  },
  location: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
  busy: {
    marginTop: spacing.sm,
  },
});

export default MyGameListItem;

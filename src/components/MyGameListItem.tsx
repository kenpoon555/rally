import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '../types/activity';
import { MyGameRole } from '../services/activityService';
import { formatActivityTime, getGameStatusLabel } from '../utils/activityHelpers';
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

  const statusTone =
    statusLabel === 'Played'
      ? 'muted'
      : statusLabel === 'Open'
        ? 'primary'
        : statusLabel === 'Finalized'
          ? 'success'
          : 'default';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={busy}
    >
      <View style={styles.row}>
        <Text style={styles.sport}>{activity.sport_type}</Text>
        <View style={styles.badgeRow}>
          <Badge label={role === 'host' ? 'Hosting' : 'Joined'} tone={role === 'host' ? 'primary' : 'success'} />
          <Badge label={statusLabel} tone={statusTone} style={styles.badgeGap} />
          {activity.visibility === 'invite_only' ? (
            <Badge label="Invite" tone="muted" style={styles.badgeGap} />
          ) : null}
          {activity.urgency_level === 'tonight' ? (
            <Badge label="Tonight" tone="accent" style={styles.badgeGap} />
          ) : null}
        </View>
      </View>
      <Text style={styles.location} numberOfLines={1}>
        {activity.location?.name || 'Court TBD'}
      </Text>
      <Text style={styles.meta}>{timeLabel}</Text>
      <Text style={styles.meta}>
        {activity.player_count} player{activity.player_count === 1 ? '' : 's'}
      </Text>
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

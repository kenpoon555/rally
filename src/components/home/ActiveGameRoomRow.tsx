import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SportIcon } from '../SportIcon';
import { MyGameEntry } from '../../services/activityService';
import { activityListingHeadline } from '../../constants/playIntent';
import {
  formatRosterSummary,
  getActivityRosterSummary,
  getDistanceToActivity,
} from '../../utils/activityHelpers';
import { formatRelativeStart } from '../../utils/formatRelativeStart';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { isSameCalendarDay } from '../../utils/todayDateUtils';

const METERS_PER_MILE = 1609.344;

export interface ActiveGameRoomRowProps {
  entry: MyGameEntry;
  onPress: () => void;
  busy?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

function formatWhen(startTime?: string | null): string {
  if (!startTime) {
    return 'Time TBD';
  }
  const date = new Date(startTime);
  const now = new Date();
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isSameCalendarDay(date, now)) {
    return `Today ${timeStr}`;
  }
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dayStr} · ${timeStr}`;
}

function formatMiles(distanceMeters: number | null): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return null;
  }
  const miles = distanceMeters / METERS_PER_MILE;
  return miles < 0.1 ? '<0.1 mi' : `${miles.toFixed(1)} mi`;
}

export const ActiveGameRoomRow: React.FC<ActiveGameRoomRowProps> = ({
  entry,
  onPress,
  busy,
  userLocation,
}) => {
  const { activity, role } = entry;
  const court = activity.location?.name || 'Court TBD';
  const title = activityListingHeadline(activity);
  const whenLabel = formatWhen(activity.start_time);
  const relativeLabel = formatRelativeStart(activity.start_time);
  const distanceMeters = userLocation ? getDistanceToActivity(activity, userLocation) : null;
  const milesLabel = formatMiles(distanceMeters);
  const { onRoster, capacity } = getActivityRosterSummary(activity);
  const rosterLine = formatRosterSummary(activity);
  const durationLabel = activity.duration ? `${activity.duration} min` : null;

  const metaParts = useMemo(
    () => [whenLabel, relativeLabel, milesLabel, durationLabel].filter(Boolean),
    [whenLabel, relativeLabel, milesLabel, durationLabel]
  );

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={busy} activeOpacity={0.9}>
      <SportIcon sport={activity.sport_type} size="sm" style={styles.icon} />
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {court}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.chip, role === 'host' ? styles.chipHost : styles.chipJoined]}>
            <Text style={styles.chipText}>{role === 'host' ? 'Hosting' : 'Joined'}</Text>
          </View>
          <Text style={styles.spots}>
            {onRoster}/{Math.max(capacity, onRoster)} · {rosterLine}
          </Text>
        </View>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: spacing.sm,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textTertiary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chipHost: {
    backgroundColor: colors.infoSoft,
  },
  chipJoined: {
    backgroundColor: colors.successSoft,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  spots: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

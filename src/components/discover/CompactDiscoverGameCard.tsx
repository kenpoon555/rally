import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '../../types/activity';
import { SportIcon } from '../SportIcon';
import { activityListingHeadline } from '../../constants/playIntent';
import { getDistanceToActivity, isTonightUrgency } from '../../utils/activityHelpers';
import { formatApproximateDistance } from '../../utils/approximateLocation';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

const METERS_PER_MILE = 1609.344;

type Props = {
  activity: Activity;
  userLocation?: { latitude: number; longitude: number } | null;
  isHost?: boolean;
  variant?: 'open' | 'locked_welcoming';
  onPress: () => void;
};

function formatTimeShort(startTime?: string | null): string {
  if (!startTime) {
    return 'TBD';
  }
  return new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMiles(distanceMeters: number | null, approximate: boolean): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return null;
  }
  if (approximate) {
    return formatApproximateDistance(distanceMeters);
  }
  const miles = distanceMeters / METERS_PER_MILE;
  return miles < 0.1 ? '<0.1 mi' : `${miles.toFixed(1)} mi`;
}

const SpotDots: React.FC<{ filled: number; total: number }> = ({ filled, total }) => {
  const slots = Math.min(Math.max(total, 1), 10);
  const filledCount = Math.min(filled, slots);

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: slots }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index < filledCount ? styles.dotFilled : styles.dotEmpty]}
        />
      ))}
    </View>
  );
};

export const CompactDiscoverGameCard: React.FC<Props> = ({
  activity,
  userLocation,
  isHost = false,
  variant = 'open',
  onPress,
}) => {
  const isLockedWelcoming = variant === 'locked_welcoming';
  const isUrgent = isTonightUrgency(activity) && !isLockedWelcoming;
  const missing = activity.missing_players ?? 0;
  const total = activity.player_count + missing;
  const title = activityListingHeadline(activity);
  const venue = activity.location?.name ?? 'Court TBD';
  const timeLabel = formatTimeShort(activity.start_time);
  const distanceMeters = userLocation ? getDistanceToActivity(activity, userLocation) : null;
  const distanceLabel = formatMiles(distanceMeters, !isHost);

  const accentColor = useMemo(() => {
    if (isLockedWelcoming) {
      return colors.primary;
    }
    if (isUrgent) {
      return colors.accent;
    }
    return 'transparent';
  }, [isLockedWelcoming, isUrgent]);

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {accentColor !== 'transparent' ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={styles.body}>
        <SportIcon sport={activity.sport_type} size="sm" style={styles.sportIcon} />
        <View style={styles.main}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {isUrgent ? (
              <View style={styles.tonightBadge}>
                <Text style={styles.tonightText}>Tonight</Text>
              </View>
            ) : null}
            {isLockedWelcoming ? (
              <View style={styles.finalizedBadge}>
                <Text style={styles.finalizedText}>
                  Finalized · {missing} {missing === 1 ? 'spot' : 'spots'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.venue} numberOfLines={1}>
            {venue}
          </Text>
          <SpotDots filled={activity.player_count} total={total} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.time}>{timeLabel}</Text>
          {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardUrgent: {
    borderColor: colors.accentSoft,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + 2,
    gap: spacing.sm,
  },
  sportIcon: {
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    flexShrink: 1,
  },
  venue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tonightBadge: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tonightText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  finalizedBadge: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  finalizedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  distance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

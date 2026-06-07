import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { activityCourtName, activityGameName } from '../../constants/playIntent';
import {
  formatDistance,
  getDistanceToActivity,
  isTonightUrgency,
} from '../../utils/activityHelpers';
import { bucketDistanceMeters } from '../../utils/approximateLocation';
import { formatDiscoverWhenLine } from '../../utils/todayDateUtils';
import { getSportIconName } from '../SportIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

const METERS_PER_MILE = 1609.344;
const ICON_GLYPH = 34;
const ICON_COLUMN = 42;
const CARD_MIN_HEIGHT = 88;

export type GameListCardVariant = 'open' | 'locked_welcoming' | 'my_game';

export function gameListCardVariantForActivity(activity: Activity): GameListCardVariant {
  const missing = activity.missing_players ?? 0;
  if (activity.match_status === 'finalized' && missing > 0) {
    return 'locked_welcoming';
  }
  return 'my_game';
}

export type GameListCardProps = {
  activity: Activity;
  userLocation?: { latitude: number; longitude: number } | null;
  isHost?: boolean;
  variant?: GameListCardVariant;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  rosterCount?: number;
  capacityCount?: number;
  openSpots?: number;
  showChevron?: boolean;
  trailingAction?: React.ReactNode;
  muted?: boolean;
};

export function formatGameCardDistance(
  distanceMeters: number | null,
  approximate: boolean
): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return null;
  }
  if (approximate) {
    const bucketed = bucketDistanceMeters(distanceMeters);
    const miles = bucketed / METERS_PER_MILE;
    if (miles < 0.4) {
      return 'Nearby';
    }
    if (miles < 10) {
      return `~${miles.toFixed(1)} mi away`;
    }
    return `~${Math.round(miles)} mi away`;
  }
  return formatDistance(distanceMeters);
}

export const GameListSpotsMeter: React.FC<{
  roster: number;
  capacity: number;
  open: number;
}> = ({ roster, capacity, open }) => {
  const slots = Math.min(Math.max(capacity, 1), 10);
  const onRoster = Math.min(roster, slots);
  const fillPct = slots > 0 ? (onRoster / slots) * 100 : 0;

  return (
    <View style={styles.spotsBlock}>
      <Text style={styles.spotsLabel}>
        {open > 0 ? `${open} / ${slots} spots left` : 'Full'}
      </Text>
      <View style={styles.spotsTrack}>
        <View style={[styles.spotsFill, { width: `${fillPct}%` }]} />
      </View>
    </View>
  );
};

function resolveSpots(
  activity: Activity,
  rosterCount?: number,
  capacityCount?: number,
  openSpots?: number
) {
  const missing = activity.missing_players ?? 0;
  const roster = rosterCount ?? activity.player_count;
  const capacity = capacityCount ?? roster + missing;
  const open = openSpots ?? missing;
  return { roster, capacity, open };
}

const GameListCardComponent: React.FC<GameListCardProps> = ({
  activity,
  userLocation,
  isHost = false,
  variant = 'open',
  onPress,
  disabled,
  busy,
  rosterCount,
  capacityCount,
  openSpots,
  showChevron = true,
  trailingAction,
  muted = false,
}) => {
  const isLockedWelcoming = variant === 'locked_welcoming';
  const isUrgent = isTonightUrgency(activity) && !isLockedWelcoming;
  const missing = activity.missing_players ?? 0;
  const hasCustomTitle = Boolean(activity.listing_title?.trim());
  const headline = hasCustomTitle ? activityGameName(activity) : activityCourtName(activity);
  const courtName = activityCourtName(activity);
  const whenLine = formatDiscoverWhenLine(activity.start_time);
  const distanceMeters = userLocation ? getDistanceToActivity(activity, userLocation) : null;
  const distanceLabel = formatGameCardDistance(distanceMeters, !isHost);
  const sportIcon = getSportIconName(activity.sport_type);
  const spots = resolveSpots(activity, rosterCount, capacityCount, openSpots);

  const accentColor = useMemo(() => {
    if (isLockedWelcoming) {
      return colors.primary;
    }
    if (isUrgent) {
      return colors.accent;
    }
    return 'transparent';
  }, [isLockedWelcoming, isUrgent]);

  const bodyPaddingLeft = accentColor !== 'transparent' ? spacing.md + 4 : spacing.md;
  const trailingWidth = trailingAction ? 88 : 76;

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent, muted && styles.cardMuted]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || busy}
    >
      {accentColor !== 'transparent' ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={[styles.body, { paddingLeft: bodyPaddingLeft }]}>
        <View style={styles.iconColumn}>
          <MaterialCommunityIcons name={sportIcon} size={ICON_GLYPH} color={colors.text} />
        </View>

        <View style={styles.main}>
          <View style={styles.titleRow}>
            <Text style={styles.headline} numberOfLines={1}>
              {headline}
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

          {hasCustomTitle ? (
            <Text style={styles.courtLine} numberOfLines={1}>
              {courtName}
            </Text>
          ) : null}

          <Text style={styles.whenLine} numberOfLines={1}>
            {whenLine}
          </Text>

          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.distance} numberOfLines={1}>
              {distanceLabel ?? 'Distance unavailable'}
            </Text>
          </View>
        </View>

        <View style={[styles.trailing, { width: trailingWidth }]}>
          {busy && !trailingAction ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : showChevron && !trailingAction ? (
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          ) : null}
          <GameListSpotsMeter
            roster={spots.roster}
            capacity={spots.capacity}
            open={spots.open}
          />
          {trailingAction ?? null}
        </View>
      </View>

      {busy && trailingAction ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
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
    minHeight: CARD_MIN_HEIGHT,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.md,
    minHeight: CARD_MIN_HEIGHT,
  },
  iconColumn: {
    width: ICON_COLUMN,
    height: ICON_COLUMN,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  headline: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  courtLine: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  whenLine: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 16,
  },
  distance: {
    fontSize: 12,
    color: colors.textTertiary,
    flexShrink: 1,
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
  trailing: {
    minHeight: ICON_COLUMN,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: spacing.xs,
  },
  spotsBlock: {
    alignItems: 'flex-end',
    width: 72,
    gap: 4,
  },
  spotsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  spotsTrack: {
    width: 72,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  spotsFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMuted: {
    opacity: 0.72,
  },
});

export const GameListCard = React.memo(GameListCardComponent);

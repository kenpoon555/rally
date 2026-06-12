import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { activityCourtName, activityGameName } from '../../constants/playIntent';
import {
  formatDistance,
  getActivityRosterSummary,
  getDistanceToActivity,
  getGameListSpotsBadgeLabel,
  isTonightUrgency,
} from '../../utils/activityHelpers';
import { bucketDistanceMeters } from '../../utils/approximateLocation';
import { formatDiscoverWhenLine } from '../../utils/todayDateUtils';
import { SportIconFromPreset } from '../SportIconForSurface';
import type { SportIconPreset } from '../../config/sportIconPresets';
import { getSportIconPreset } from '../../config/sportIconPresets';
import { GameCardParticipantStack } from './GameCardParticipantStack';
import { GAME_LIST_SIGNAL_COLUMN, GameListStatusSignal } from './GameListStatusSignal';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import {
  type GameListCardVariant,
  gameListCardVariantForActivity,
} from '../../config/gameCardLayouts';

export type { GameListCardVariant };
export { gameListCardVariantForActivity };

const METERS_PER_MILE = 1609.344;
const CARD_MIN_HEIGHT = 88;

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
  showWhoGoing?: boolean;
  /** Play discover uses status dot/lock; Today uses sport icon preset. */
  showStatusSignal?: boolean;
  /** When status signal is off, which sport icon preset to render. */
  sportIconPreset?: SportIconPreset | null;
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

export { RosterSeatBar, RosterFillBadge, GameListSpotsMeter } from './RosterSeatBar';

function resolveSpots(activity: Activity, rosterCount?: number) {
  const summary = getActivityRosterSummary(activity);
  return rosterCount ?? summary.onRoster;
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
  capacityCount: _capacityCount,
  openSpots: _openSpots,
  showChevron = true,
  trailingAction,
  muted = false,
  showWhoGoing = false,
  showStatusSignal = true,
  sportIconPreset,
}) => {
  const isLockedWelcoming = variant === 'locked_welcoming';
  const isUrgent = isTonightUrgency(activity) && !isLockedWelcoming;
  const hasCustomTitle = Boolean(activity.listing_title?.trim());
  const headline = hasCustomTitle ? activityGameName(activity) : activityCourtName(activity);
  const courtName = activityCourtName(activity);
  const whenLine = formatDiscoverWhenLine(activity.start_time);
  const distanceMeters = userLocation ? getDistanceToActivity(activity, userLocation) : null;
  const distanceLabel = formatGameCardDistance(distanceMeters, !isHost);

  const spotsBadgeLabel = useMemo(
    () => getGameListSpotsBadgeLabel(activity, isLockedWelcoming),
    [activity, isLockedWelcoming]
  );

  const trailingWidth = trailingAction ? 96 : 76;
  const leadingColumnWidth = showStatusSignal ? GAME_LIST_SIGNAL_COLUMN : 42;
  const listIconPreset = sportIconPreset ?? getSportIconPreset('todayGameList');

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent, muted && styles.cardMuted]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || busy}
    >
      <View style={styles.body}>
        <View style={[styles.leadingColumn, { width: leadingColumnWidth }]}>
          {showStatusSignal ? (
            <GameListStatusSignal locked={isLockedWelcoming} />
          ) : (
            <SportIconFromPreset sport={activity.sport_type} preset={listIconPreset} />
          )}
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
          </View>

          {hasCustomTitle ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {courtName}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {whenLine}
            </Text>
          </View>

          {distanceLabel ? (
            <Text style={styles.distance} numberOfLines={1}>
              {distanceLabel}
            </Text>
          ) : null}

          {showWhoGoing ? (
            <GameCardParticipantStack activity={activity} maxVisible={4} style={styles.avatarRow} />
          ) : null}
        </View>

        <View style={[styles.trailing, { width: trailingWidth }]}>
          <View
            style={[
              styles.spotsBadge,
              isLockedWelcoming ? styles.spotsBadgeLocked : styles.spotsBadgeOpen,
            ]}
          >
            <Text
              style={[
                styles.spotsBadgeText,
                isLockedWelcoming ? styles.spotsBadgeTextLocked : styles.spotsBadgeTextOpen,
              ]}
              numberOfLines={1}
            >
              {spotsBadgeLabel}
            </Text>
          </View>
          {busy && !trailingAction ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : showChevron && !trailingAction ? (
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          ) : null}
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
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    minHeight: CARD_MIN_HEIGHT,
  },
  leadingColumn: {
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 16,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  distance: {
    fontSize: 12,
    color: colors.textTertiary,
    flexShrink: 1,
  },
  avatarRow: {
    marginTop: spacing.xs,
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
    color: colors.primaryDark,
  },
  trailing: {
    minHeight: GAME_LIST_SIGNAL_COLUMN,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    gap: spacing.xs,
  },
  spotsBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: 96,
  },
  spotsBadgeOpen: {
    backgroundColor: colors.primaryLight,
  },
  spotsBadgeLocked: {
    backgroundColor: colors.accentSoft,
  },
  spotsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  spotsBadgeTextOpen: {
    color: colors.primaryDark,
  },
  spotsBadgeTextLocked: {
    color: colors.text,
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

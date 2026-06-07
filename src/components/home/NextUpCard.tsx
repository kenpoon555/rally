import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../ui';
import { MyGameEntry } from '../../services/activityService';
import { RegularGroup } from '../../types/regularGroup';
import { activityCourtName, activityGameName } from '../../constants/playIntent';
import {
  formatRosterSummary,
  getActivityRosterSummary,
  getDistanceToActivity,
  getMyGameListCardSpots,
  isTonightUrgency,
} from '../../utils/activityHelpers';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { formatGameCardDistance, GameListSpotsMeter } from '../game/GameListCard';
import { formatDiscoverWhenLine } from '../../utils/todayDateUtils';
import { getSportIconName } from '../SportIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import type { HostLockReadiness } from '../../utils/activityHelpers';

const LA_FALLBACK = { latitude: 34.0522, longitude: -118.2437 };
const MAP_HEIGHT = 120;

export interface NextUpCardProps {
  nextGame: MyGameEntry | null;
  fallbackGroup: RegularGroup | null;
  currentUserId?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onOpenGameRoom: (entry: MyGameEntry) => void;
  onScheduleNext: (sourceActivityId: string) => void;
  openingGameId?: string | null;
  footerHint?: string;
  hostLock?: {
    readiness: HostLockReadiness;
    hint: string;
  };
}

function rosterStatusLabel(activity: MyGameEntry['activity']): string {
  const status = activity.match_status ?? 'open';
  if (status === 'finalized') {
    return 'Roster locked';
  }
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  return 'Roster open';
}

function HeroShell({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const body = <View style={styles.heroBlock}>{children}</View>;
  if (!onPress) {
    return body;
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.96} disabled={disabled}>
      {body}
    </TouchableOpacity>
  );
}

function MapPreview({
  mapRegion,
  busy,
}: {
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  busy?: boolean;
}) {
  return (
    <View style={styles.mapWrap}>
      <MapView
        style={styles.map}
        region={mapRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        liteMode={Platform.OS === 'android'}
        pointerEvents="none"
      >
        <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
      </MapView>
      {busy ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

export const NextUpCard: React.FC<NextUpCardProps> = ({
  nextGame,
  fallbackGroup,
  currentUserId,
  userLocation,
  onOpenGameRoom,
  onScheduleNext,
  openingGameId,
  footerHint,
  hostLock,
}) => {
  const activity = nextGame?.activity;

  const coords = useMemo(() => {
    if (activity?.location) {
      return parseGeographyCoordinates(activity.location.location);
    }
    if (userLocation) {
      return [userLocation.longitude, userLocation.latitude] as const;
    }
    return [LA_FALLBACK.longitude, LA_FALLBACK.latitude] as const;
  }, [activity?.location, userLocation]);

  const mapRegion = useMemo(() => {
    const [lng, lat] = coords;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    };
  }, [coords]);

  if (nextGame) {
    const busy = openingGameId === nextGame.activity.id;
    const game = nextGame.activity;
    const isHost = nextGame.role === 'host';
    const hasCustomTitle = Boolean(game.listing_title?.trim());
    const headline = hasCustomTitle ? activityGameName(game) : activityCourtName(game);
    const courtName = activityCourtName(game);
    const whenLine = formatDiscoverWhenLine(game.start_time);
    const distanceMeters = userLocation ? getDistanceToActivity(game, userLocation) : null;
    const distanceLabel = formatGameCardDistance(distanceMeters, !isHost);
    const roleLabel = isHost ? 'Hosting' : 'Joined';
    const durationLabel = game.duration ? `${game.duration} min` : null;
    const { readyCount } = getActivityRosterSummary(game);
    const spots = getMyGameListCardSpots(game);
    const hostLabel = game.user?.username ? `@${game.user.username}` : null;
    const isTonight = isTonightUrgency(game);
    const sportIcon = getSportIconName(game.sport_type);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NEXT UP</Text>
        <HeroShell onPress={() => onOpenGameRoom(nextGame)} disabled={busy}>
          <MapPreview mapRegion={mapRegion} busy={busy} />
          <View style={styles.detailsPanel}>
            <View style={styles.titleRow}>
              <View style={styles.iconColumn}>
                <MaterialCommunityIcons name={sportIcon} size={28} color={colors.text} />
              </View>
              <View style={styles.titleBody}>
                <View style={styles.headlineRow}>
                  <Text style={styles.headline} numberOfLines={2}>
                    {headline}
                  </Text>
                  {isTonight ? (
                    <View style={styles.tonightBadge}>
                      <Text style={styles.tonightText}>Tonight</Text>
                    </View>
                  ) : null}
                </View>
                {hasCustomTitle ? (
                  <Text style={styles.courtLine} numberOfLines={1}>
                    {courtName}
                  </Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.whenLine} numberOfLines={1}>
              {whenLine}
            </Text>

            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.distance} numberOfLines={1}>
                {distanceLabel ?? 'Distance unavailable'}
              </Text>
            </View>

            <Text style={styles.metaLine} numberOfLines={1}>
              {[game.sport_type, roleLabel, durationLabel].filter(Boolean).join(' · ')}
            </Text>

            {hostLabel ? (
              <Text style={styles.metaLine} numberOfLines={1}>
                Host {hostLabel}
              </Text>
            ) : null}

            <View style={styles.spotsRow}>
              <View style={styles.spotsMeta}>
                <Text style={styles.statText}>{formatRosterSummary(game)}</Text>
                <Text style={styles.statText}>
                  {readyCount} confirmed · {rosterStatusLabel(game)}
                </Text>
              </View>
              <GameListSpotsMeter
                roster={spots.rosterCount}
                capacity={spots.capacityCount}
                open={spots.openSpots}
              />
            </View>

            {hostLock ? (
              <View
                style={[
                  styles.lockChip,
                  hostLock.readiness === 'ready' && styles.lockChipReady,
                ]}
              >
                <Text
                  style={[
                    styles.lockChipText,
                    hostLock.readiness === 'ready' && styles.lockChipTextReady,
                  ]}
                >
                  {hostLock.hint}
                </Text>
              </View>
            ) : null}
            {footerHint ? <Text style={styles.footerHint}>{footerHint}</Text> : null}
          </View>
        </HeroShell>
      </View>
    );
  }

  if (fallbackGroup) {
    const isGroupHost = fallbackGroup.host_id === currentUserId;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>YOUR RALLY</Text>
        <HeroShell>
          <MapPreview mapRegion={mapRegion} />
          <View style={styles.detailsPanel}>
            <Text style={styles.headline} numberOfLines={2}>
              {fallbackGroup.name}
            </Text>
            <Text style={styles.metaLine}>
              {fallbackGroup.sport_type} · No game scheduled yet
            </Text>
            {fallbackGroup.is_partner_rally ? (
              <Text style={styles.metaLine}>Partner Rally</Text>
            ) : null}
            {isGroupHost && fallbackGroup.source_activity_id ? (
              <Button
                title="Schedule next game"
                size="sm"
                onPress={() => onScheduleNext(fallbackGroup.source_activity_id as string)}
                style={styles.actionBtn}
              />
            ) : (
              <Text style={styles.waiting}>
                Waiting for the host to schedule the next game.
              </Text>
            )}
          </View>
        </HeroShell>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>NEXT UP</Text>
      <HeroShell>
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            region={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            liteMode={Platform.OS === 'android'}
            pointerEvents="none"
          />
          <View style={styles.quietPin}>
            <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.primary} />
          </View>
        </View>
        <View style={styles.detailsPanel}>
          <Text style={styles.headline}>Nothing scheduled yet</Text>
          <Text style={styles.metaLine}>Court, time, and roster details appear here.</Text>
          <Text style={styles.waiting}>Use Play to find open games nearby.</Text>
        </View>
      </HeroShell>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroBlock: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  mapWrap: {
    height: MAP_HEIGHT,
    backgroundColor: colors.primaryLight,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  quietPin: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    transform: [{ translateY: -24 }],
  },
  detailsPanel: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 4,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  iconColumn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  headline: {
    ...typography.bodyMedium,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  courtLine: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
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
  metaLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  spotsMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  waiting: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  footerHint: {
    fontSize: 12,
    color: colors.warning,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  lockChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning + '55',
  },
  lockChipReady: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success + '55',
  },
  lockChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  lockChipTextReady: {
    color: colors.success,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

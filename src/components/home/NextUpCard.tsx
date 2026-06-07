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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../ui';
import { MyGameEntry } from '../../services/activityService';
import { RegularGroup } from '../../types/regularGroup';
import { activityListingHeadline } from '../../constants/playIntent';
import {
  formatRosterSummary,
  getActivityRosterSummary,
  getDistanceToActivity,
} from '../../utils/activityHelpers';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import type { HostLockReadiness } from '../../utils/activityHelpers';
import { isSameCalendarDay } from '../../utils/todayDateUtils';

const METERS_PER_MILE = 1609.344;
const LA_FALLBACK = { latitude: 34.0522, longitude: -118.2437 };

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

function formatNextUpWhen(startTime?: string | null): string {
  if (!startTime) {
    return 'Time TBD';
  }
  const date = new Date(startTime);
  const now = new Date();
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isSameCalendarDay(date, now)) {
    return `Today ${timeStr}`;
  }
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${dayStr} ${timeStr}`;
}

function formatMiles(distanceMeters: number | null): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return null;
  }
  const miles = distanceMeters / METERS_PER_MILE;
  return miles < 0.1 ? '<0.1 mi' : `${miles.toFixed(1)} mi`;
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

const SpotDots: React.FC<{ filled: number; total: number }> = ({ filled, total }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }, (_, index) => (
      <View
        key={index}
        style={[styles.dot, index < filled ? styles.dotFilled : styles.dotEmpty]}
      />
    ))}
    <Text style={styles.spotsLabel}>
      {filled}/{total}
    </Text>
  </View>
);

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

  const mapSection = (overlay?: React.ReactNode, busy?: boolean) => (
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
      {overlay}
      {busy ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );

  if (nextGame) {
    const busy = openingGameId === nextGame.activity.id;
    const court = activity?.location?.name || 'Court TBD';
    const title = activityListingHeadline(activity!);
    const whenLabel = formatNextUpWhen(activity?.start_time);
    const distanceMeters = userLocation && activity
      ? getDistanceToActivity(activity, userLocation)
      : null;
    const milesLabel = formatMiles(distanceMeters);
    const roleLabel = nextGame.role === 'host' ? 'Hosting' : 'Joined';
    const durationLabel = activity?.duration ? `${activity.duration} min` : null;
    const { onRoster, capacity, readyCount } = getActivityRosterSummary(nextGame.activity);
    const hostLabel = activity?.user?.username ? `@${activity.user.username}` : null;
    const overlayMeta = [court, whenLabel, milesLabel].filter(Boolean).join(' · ');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NEXT UP</Text>
        <HeroShell onPress={() => onOpenGameRoom(nextGame)} disabled={busy}>
          {mapSection(
            <View style={styles.mapOverlay}>
              <Text style={styles.overlayMeta} numberOfLines={2}>
                {overlayMeta}
              </Text>
              <SpotDots filled={onRoster} total={Math.max(capacity, onRoster)} />
            </View>,
            busy
          )}
          <View style={styles.detailsPanel}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {[activity?.sport_type, roleLabel, durationLabel].filter(Boolean).join(' · ')}
            </Text>
            {hostLabel ? (
              <Text style={styles.metaLine} numberOfLines={1}>
                Host {hostLabel}
              </Text>
            ) : null}
            <View style={styles.statsRow}>
              <Text style={styles.statText}>{formatRosterSummary(nextGame.activity)}</Text>
              <Text style={styles.statText}>
                {readyCount} confirmed · {rosterStatusLabel(nextGame.activity)}
              </Text>
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
          {mapSection(
            <View style={styles.mapOverlay}>
              <Text style={styles.overlayTitle} numberOfLines={1}>
                {fallbackGroup.name}
              </Text>
              <Text style={styles.overlayMeta} numberOfLines={1}>
                {fallbackGroup.sport_type} · No game scheduled yet
              </Text>
            </View>
          )}
          <View style={styles.detailsPanel}>
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
          <View style={styles.mapOverlay}>
            <Text style={styles.overlayTitle}>Nothing scheduled yet</Text>
            <Text style={styles.overlayMeta}>
              Court, time, and roster details appear here
            </Text>
          </View>
        </View>
        <View style={styles.detailsPanel}>
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
    height: 176,
    backgroundColor: colors.primaryLight,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.card,
  },
  overlayTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  overlayMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  quietPin: {
    position: 'absolute',
    top: '36%',
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
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  title: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  metaLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  spotsLabel: {
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  waiting: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footerHint: {
    fontSize: 12,
    color: colors.warning,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  lockChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
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

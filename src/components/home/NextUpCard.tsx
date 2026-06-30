import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../ui';
import { MyGameEntry } from '../../services/activityService';
import { RegularGroup } from '../../types/regularGroup';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { GameCardShell } from '../game/GameCardShell';
import { gameListCardVariantForActivity } from '../../config/gameCardLayouts';
import { getViewerGameState } from '../../utils/activityHelpers';
import { TodaySectionDotLabel } from './TodaySectionDotLabel';
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

function LockChip({
  hostLock,
}: {
  hostLock: { readiness: HostLockReadiness; hint: string };
}) {
  return (
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
  );
}

function MapPreview({
  mapRegion,
}: {
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
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
      />
      <View style={styles.quietPin}>
        <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.primary} />
      </View>
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
  const coords = useMemo(() => {
    if (nextGame?.activity.location) {
      return parseGeographyCoordinates(nextGame.activity.location.location);
    }
    if (userLocation) {
      return [userLocation.longitude, userLocation.latitude] as const;
    }
    return [LA_FALLBACK.longitude, LA_FALLBACK.latitude] as const;
  }, [nextGame?.activity.location, userLocation]);

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

    return (
      <View style={styles.section}>
        <TodaySectionDotLabel label="NEXT UP" />
        <GameCardShell
          presetKey="homeNextUp"
          activity={nextGame.activity}
          userLocation={userLocation}
          isHost={nextGame.role === 'host'}
          variant={gameListCardVariantForActivity(nextGame.activity)}
          viewerState={getViewerGameState(nextGame.activity, currentUserId)}
          onPress={() => onOpenGameRoom(nextGame)}
          disabled={busy}
          busy={busy}
        />
        {hostLock || footerHint ? (
          <View style={styles.cardFooter}>
            {hostLock ? <LockChip hostLock={hostLock} /> : null}
            {footerHint ? <Text style={styles.footerHint}>{footerHint}</Text> : null}
          </View>
        ) : null}
      </View>
    );
  }

  if (fallbackGroup) {
    const isGroupHost = fallbackGroup.host_id === currentUserId;
    return (
      <View style={styles.section}>
        <TodaySectionDotLabel label="YOUR RALLY" />
        <View style={styles.heroBlock}>
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
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <TodaySectionDotLabel label="NEXT UP" />
      <View style={styles.heroBlock}>
        <MapPreview mapRegion={mapRegion} />
        <View style={styles.detailsPanel}>
          <Text style={styles.headline}>Nothing scheduled yet</Text>
          <Text style={styles.metaLine}>Court, time, and roster details appear here.</Text>
          <Text style={styles.waiting}>Use Play to find open games nearby.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  cardFooter: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  heroBlock: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
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
  headline: {
    ...typography.bodyMedium,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  metaLine: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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
  },
  lockChip: {
    alignSelf: 'flex-start',
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
});

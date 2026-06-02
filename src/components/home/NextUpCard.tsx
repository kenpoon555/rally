import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../ui';
import { MyGameEntry } from '../../services/activityService';
import { RegularGroup } from '../../types/regularGroup';
import { formatRelativeStart } from '../../utils/formatRelativeStart';
import { getDistanceToActivity } from '../../utils/activityHelpers';
import { formatTravelEstimate } from '../../utils/formatDistance';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface NextUpCardProps {
  nextGame: MyGameEntry | null;
  fallbackGroup: RegularGroup | null;
  currentUserId?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onOpenGameRoom: (entry: MyGameEntry) => void;
  onScheduleNext: (sourceActivityId: string) => void;
  openingGameId?: string | null;
  footerHint?: string;
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
}) => {
  const activity = nextGame?.activity;
  const court = activity?.location?.name || 'Court TBD';

  const coords = useMemo(() => {
    if (!activity?.location) {
      return null;
    }
    return parseGeographyCoordinates(activity.location.location);
  }, [activity?.location]);

  const mapRegion = useMemo(() => {
    if (!coords) {
      return null;
    }
    const [lng, lat] = coords;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [coords]);

  const travelLabel = useMemo(() => {
    if (!activity || !userLocation) {
      return null;
    }
    return formatTravelEstimate(getDistanceToActivity(activity, userLocation));
  }, [activity, userLocation]);

  if (nextGame) {
    const busy = openingGameId === nextGame.activity.id;
    return (
      <View style={styles.card}>
        {mapRegion ? (
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
            <View style={styles.mapFade} />
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.primary} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.label}>NEXT UP</Text>
          <Text style={styles.title}>
            {nextGame.activity.sport_type} · {court}
          </Text>
          <Text style={styles.time}>{formatRelativeStart(nextGame.activity.start_time)}</Text>
          {travelLabel ? <Text style={styles.travel}>{travelLabel}</Text> : null}
          <Button
            title={busy ? 'Opening…' : 'Open Game Room'}
            size="sm"
            onPress={() => onOpenGameRoom(nextGame)}
            disabled={busy}
            loading={busy}
            style={styles.cta}
          />
          {footerHint ? <Text style={styles.footerHint}>{footerHint}</Text> : null}
        </View>
      </View>
    );
  }

  if (!fallbackGroup) {
    return null;
  }

  const isGroupHost = fallbackGroup.host_id === currentUserId;
  return (
    <View style={styles.card}>
      <View style={styles.mapPlaceholder}>
        <MaterialCommunityIcons name="account-group-outline" size={28} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>YOUR CREW</Text>
        <Text style={styles.title}>{fallbackGroup.name}</Text>
        <Text style={styles.time}>No game on the calendar yet.</Text>
        {isGroupHost && fallbackGroup.source_activity_id ? (
          <Button
            title="Schedule next"
            variant="secondary"
            size="sm"
            onPress={() => onScheduleNext(fallbackGroup.source_activity_id as string)}
            style={styles.cta}
          />
        ) : (
          <Text style={styles.waiting}>Waiting for the host to schedule the next game.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapWrap: {
    height: 112,
    backgroundColor: colors.primaryLight,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  mapPlaceholder: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  body: {
    padding: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.primary,
  },
  title: {
    marginTop: spacing.xs + 2,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  time: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
  },
  travel: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cta: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  waiting: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footerHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

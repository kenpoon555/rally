import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Camera } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { activityCourtName, activityGameName } from '../../constants/playIntent';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { isSameCalendarDay } from '../../utils/todayDateUtils';
import { getSportIconName } from '../SportIcon';
import { GameCardParticipantStack } from '../game/GameCardParticipantStack';

const LA_FALLBACK = { latitude: 34.0522, longitude: -118.2437 };
const CARD_MIN_HEIGHT = 140;
const TEXT_FLEX = 0.34;
const MAP_FLEX = 0.66;

export type TodayGameMapCardProps = {
  activity: Activity;
  userLocation?: { latitude: number; longitude: number } | null;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  footer?: React.ReactNode;
  showWhoGoing?: boolean;
};

function formatHeroWhenLine(startTime?: string | null): string {
  if (!startTime) {
    return 'Time TBD';
  }
  const date = new Date(startTime);
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (isSameCalendarDay(date, new Date())) {
    return `Today ${timeStr}`;
  }
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${dayStr} ${timeStr}`;
}

function venueSubline(activity: Activity, courtName: string): string | undefined {
  const address = activity.location?.address?.trim();
  if (!address) {
    return undefined;
  }
  const court = courtName.trim().toLowerCase();
  const addr = address.toLowerCase();
  if (!court || addr === court || court.includes(addr) || addr.includes(court)) {
    return undefined;
  }
  return address;
}

function headlineForActivity(activity: Activity): string {
  const hasCustomTitle = Boolean(activity.listing_title?.trim());
  return hasCustomTitle ? activityGameName(activity) : activityCourtName(activity);
}

export function mapRegionForActivity(
  activity: Activity,
  userLocation?: { latitude: number; longitude: number } | null
) {
  if (activity.location) {
    const [lng, lat] = parseGeographyCoordinates(activity.location.location);
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }
  if (userLocation) {
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }
  return {
    latitude: LA_FALLBACK.latitude,
    longitude: LA_FALLBACK.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };
}

function mapCameraForActivity(
  activity: Activity,
  userLocation?: { latitude: number; longitude: number } | null
): Camera {
  const region = mapRegionForActivity(activity, userLocation);
  return {
    center: {
      latitude: region.latitude,
      longitude: region.longitude,
    },
    pitch: Platform.OS === 'ios' ? 58 : 50,
    heading: Platform.OS === 'ios' ? 30 : 0,
    altitude: 520,
    zoom: 17,
  };
}

/** Next Up only — compact text + wide 3D map hero. */
export const TodayGameMapCard: React.FC<TodayGameMapCardProps> = ({
  activity,
  userLocation,
  onPress,
  disabled,
  busy,
  footer,
  showWhoGoing = true,
}) => {
  const mapCamera = useMemo(
    () => mapCameraForActivity(activity, userLocation),
    [activity, userLocation]
  );
  const sportIcon = getSportIconName(activity.sport_type);
  const headline = headlineForActivity(activity);
  const courtName = activityCourtName(activity);
  const whenLine = formatHeroWhenLine(activity.start_time);
  const subline = venueSubline(activity, courtName);

  const body = (
    <View style={[styles.card, busy && styles.cardBusy]}>
      <View style={styles.infoPanel}>
        <Text style={styles.headline} numberOfLines={2} ellipsizeMode="tail">
          {headline}
        </Text>
        <Text style={styles.sportLine} numberOfLines={1} ellipsizeMode="tail">
          {activity.sport_type}
        </Text>
        {showWhoGoing ? (
          <GameCardParticipantStack activity={activity} maxVisible={4} style={styles.avatarRow} />
        ) : null}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.primary} style={styles.rowIcon} />
          <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
            {whenLine}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={12} color={colors.primary} style={styles.rowIcon} />
          <Text style={styles.venueName} numberOfLines={1} ellipsizeMode="tail">
            {courtName}
          </Text>
        </View>
        {subline ? (
          <Text style={styles.venueSubline} numberOfLines={1} ellipsizeMode="middle">
            {subline}
          </Text>
        ) : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>

      <View style={styles.mapPanel}>
        <MapView
          style={styles.map}
          initialCamera={mapCamera}
          mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          showsPointsOfInterest={false}
          showsCompass={false}
          showsBuildings
          liteMode={false}
          pointerEvents="none"
        />
        <View style={styles.mapTint} pointerEvents="none" />
        <View style={styles.mapFade} pointerEvents="none">
          <View style={[styles.fadeStrip, styles.fadeStrip1]} />
          <View style={[styles.fadeStrip, styles.fadeStrip2]} />
        </View>
        <View style={styles.mapPinWrap} pointerEvents="none">
          <View style={styles.mapPin}>
            <MaterialCommunityIcons name={sportIcon} size={18} color={colors.onPrimary} />
          </View>
          <View style={styles.mapPinPoint} />
        </View>
        {busy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.96} disabled={disabled || busy}>
      {body}
    </TouchableOpacity>
  );
};

export function TodaySectionDotLabel({ label }: { label: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    minHeight: CARD_MIN_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardBusy: {
    opacity: 0.92,
  },
  infoPanel: {
    flex: TEXT_FLEX,
    minWidth: 0,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    zIndex: 2,
  },
  headline: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 17,
  },
  sportLine: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  rowIcon: {
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 14,
  },
  venueName: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 14,
  },
  venueSubline: {
    fontSize: 10,
    color: colors.textTertiary,
    lineHeight: 12,
    paddingLeft: 16,
  },
  footer: {
    marginTop: 2,
  },
  avatarRow: {
    marginTop: 2,
  },
  mapPanel: {
    flex: MAP_FLEX,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryLight,
    opacity: 0.12,
  },
  mapFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    flexDirection: 'row',
  },
  fadeStrip: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fadeStrip1: {
    opacity: 0.92,
  },
  fadeStrip2: {
    opacity: 0.35,
  },
  mapPinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  mapPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.surface,
    marginBottom: -5,
    ...Platform.select({
      ios: {
        shadowColor: '#141916',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  mapPinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text,
    letterSpacing: 1,
  },
});

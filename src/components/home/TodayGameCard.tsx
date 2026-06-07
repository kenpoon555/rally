import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SportIcon } from '../SportIcon';
import { MyGameEntry } from '../../services/activityService';
import { activityListingHeadline } from '../../constants/playIntent';
import { PRODUCT_COPY } from '../../constants/productCopy';
import {
  getApprovedParticipants,
  getActivityRosterSummary,
  getDistanceToActivity,
  isTonightUrgency,
  needsConfirmPlaying,
} from '../../utils/activityHelpers';
import { colors, AVATAR_PALETTE, radius, spacing, typography } from '../../constants/theme';

const METERS_PER_MILE = 1609.344;
const MAX_AVATARS = 5;

type Props = {
  entry: MyGameEntry;
  currentUserId?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  busy?: boolean;
  actionBusy?: boolean;
  onPress: () => void;
  onConfirmIn?: () => void;
};

function formatGameTime(startTime?: string | null): string {
  if (!startTime) {
    return 'Time TBD';
  }
  return new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMiles(distanceMeters: number | null): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return null;
  }
  const miles = distanceMeters / METERS_PER_MILE;
  return miles < 0.1 ? '<0.1 mi' : `${miles.toFixed(1)} mi`;
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

const AvatarStack: React.FC<{ initials: string[] }> = ({ initials }) => {
  const shown = initials.slice(0, MAX_AVATARS);
  const overflow = initials.length - shown.length;

  return (
    <View style={styles.avatarRow}>
      {shown.map((initial, index) => (
        <View
          key={`${initial}-${index}`}
          style={[
            styles.avatar,
            {
              backgroundColor: AVATAR_PALETTE[initial.charCodeAt(0) % AVATAR_PALETTE.length],
              marginLeft: index === 0 ? 0 : -8,
              zIndex: shown.length - index,
            },
          ]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      ))}
      {overflow > 0 ? (
        <View style={[styles.avatar, styles.avatarOverflow, { marginLeft: -8 }]}>
          <Text style={styles.avatarText}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const TodayGameCard: React.FC<Props> = ({
  entry,
  currentUserId,
  userLocation,
  busy,
  actionBusy,
  onPress,
  onConfirmIn,
}) => {
  const { activity, role } = entry;
  const isHost = role === 'host';
  const isFinalized = activity.match_status === 'finalized';
  const isTonight = isTonightUrgency(activity);
  const title = activityListingHeadline(activity);
  const venue = activity.location?.name ?? 'Court TBD';
  const timeLabel = formatGameTime(activity.start_time);
  const distanceMeters = userLocation ? getDistanceToActivity(activity, userLocation) : null;
  const milesLabel = formatMiles(distanceMeters);
  const metaParts = [venue, timeLabel, milesLabel].filter(Boolean);

  const approved = getApprovedParticipants(activity);
  const { onRoster, capacity } = getActivityRosterSummary(activity);
  const myJoinRequest = approved.find((row) => row.user_id === currentUserId);
  const isReady =
    isHost ||
    isFinalized ||
    Boolean(myJoinRequest?.ready_at);
  const needsConfirm =
    !isHost && needsConfirmPlaying(activity, currentUserId);

  const avatarInitials = useMemo(() => {
    const faces = [
      (activity.user?.username ?? 'H')[0].toUpperCase(),
      ...approved.map((participant) =>
        (participant.user?.username ?? '?')[0].toUpperCase()
      ),
    ];
    return faces;
  }, [activity.user?.username, approved]);

  const showTonightBadge = isTonight;

  return (
    <TouchableOpacity
      style={[styles.card, isTonight && styles.cardTonight]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={busy}
    >
      {showTonightBadge ? (
        <View style={styles.tonightBadge}>
          <Text style={styles.tonightBadgeText}>Tonight</Text>
        </View>
      ) : null}

      <View style={styles.cardBody}>
        <SportIcon sport={activity.sport_type} size="md" style={styles.sportIcon} />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {metaParts.join(' · ')}
          </Text>

          <View style={styles.footerRow}>
            <AvatarStack initials={avatarInitials} />
            <SpotDots filled={onRoster} total={Math.max(capacity, onRoster)} />
          </View>
        </View>

        {needsConfirm && onConfirmIn ? (
          <TouchableOpacity
            style={styles.actionOutline}
            onPress={(event) => {
              event.stopPropagation();
              onConfirmIn();
            }}
            disabled={actionBusy}
          >
            {actionBusy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.actionOutlineText}>{PRODUCT_COPY.imIn}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.actionFilled}>
            <Text style={styles.actionFilledText}>
              {isReady ? `${PRODUCT_COPY.imIn} ✓` : PRODUCT_COPY.imIn}
            </Text>
          </View>
        )}
      </View>

      {busy ? (
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
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardTonight: {
    borderLeftColor: colors.accent,
  },
  tonightBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginLeft: spacing.md,
    marginBottom: -spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  tonightBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  sportIcon: {
    backgroundColor: colors.primaryLight,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarOverflow: {
    backgroundColor: colors.border,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 7,
    height: 7,
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionFilled: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionFilledText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
  actionOutline: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Activity, JoinRequest } from '../types/activity';
import { useAuth } from '../hooks/useAuth';
import JoinRequestButton from './JoinRequestButton';
import { SportIcon } from './SportIcon';
import {
  getIntensityFromDuration,
  INTENSITY_CONFIG,
  formatActivityTime,
  formatDistance,
  getDistanceToActivity,
  getApprovedParticipants,
  activityHasFriend,
} from '../utils/activityHelpers';
import { colors, PRIMARY_COLOR, radius, shadows, spacing, typography, AVATAR_PALETTE } from '../constants/theme';
import { formatApproximateDistance } from '../utils/approximateLocation';
import { PlayerTrustLine } from './PlayerTrustLine';

// ── Sport icon ────────────────────────────────────────────────────────────────

const SportIconBox: React.FC<{ sport: string }> = ({ sport }) => (
  <SportIcon sport={sport} size="md" style={styles.iconBox} />
);

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:       { bg: colors.primaryLight, text: colors.primaryDark },
  collecting: { bg: colors.warningSoft, text: colors.warning },
  finalized:  { bg: colors.successSoft, text: colors.success },
  cancelled:  { bg: colors.errorSoft, text: colors.error },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const palette = STATUS_COLORS[status] ?? STATUS_COLORS.open;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

// ── Avatar row ────────────────────────────────────────────────────────────────

const AvatarCircle: React.FC<{
  initials: string;
  index: number;
  isOverflow?: boolean;
  overflowCount?: number;
}> = ({ initials, index, isOverflow, overflowCount }) => {
  const bg = isOverflow
    ? colors.border
    : AVATAR_PALETTE[initials.charCodeAt(0) % AVATAR_PALETTE.length];

  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: bg, left: index * 16 },
      ]}
    >
      <Text style={styles.avatarText}>
        {isOverflow ? `+${overflowCount}` : initials}
      </Text>
    </View>
  );
};

const AvatarRow: React.FC<{
  participants: JoinRequest[];
  isAnonymous: boolean;
}> = ({ participants, isAnonymous }) => {
  const MAX_SHOWN = 4;
  const shown = participants.slice(0, MAX_SHOWN);
  const overflow = participants.length > MAX_SHOWN ? participants.length - MAX_SHOWN : 0;
  const totalSlots = shown.length + (overflow > 0 ? 1 : 0);
  const rowWidth = totalSlots > 0 ? 16 * (totalSlots - 1) + 24 : 24;

  return (
    <View style={[styles.avatarRow, { width: rowWidth }]}>
      {shown.map((p, i) => {
        const initials = isAnonymous
          ? '?'
          : (p.user?.username ?? '?')[0].toUpperCase();
        return <AvatarCircle key={p.id} initials={initials} index={i} />;
      })}
      {overflow > 0 && (
        <AvatarCircle
          initials=""
          index={shown.length}
          isOverflow
          overflowCount={overflow}
        />
      )}
    </View>
  );
};

// ── Progress bar ──────────────────────────────────────────────────────────────

const SpotsBar: React.FC<{ playerCount: number; missing: number }> = ({
  playerCount,
  missing,
}) => {
  const total = playerCount + missing;
  const fillPercent = total > 0 ? (playerCount / total) * 100 : 0;
  const isFull = missing === 0;
  const openLabel = isFull ? 'Full' : `${missing} open`;

  return (
    <View style={styles.spotsSection}>
      <View style={styles.spotsLabelRow}>
        <Text style={styles.spotsLabel}>
          {playerCount} of {total} spots filled
        </Text>
        <Text style={[styles.spotsOpen, isFull && styles.spotsOpenFull]}>
          {openLabel}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${fillPercent}%` as any,
              backgroundColor: isFull ? colors.success : PRIMARY_COLOR,
            },
          ]}
        />
      </View>
    </View>
  );
};

// ── Main card ─────────────────────────────────────────────────────────────────

interface GameCardProps {
  activity: Activity;
  onPress: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  friendIds?: Set<string>;
}

const GameCard: React.FC<GameCardProps> = ({ activity, onPress, userLocation, friendIds }) => {
  const { user } = useAuth();

  const status = activity.match_status ?? 'open';
  const isFinalized = status === 'finalized';
  const intensity = getIntensityFromDuration(activity.duration);
  const intensityConfig = INTENSITY_CONFIG[intensity];
  const timeLabel = formatActivityTime(activity.start_time, activity.duration);
  const locationName = activity.location?.name ?? 'Unknown location';
  const missing = activity.missing_players ?? 0;

  const distanceMeters =
    userLocation ? getDistanceToActivity(activity, userLocation) : null;

  const approvedParticipants = getApprovedParticipants(activity);

  const hostLabel = activity.user?.username ? `@${activity.user.username}` : 'Unknown host';

  const isHost = user?.id === activity.user_id;
  const canShowJoin = !isHost && !!user && !isFinalized && status !== 'cancelled';

  const joinedCountLabel =
    activity.player_count > 1
      ? `${activity.player_count - 1} player${activity.player_count - 1 === 1 ? '' : 's'} joined`
      : null;

  const hasFriendPlaying = friendIds ? activityHasFriend(activity, friendIds) : false;

  return (
    <View style={styles.card}>
      {/* ── HEADER ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.headerRow}>
          <SportIconBox sport={activity.sport_type} />
          <Text style={styles.sportTitle}>{activity.sport_type}</Text>
          <View style={styles.badgeGroup}>
            {isHost && (
              <View style={styles.hostingBadge}>
                <Text style={styles.hostingBadgeText}>YOUR GAME</Text>
              </View>
            )}
            {hasFriendPlaying && (
              <View style={styles.friendBadge}>
                <Text style={styles.friendBadgeText}>FRIEND PLAYING</Text>
              </View>
            )}
            {activity.urgency_level === 'tonight' && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>TONIGHT</Text>
              </View>
            )}
            {activity.scheduling_mode === 'flex' && (
              <View style={styles.flexBadge}>
                <Text style={styles.flexBadgeText}>FLEX</Text>
              </View>
            )}
            <StatusBadge status={status} />
          </View>
        </View>

        {/* ── TIME ── */}
        <View style={[styles.row, styles.divider]}>
          <Text style={styles.rowIcon}>🕐</Text>
          <Text style={styles.timeText}>{timeLabel}</Text>
          <View style={styles.intensityDot}>
            <View style={[styles.dot, { backgroundColor: intensityConfig.color }]} />
            <Text style={[styles.intensityLabel, { color: intensityConfig.color }]}>
              {intensityConfig.label}
            </Text>
          </View>
        </View>

        {/* ── LOCATION ── */}
        <View style={[styles.row, styles.divider]}>
          <Text style={styles.rowIcon}>📍</Text>
          <View>
            <Text style={styles.locationName}>{locationName}</Text>
            {distanceMeters !== null && (
              <Text style={styles.distance}>
                {isHost ? formatDistance(distanceMeters) : formatApproximateDistance(distanceMeters)}
              </Text>
            )}
          </View>
        </View>

        {/* ── SPOTS ── */}
        <View style={styles.divider}>
          <SpotsBar playerCount={activity.player_count} missing={missing} />
        </View>

        {/* ── WHO'S GOING ── */}
        <View style={[styles.whoSection, styles.divider]}>
          <Text style={styles.whoHeader}>WHO'S GOING</Text>
          <View style={styles.whoBody}>
            {approvedParticipants.length > 0 ? (
              <AvatarRow participants={approvedParticipants} isAnonymous={false} />
            ) : joinedCountLabel ? (
              <Text style={styles.noParticipants}>{joinedCountLabel}</Text>
            ) : (
              <Text style={styles.noParticipants}>Be the first to join</Text>
            )}
            <View style={styles.hostBlock}>
              <Text style={styles.hostLabel}>Host: {hostLabel}</Text>
              {activity.user_id ? (
                <PlayerTrustLine userId={activity.user_id} style={styles.trustLine} />
              ) : null}
            </View>
            {activity.cost_note ? (
              <Text style={styles.costPreview}>Cost: {activity.cost_note}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* ── JOIN BUTTON ── */}
      {canShowJoin && (
        <View style={styles.joinRow}>
          <JoinRequestButton activity={activity} />
        </View>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    overflow: 'hidden',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md + 2,
  },
  iconBox: {
    marginRight: spacing.md,
  },
  sportTitle: {
    flex: 1,
    ...typography.bodyMedium,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hostingBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  hostingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  friendBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.infoSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  friendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.info,
  },
  flexBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  flexBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  urgentBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  // Shared row layout
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  rowIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  // Time
  timeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  intensityDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  intensityLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Location
  locationName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444',
  },
  distance: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888',
    marginTop: 1,
  },
  // Spots
  spotsSection: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  spotsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  spotsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  spotsOpen: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  spotsOpenFull: {
    color: colors.success,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 2.5,
  },
  // Who's going
  whoSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  whoHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  whoBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    position: 'relative',
    height: 24,
  },
  avatar: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
  },
  noParticipants: {
    fontSize: 12,
    color: '#bbb',
  },
  hostBlock: {
    marginTop: 2,
  },
  hostLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
  },
  trustLine: {
    marginTop: 2,
  },
  costPreview: {
    marginTop: 6,
    fontSize: 12,
    color: '#3d3418',
    fontWeight: '600',
  },
  // Join button
  joinRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  joinButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  requestedText: {
    textAlign: 'center',
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 10,
  },
});

export default React.memo(GameCard);

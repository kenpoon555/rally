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
import {
  getIntensityFromDuration,
  INTENSITY_CONFIG,
  formatActivityTime,
  formatDistance,
  getDistanceToActivity,
  getApprovedParticipants,
} from '../utils/activityHelpers';
import { PRIMARY_COLOR } from '../constants/theme';
import { formatApproximateDistance } from '../utils/approximateLocation';

// ── Sport icon ────────────────────────────────────────────────────────────────

const SPORT_EMOJIS: Record<string, string> = {
  Pickleball: '🏓',
  Basketball: '🏀',
  Tennis:     '🎾',
  Badminton:  '🏸',
  Running:    '🏃',
  Hiking:     '🥾',
  Soccer:     '⚽',
  Volleyball: '🏐',
  Swimming:   '🏊',
  Cycling:    '🚴',
};

const SportIcon: React.FC<{ sport: string }> = ({ sport }) => {
  const emoji = SPORT_EMOJIS[sport] ?? sport[0];
  return (
    <View style={styles.iconBox}>
      <Text style={styles.iconEmoji}>{emoji}</Text>
    </View>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:       { bg: '#e6f0ff', text: '#245fa7' },
  collecting: { bg: '#fff3cd', text: '#856404' },
  finalized:  { bg: '#ddf8e8', text: '#1a6535' },
  cancelled:  { bg: '#fde8e8', text: '#9b1c1c' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.open;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

// ── Avatar row ────────────────────────────────────────────────────────────────

const AVATAR_FALLBACK_COLORS = [
  '#b0c4de', '#c4b0de', '#b0deb0', '#deb0b0', '#dedad0', '#b0d5de',
];

const AvatarCircle: React.FC<{
  initials: string;
  index: number;
  isOverflow?: boolean;
  overflowCount?: number;
}> = ({ initials, index, isOverflow, overflowCount }) => {
  const bg = isOverflow
    ? '#e0e0e0'
    : AVATAR_FALLBACK_COLORS[initials.charCodeAt(0) % 6];

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
              backgroundColor: isFull ? '#34C759' : PRIMARY_COLOR,
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
}

const GameCard: React.FC<GameCardProps> = ({ activity, onPress, userLocation }) => {
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

  return (
    <View style={styles.card}>
      {/* ── HEADER ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.headerRow}>
          <SportIcon sport={activity.sport_type} />
          <Text style={styles.sportTitle}>{activity.sport_type}</Text>
          <View style={styles.badgeGroup}>
            {isHost && (
              <View style={styles.hostingBadge}>
                <Text style={styles.hostingBadgeText}>YOUR GAME</Text>
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
            <Text style={styles.hostLabel}>Host: {hostLabel}</Text>
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
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eef3fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconEmoji: {
    fontSize: 18,
  },
  sportTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
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
    borderRadius: 10,
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hostingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  flexBadge: {
    borderRadius: 10,
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  flexBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b06000',
  },
  urgentBadge: {
    borderRadius: 10,
    backgroundColor: '#ffe8e8',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b42318',
  },
  // Shared row layout
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
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
    color: '#34C759',
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e8e8e8',
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
  hostLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
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

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Activity } from '../types/activity';
import { useAuth } from '../hooks/useAuth';
import JoinRequestButton from './JoinRequestButton';
import { SportBadge } from './SportBadge';
import {
  getIntensityFromDuration,
  INTENSITY_CONFIG,
  formatActivityTime,
  formatDistance,
  getDistanceToActivity,
  getApprovedParticipants,
  getActivityRosterSummary,
  getFriendsOnActivity,
  isTonightUrgency,
} from '../utils/activityHelpers';
import { colors, PRIMARY_COLOR, radius, shadows, spacing, AVATAR_PALETTE } from '../constants/theme';
import { formatApproximateDistance } from '../utils/approximateLocation';
import { PlayerTrustLine } from './PlayerTrustLine';
import { activityListingHeadline, playIntentLabel } from '../constants/playIntent';
import { PLAY_PARTNER_SURFACES_ENABLED } from '../constants/betaFlags';

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

type AvatarFace = { id: string; initials: string; ready?: boolean };

const AvatarRow: React.FC<{ faces: AvatarFace[] }> = ({ faces }) => {
  const MAX_SHOWN = 4;
  const shown = faces.slice(0, MAX_SHOWN);
  const overflow = faces.length > MAX_SHOWN ? faces.length - MAX_SHOWN : 0;
  const totalSlots = shown.length + (overflow > 0 ? 1 : 0);
  const rowWidth = totalSlots > 0 ? 16 * (totalSlots - 1) + 24 : 24;

  return (
    <View style={[styles.avatarRow, { width: rowWidth }]}>
      {shown.map((face, i) => (
        <View key={face.id} style={[styles.avatarSlot, { left: i * 16 }]}>
          <AvatarCircle initials={face.initials} index={0} />
          {face.ready ? <View style={styles.avatarReadyDot} /> : null}
        </View>
      ))}
      {overflow > 0 ? (
        <View style={[styles.avatarSlot, { left: shown.length * 16 }]}>
          <AvatarCircle initials="" index={0} isOverflow overflowCount={overflow} />
        </View>
      ) : null}
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
  const listingHeadline = activityListingHeadline(activity);
  const locationName = activity.location?.name ?? 'Unknown location';
  const intentLabel = playIntentLabel(activity.play_intent);
  const missing = activity.missing_players ?? 0;

  const distanceMeters =
    userLocation ? getDistanceToActivity(activity, userLocation) : null;

  const approvedParticipants = getApprovedParticipants(activity);
  const rosterSummary = getActivityRosterSummary(activity);
  const isFinalizedForReady = status === 'finalized';
  const avatarFaces: AvatarFace[] = [
    {
      id: `host-${activity.user_id}`,
      initials: (activity.user?.username ?? 'H')[0].toUpperCase(),
      ready: true,
    },
    ...approvedParticipants.map((p) => ({
      id: p.id,
      initials: (p.user?.username ?? '?')[0].toUpperCase(),
      ready: isFinalizedForReady || Boolean(p.ready_at),
    })),
  ];

  const hostLabel = activity.user?.username ? `@${activity.user.username}` : 'Unknown host';

  const isHost = user?.id === activity.user_id;
  const canShowJoin = !isHost && !!user && !isFinalized && status !== 'cancelled';

  const friendsOnGame = friendIds ? getFriendsOnActivity(activity, friendIds) : [];
  const friendLine =
    friendsOnGame.length === 0
      ? null
      : friendsOnGame.length === 1
        ? `@${friendsOnGame[0]} is in`
        : friendsOnGame.length === 2
          ? `@${friendsOnGame[0]} & @${friendsOnGame[1]} are in`
          : `@${friendsOnGame[0]} & ${friendsOnGame.length - 1} friends are in`;

  return (
    <View style={styles.card}>
      {/* ── HEADER ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.headerRow}>
          <SportBadge sport={activity.sport_type} style={styles.sportBadge} />
          <View style={styles.badgeGroup}>
            {isHost && (
              <View style={styles.hostingBadge}>
                <Text style={styles.hostingBadgeText}>YOUR GAME</Text>
              </View>
            )}
            {friendLine ? (
              <View style={styles.friendBadge}>
                <Text style={styles.friendBadgeText} numberOfLines={1}>
                  {friendLine.toUpperCase()}
                </Text>
              </View>
            ) : null}
            {isTonightUrgency(activity) && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>TONIGHT</Text>
              </View>
            )}
            {activity.is_intro_session ? (
              <View style={styles.introBadge}>
                <Text style={styles.introBadgeText}>INTRO</Text>
              </View>
            ) : null}
            {PLAY_PARTNER_SURFACES_ENABLED && activity.location?.partner_tier ? (
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>PARTNER</Text>
              </View>
            ) : null}
            {activity.scheduling_mode === 'flex' && (
              <View style={styles.flexBadge}>
                <Text style={styles.flexBadgeText}>FLEX</Text>
              </View>
            )}
            <StatusBadge status={status} />
          </View>
        </View>

        <Text style={styles.listingHeadline} numberOfLines={2}>
          {listingHeadline}
        </Text>
        {intentLabel ? (
          <View style={styles.intentBadge}>
            <Text style={styles.intentBadgeText}>{intentLabel}</Text>
          </View>
        ) : null}

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
          <View style={styles.whoHeaderRow}>
            <Text style={styles.whoHeader}>WHO'S GOING</Text>
            <Text style={styles.rosterMeta}>
              {rosterSummary.onRoster}/{rosterSummary.capacity} · {rosterSummary.readyCount} ready
            </Text>
          </View>
          <View style={styles.whoBody}>
            {avatarFaces.length > 0 ? (
              <AvatarRow faces={avatarFaces} />
            ) : (
              <Text style={styles.noParticipants}>Be the first to join</Text>
            )}
            {friendLine ? <Text style={styles.friendLine}>{friendLine}</Text> : null}
            <View style={styles.hostBlock}>
              <Text style={styles.hostLabel}>Host: {hostLabel}</Text>
              {activity.user_id ? (
                <PlayerTrustLine userId={activity.user_id} style={styles.trustLine} />
              ) : null}
            </View>
            {activity.session_note ? (
              <Text style={styles.sessionPreview} numberOfLines={2}>
                {activity.session_note}
              </Text>
            ) : null}
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
  listingHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  intentBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  intentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sessionPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
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
  sportBadge: {
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flexShrink: 0,
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
  introBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  introBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  partnerBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
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
  whoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  whoHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rosterMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  friendLine: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  avatarReadyDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  whoBody: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  avatarRow: {
    position: 'relative',
    height: 24,
  },
  avatarSlot: {
    position: 'absolute',
    width: 24,
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

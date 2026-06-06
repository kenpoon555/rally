import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RegularGroup } from '../../types/regularGroup';
import { RegularGroupMemberRow } from '../../services/regularGroupService';
import { Activity } from '../../types/activity';
import { RallyLeaderboardPanel } from '../RallyLeaderboardPanel';
import { VenueBlock } from '../VenueBlock';
import { PartnerRallyBadge } from '../PartnerRallyBadge';
import { Button } from '../ui';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { setRegularGroupDefaultLocation } from '../../services/venueService';
import {
  formatReliabilityLabel,
  getUserAttendanceStats,
  UserAttendanceStats,
} from '../../services/activityService';
import { getRallyLeaderboard } from '../../services/rallyLeaderboardService';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  group: RegularGroup;
  groupId: string;
  members: RegularGroupMemberRow[];
  activities: Activity[];
  viewerId?: string;
  isHost: boolean;
  onReload: () => Promise<void>;
  onInviteFriends: () => void;
};

type StatPill = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
};

export const RallyCrewPanel: React.FC<Props> = ({
  group,
  groupId,
  members,
  activities,
  viewerId,
  isHost,
  onReload,
  onInviteFriends,
}) => {
  const [attendanceStats, setAttendanceStats] = useState<UserAttendanceStats | null>(null);
  const [viewerStreak, setViewerStreak] = useState(0);
  const [viewerRank, setViewerRank] = useState<number | null>(null);
  const [viewerTourneyWins, setViewerTourneyWins] = useState(0);
  const [loadingViewer, setLoadingViewer] = useState(false);

  const upcoming = activities.filter((a) => a.status === 'active');
  const currentActivity = upcoming[0];
  const latestLocationId =
    currentActivity?.location_id ??
    activities.find((a) => a.location_id)?.location_id ??
    null;

  const loadViewerStats = useCallback(async () => {
    if (!viewerId) {
      return;
    }
    setLoadingViewer(true);
    try {
      const [attendance, leaderboard] = await Promise.all([
        getUserAttendanceStats(viewerId),
        getRallyLeaderboard(groupId, 'all'),
      ]);
      setAttendanceStats(attendance);
      const viewerEntry = leaderboard.find((e) => e.user_id === viewerId);
      setViewerStreak(viewerEntry?.week_streak ?? 0);
      setViewerRank(viewerEntry?.rank ?? null);
      setViewerTourneyWins(viewerEntry?.tournament_wins ?? 0);
    } catch {
      setAttendanceStats(null);
      setViewerStreak(0);
      setViewerRank(null);
      setViewerTourneyWins(0);
    } finally {
      setLoadingViewer(false);
    }
  }, [groupId, viewerId]);

  useEffect(() => {
    void loadViewerStats();
  }, [loadViewerStats]);

  const statPills = useMemo((): StatPill[] => {
    const reliability = formatReliabilityLabel(attendanceStats);
    const streak =
      viewerStreak > 0
        ? `${viewerStreak} wk${viewerStreak === 1 ? '' : 's'}`
        : 'Start one';
    const rank = viewerRank != null ? `#${viewerRank}` : '—';
    const wins = viewerTourneyWins > 0 ? `${viewerTourneyWins}` : '0';

    return [
      { icon: 'shield-checkmark-outline', label: 'Reliability', value: reliability, tint: colors.primaryLight },
      { icon: 'flame-outline', label: 'Streak', value: streak, tint: colors.accentSoft },
      { icon: 'trophy-outline', label: 'Rank', value: rank, tint: colors.successSoft },
      { icon: 'medal-outline', label: 'Tourney wins', value: wins, tint: colors.infoSoft },
    ];
  }, [attendanceStats, viewerRank, viewerStreak, viewerTourneyWins]);

  const setDefaultCourt = async () => {
    if (!latestLocationId) {
      Alert.alert('No court yet', 'Schedule a game with a court first.');
      return;
    }
    try {
      await setRegularGroupDefaultLocation(group.id, latestLocationId);
      await onReload();
      Alert.alert('Saved', 'Default court updated.');
    } catch (error: unknown) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {group.is_partner_rally ? (
        <View style={styles.partnerWrap}>
          <PartnerRallyBadge />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Your board</Text>
      {loadingViewer ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.pillGrid}>
          {statPills.map((pill) => (
            <View key={pill.label} style={[styles.pill, { backgroundColor: pill.tint }]}>
              <Ionicons name={pill.icon} size={18} color={colors.primaryDark} />
              <Text style={styles.pillLabel}>{pill.label}</Text>
              <Text style={styles.pillValue} numberOfLines={2}>
                {pill.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      <RallyLeaderboardPanel groupId={groupId} viewerId={viewerId} />

      <Text style={styles.sectionTitle}>Grow the crew</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>{PRODUCT_COPY.shareRallyInviteHint}</Text>
        <Button title={PRODUCT_COPY.inviteFriendsToRally} size="sm" onPress={onInviteFriends} />
      </View>

      {group.default_location_id || (isHost && latestLocationId) ? (
        <>
          <Text style={styles.sectionTitle}>Home court</Text>
          <View style={styles.card}>
            {group.default_location_id ? (
              <VenueBlock locationId={group.default_location_id} />
            ) : (
              <Text style={styles.hint}>Set a home court so new games pre-fill the venue.</Text>
            )}
            {isHost && latestLocationId && latestLocationId !== group.default_location_id ? (
              <Button
                title="Use upcoming game court"
                variant="ghost"
                size="sm"
                onPress={() => void setDefaultCourt()}
              />
            ) : isHost && !group.default_location_id && latestLocationId ? (
              <Button
                title="Set from upcoming game"
                variant="secondary"
                size="sm"
                onPress={() => void setDefaultCourt()}
              />
            ) : null}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Players ({members.length})</Text>
      <View style={styles.memberList}>
        {members.map((member, index) => (
          <View
            key={member.user_id}
            style={[styles.memberRow, index === members.length - 1 && styles.memberRowLast]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(member.user?.username?.[0] ?? 'P').toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberBody}>
              <Text style={styles.memberName}>@{member.user?.username ?? 'player'}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  partnerWrap: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  loader: {
    marginVertical: spacing.md,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pill: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 4,
  },
  pillLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pillValue: {
    ...typography.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  memberList: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberRowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    fontSize: 14,
  },
  memberBody: {
    flex: 1,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  memberRole: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
});

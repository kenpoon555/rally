import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getRegularGroupById,
  getRegularGroupMembers,
  getCrewActivities,
  RegularGroupMemberRow,
} from '../../services/regularGroupService';
import {
  createMiniTournament,
  getTournamentsForGroup,
} from '../../services/miniTournamentService';
import { Activity } from '../../types/activity';
import { RegularGroup } from '../../types/regularGroup';
import { MiniTournament } from '../../types/miniTournament';
import { buildRegularGroupInviteUrl } from '../../navigation/deepLinking';
import { ROUTES } from '../../constants/routes';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { ensureCrewConversation } from '../../services/chatService';
import { Button, ScreenHeader } from '../../components/ui';
import { CrewGameSessionCard } from '../../components/CrewGameSessionCard';
import { joinCrewGame } from '../../services/regularGroupService';
import { finalizeGameCommitment, setGameReady } from '../../services/activityService';
import { formatRosterSummary } from '../../utils/activityHelpers';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type RegularsCrewStackParams = {
  RegularsCrew: { groupId: string };
};

type Props = NativeStackScreenProps<RegularsCrewStackParams, 'RegularsCrew'>;

const RegularsCrewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<RegularGroup | null>(null);
  const [members, setMembers] = useState<RegularGroupMemberRow[]>([]);
  const [tournaments, setTournaments] = useState<MiniTournament[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, m, t, acts] = await Promise.all([
        getRegularGroupById(groupId),
        getRegularGroupMembers(groupId),
        getTournamentsForGroup(groupId),
        getCrewActivities(groupId),
      ]);
      setGroup(g);
      setMembers(m);
      setTournaments(t);
      setActivities(acts);
    } catch (error: unknown) {
      Alert.alert(PRODUCT_COPY.rally, error instanceof Error ? error.message : 'Could not load Rally.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const isHost = group?.host_id === user?.id;

  const shareInvite = async () => {
    if (!group?.invite_token) {
      return;
    }
    const url = buildRegularGroupInviteUrl(group.invite_token);
    await Share.share({
      message: `Join our ${group.sport_type} crew "${group.name}" on Rally: ${url}`,
      url,
    });
  };

  const openCrewChat = async (activityId?: string) => {
    try {
      const conversationId = await ensureCrewConversation(groupId);
      navigation.navigate(ROUTES.CHAT.THREAD as never, {
        conversationId,
        title: group?.name ? PRODUCT_COPY.rallyChatTitle(group.name) : PRODUCT_COPY.rallyChat,
        activityId,
        groupId,
      } as never);
    } catch (error: unknown) {
      Alert.alert(
        'Chat unavailable',
        error instanceof Error ? error.message : 'Could not open Rally chat.'
      );
    }
  };

  const handleCreateTournament = async () => {
    setCreatingTournament(true);
    try {
      const tournamentId = await createMiniTournament(groupId);
      navigation.navigate(ROUTES.TOURNAMENT.MINI as never, { tournamentId } as never);
    } catch (error: unknown) {
      Alert.alert(
        'Tournament',
        error instanceof Error ? error.message : 'Could not create tournament.'
      );
    } finally {
      setCreatingTournament(false);
    }
  };

  const openScheduleNext = () => {
    const sourceId =
      activities.find((a) => a.status === 'active')?.id ?? group?.source_activity_id;
    if (!sourceId) {
      Alert.alert(group?.name ?? PRODUCT_COPY.rally, 'No game yet. Host can create the first one from chat.');
      return;
    }
    navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, { activityId: sourceId } as never);
  };

  if (loading && !group) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Crew not found.</Text>
      </View>
    );
  }

  const upcoming = activities.filter((a) => a.status === 'active');
  const currentActivity = upcoming[0];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
    >
      <ScreenHeader
        title={group.name}
        subtitle={`${group.sport_type} · ${members.length} member${members.length === 1 ? '' : 's'}`}
      />

      <View style={styles.panel}>
        <Button title={PRODUCT_COPY.openRallyChat} onPress={() => void openCrewChat(currentActivity?.id)} />
        {isHost ? (
          <Button title="Schedule next game" variant="secondary" size="sm" onPress={openScheduleNext} />
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Games</Text>
      <View style={styles.section}>
        {activities.length === 0 ? (
          <Text style={styles.hint}>No games yet. Host can schedule from chat or game details.</Text>
        ) : (
          activities.slice(0, 8).map((activity) => {
            const isActivityHost = activity.user_id === user?.id;
            const myJoin = activity.join_requests?.find(
              (jr) => jr.user_id === user?.id && jr.status === 'approved'
            );
            const endMs =
              new Date(activity.start_time).getTime() + (activity.duration ?? 60) * 60 * 1000;
            const showActions =
              activity.status === 'active' &&
              endMs >= Date.now() &&
              activity.match_status !== 'finalized';
            return (
              <CrewGameSessionCard
                key={activity.id}
                activity={activity}
                isCurrent={activity.id === currentActivity?.id}
                showActions={showActions}
                isHost={isActivityHost}
                isOnRoster={isActivityHost || Boolean(myJoin)}
                isReady={isActivityHost || Boolean(myJoin?.ready_at)}
                isFinalized={activity.match_status === 'finalized'}
                busy={busyActivityId === activity.id}
                onJoin={async () => {
                  setBusyActivityId(activity.id);
                  try {
                    const result = await joinCrewGame(activity.id);
                    if (result === 'waitlisted') {
                      Alert.alert(
                        'Waitlist',
                        'Game is full. You are on the waitlist if a spot opens.'
                      );
                    }
                    await load();
                  } catch (e: unknown) {
                    Alert.alert('Join failed', e instanceof Error ? e.message : 'Try again.');
                  } finally {
                    setBusyActivityId(null);
                  }
                }}
                onConfirmIn={async () => {
                  setBusyActivityId(activity.id);
                  try {
                    await setGameReady(activity.id, true);
                    await load();
                  } finally {
                    setBusyActivityId(null);
                  }
                }}
                onLockRoster={async () => {
                  setBusyActivityId(activity.id);
                  try {
                    await finalizeGameCommitment(activity.id);
                    await load();
                  } finally {
                    setBusyActivityId(null);
                  }
                }}
                onOpenDetails={() => void openCrewChat(activity.id)}
              />
            );
          })
        )}
        {currentActivity ? (
          <Text style={styles.hint}>{formatRosterSummary(currentActivity)}</Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitleInline}>Invite</Text>
        <Text style={styles.hint}>Share a link so friends join this crew and the next game.</Text>
        <Button title="Share crew invite link" variant="ghost" size="sm" onPress={() => void shareInvite()} />
      </View>

      <Text style={styles.sectionTitle}>Members</Text>
      {members.map((member) => (
        <View key={member.user_id} style={styles.memberRow}>
          <Text style={styles.memberName}>@{member.user?.username ?? 'player'}</Text>
          <Text style={styles.memberRole}>{member.role}</Text>
        </View>
      ))}

      <View style={styles.panel}>
        <Text style={styles.sectionTitleInline}>Mini tournament</Text>
        {isHost ? (
          <Button
            title={creatingTournament ? 'Creating…' : 'Create mini tournament'}
            variant="secondary"
            size="sm"
            onPress={() => void handleCreateTournament()}
            disabled={creatingTournament}
          />
        ) : null}
        {tournaments.length === 0 ? (
          <Text style={styles.hint}>No tournaments yet. Host can start a doubles round-robin.</Text>
        ) : (
          tournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              style={styles.tournamentRow}
              onPress={() =>
                navigation.navigate(ROUTES.TOURNAMENT.MINI as never, {
                  tournamentId: tournament.id,
                } as never)
              }
            >
              <Text style={styles.tournamentTitle}>{tournament.name}</Text>
              <Text style={styles.tournamentMeta}>{tournament.status}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: colors.error,
  },
  panel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitleInline: {
    ...typography.label,
    color: colors.textSecondary,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  memberRole: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tournamentRow: {
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tournamentTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  tournamentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
});

export default RegularsCrewScreen;

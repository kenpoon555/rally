import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getMiniTournamentById,
  getMiniTournamentMatches,
  getMiniTournamentMembers,
  joinMiniTournament,
  recordMiniTournamentMatch,
  startMiniTournament,
} from '../../services/miniTournamentService';
import { MiniTournament, MiniTournamentMatch, MiniTournamentMember } from '../../types/miniTournament';
import { Button, KeyboardSafeView, ScreenHeader, keyboardAwareScrollProps } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type MiniTournamentStackParams = {
  MiniTournament: { tournamentId: string };
};

type Props = NativeStackScreenProps<MiniTournamentStackParams, 'MiniTournament'>;

function formatTeamLabel(users?: { username: string }[]): string {
  if (!users?.length) {
    return 'TBD';
  }
  return users.map((user) => `@${user.username}`).join(' & ');
}

const MiniTournamentScreen: React.FC<Props> = ({ route }) => {
  const { tournamentId } = route.params;
  const { user } = useAuth();
  const [tournament, setTournament] = useState<MiniTournament | null>(null);
  const [members, setMembers] = useState<MiniTournamentMember[]>([]);
  const [matches, setMatches] = useState<MiniTournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scoreMatchId, setScoreMatchId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState('21');
  const [awayScore, setAwayScore] = useState('15');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, m, matchRows] = await Promise.all([
        getMiniTournamentById(tournamentId),
        getMiniTournamentMembers(tournamentId),
        getMiniTournamentMatches(tournamentId),
      ]);
      setTournament(t);
      setMembers(m);
      setMatches(matchRows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not load tournament.';
      Alert.alert('Tournament', message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const isHost = tournament?.host_id === user?.id;
  const isMember = members.some((member) => member.user_id === user?.id);
  const canJoin = tournament?.status === 'open' && !isMember;

  const handleJoin = async () => {
    setBusy(true);
    try {
      await joinMiniTournament(tournamentId);
      await load();
    } catch (error: unknown) {
      Alert.alert('Join', error instanceof Error ? error.message : 'Could not join.');
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      const matchCount = await startMiniTournament(tournamentId);
      await load();
      Alert.alert('Tournament started', `${matchCount} doubles matches generated.`);
    } catch (error: unknown) {
      Alert.alert('Start', error instanceof Error ? error.message : 'Could not start.');
    } finally {
      setBusy(false);
    }
  };

  const handleRecordScore = async (matchId: string) => {
    const home = Number.parseInt(homeScore, 10);
    const away = Number.parseInt(awayScore, 10);
    if (!Number.isFinite(home) || !Number.isFinite(away)) {
      Alert.alert('Score', 'Enter valid numbers.');
      return;
    }
    setBusy(true);
    try {
      await recordMiniTournamentMatch(matchId, home, away);
      setScoreMatchId(null);
      await load();
    } catch (error: unknown) {
      Alert.alert('Score', error instanceof Error ? error.message : 'Could not save score.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !tournament) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Tournament not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardSafeView style={styles.container}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      {...keyboardAwareScrollProps}
    >
      <ScreenHeader
        title={tournament.name}
        subtitle={`${tournament.sport_type} · ${tournament.status} · private to your Rally`}
      />

      <View style={styles.section}>
        {canJoin ? (
          <Button title="Join tournament" onPress={() => void handleJoin()} loading={busy} />
        ) : null}
        {isHost && tournament.status === 'open' ? (
          <Button
            title={busy ? 'Starting…' : `Start round-robin (${members.length} players)`}
            variant="accent"
            onPress={() => void handleStart()}
            disabled={busy || members.length < 4}
            style={styles.hostAction}
          />
        ) : null}
        {isHost && tournament.status === 'open' && members.length < 4 ? (
          <Text style={styles.hint}>Need at least 4 players (even count) to start doubles.</Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Leaderboard</Text>
      {members.length === 0 ? (
        <Text style={styles.emptyLine}>No players yet.</Text>
      ) : (
        members.map((member, index) => (
          <View key={member.user_id} style={styles.leaderRow}>
            <Text style={styles.leaderRank}>{index + 1}</Text>
            <Text style={styles.leaderName}>@{member.user?.username ?? 'player'}</Text>
            <Text style={styles.leaderStats}>
              {member.points} pts · {member.wins}W-{member.losses}L
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Matches</Text>
      {matches.length === 0 ? (
        <Text style={styles.emptyLine}>
          {tournament.status === 'open'
            ? 'Matches appear after the host starts the tournament.'
            : 'No matches.'}
        </Text>
      ) : (
        matches.map((match) => (
          <View key={match.id} style={styles.matchCard}>
            <Text style={styles.matchTeams}>
              {formatTeamLabel(match.home_users)} vs {formatTeamLabel(match.away_users)}
            </Text>
            {match.status === 'done' ? (
              <Text style={styles.matchScore}>
                Final: {match.home_score} – {match.away_score}
              </Text>
            ) : isHost ? (
              scoreMatchId === match.id ? (
                <View style={styles.scoreForm}>
                  <TextInput
                    style={styles.scoreInput}
                    value={homeScore}
                    onChangeText={setHomeScore}
                    keyboardType="number-pad"
                    placeholder="Home"
                  />
                  <Text style={styles.scoreDash}>–</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={awayScore}
                    onChangeText={setAwayScore}
                    keyboardType="number-pad"
                    placeholder="Away"
                  />
                  <Button
                    title="Save"
                    size="sm"
                    onPress={() => void handleRecordScore(match.id)}
                    loading={busy}
                  />
                </View>
              ) : (
                <TouchableOpacity onPress={() => setScoreMatchId(match.id)}>
                  <Text style={styles.recordLink}>Record score</Text>
                </TouchableOpacity>
              )
            ) : (
              <Text style={styles.matchPending}>Pending</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    ...typography.body,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  hostAction: {
    marginTop: spacing.sm,
  },
  hint: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyLine: {
    marginHorizontal: spacing.lg,
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  leaderRank: {
    width: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  leaderName: {
    flex: 1,
    ...typography.bodyMedium,
  },
  leaderStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  matchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchTeams: {
    ...typography.bodyMedium,
  },
  matchScore: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textSecondary,
  },
  matchPending: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textTertiary,
  },
  recordLink: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  scoreForm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  scoreInput: {
    width: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.xs,
    textAlign: 'center',
    backgroundColor: colors.background,
  },
  scoreDash: {
    fontWeight: '600',
  },
});

export default MiniTournamentScreen;

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  generateSessionRotation,
  getSessionRotationState,
} from '../services/sessionRotationService';
import { SessionRotationState } from '../types/sessionRotation';
import { Button } from './ui';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  activityId: string;
  isHost: boolean;
  canUseRotation: boolean;
  minPlayers?: number;
};

const formatTeam = (players: { username: string }[]): string => {
  if (players.length < 4) {
    return players.map((p) => p.username).join(' · ');
  }
  return `${players[0].username} & ${players[1].username}  vs  ${players[2].username} & ${players[3].username}`;
};

export const SessionRotationPanel: React.FC<Props> = ({
  activityId,
  isHost,
  canUseRotation,
  minPlayers = 4,
}) => {
  const [state, setState] = useState<SessionRotationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reload = useCallback(async () => {
    if (!canUseRotation) {
      setState(null);
      return;
    }
    setLoading(true);
    try {
      const next = await getSessionRotationState(activityId);
      setState(next);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [activityId, canUseRotation]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleGenerate = async (nextRound: boolean) => {
    setGenerating(true);
    try {
      await generateSessionRotation(activityId);
      await reload();
    } catch (err: unknown) {
      Alert.alert(
        nextRound ? 'Next round failed' : 'Rotation failed',
        err instanceof Error ? err.message : 'Try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (!canUseRotation) {
    return null;
  }

  const rotation = state?.rotation;
  const playerCount = state?.player_count ?? 0;
  const enoughPlayers = playerCount >= minPlayers;
  const sittingOutNames =
    rotation?.config?.sitting_out_players?.map((p) => p.username) ??
    [];

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Court rotation</Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {!rotation ? (
        <Text style={styles.hint}>
          {enoughPlayers
            ? 'Generate doubles pairings — we avoid repeat partners when possible.'
            : `Need at least ${minPlayers} players on the locked roster.`}
        </Text>
      ) : (
        <>
          <Text style={styles.roundLabel}>
            Round {rotation.round_number}
            {state && state.total_rounds > 1 ? ` of ${state.total_rounds}` : ''}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courtsRow}
          >
            {rotation.courts.map((court) => (
              <View key={court.court_number} style={styles.courtCard}>
                <Text style={styles.courtTitle}>Court {court.court_number}</Text>
                <Text style={styles.courtTeams}>{formatTeam(court.players)}</Text>
              </View>
            ))}
          </ScrollView>
          {sittingOutNames.length > 0 ? (
            <Text style={styles.sitOut}>
              Sitting out: {sittingOutNames.join(', ')}
            </Text>
          ) : null}
        </>
      )}

      {isHost && enoughPlayers ? (
        <View style={styles.actions}>
          <Button
            title={
              generating
                ? 'Generating…'
                : rotation
                  ? 'Next round'
                  : 'Generate rotation'
            }
            size="sm"
            onPress={() => void handleGenerate(Boolean(rotation))}
            loading={generating}
            disabled={generating}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  panelTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  roundLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  courtsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  courtCard: {
    width: 260,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  courtTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  courtTeams: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  sitOut: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
});

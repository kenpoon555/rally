import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SessionCardPayload } from '../../types/sessionCard';
import { activityFromSessionCard } from '../../utils/sessionCardHelpers';
import { Activity } from '../../types/activity';
import { RegularGroup } from '../../types/regularGroup';
import { MiniTournament } from '../../types/miniTournament';
import { CrewGameSessionCard } from '../CrewGameSessionCard';
import { Button } from '../ui';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { ROUTES } from '../../constants/routes';
import { joinCrewGame } from '../../services/regularGroupService';
import {
  finalizeGameCommitment,
  nudgeSessionRoster,
  setGameReady,
} from '../../services/activityService';
import { getCompletedTournamentWinners } from '../../services/miniTournamentService';
import { sportSupportsMiniTournament } from '../../constants/sports';
import { colors, radius, spacing, typography } from '../../constants/theme';
import {
  formatTournamentWinnerMeta,
  TournamentWinnerSummary,
} from '../../utils/miniTournamentHelpers';
import { CreateRallyGameSheet } from './CreateRallyGameSheet';
import { GameModeChip } from './GameModeChip';

type Props = {
  group: RegularGroup;
  sessionCards: SessionCardPayload[];
  tournaments: MiniTournament[];
  isHost: boolean;
  isMember: boolean;
  busyActivityId: string | null;
  setBusyActivityId: (id: string | null) => void;
  onReload: () => Promise<void>;
  navigation: NativeStackNavigationProp<any>;
};

function tournamentStatusLabel(status: MiniTournament['status']): string {
  if (status === 'open') {
    return 'Open · join in Rally';
  }
  if (status === 'active') {
    return 'In progress';
  }
  return 'Completed';
}

const RallyTournamentRow: React.FC<{
  tournament: MiniTournament;
  tone: 'live' | 'history';
  winner?: TournamentWinnerSummary | null;
  onPress: () => void;
}> = ({ tournament, tone, winner, onPress }) => {
  const isLive = tone === 'live';
  const metaLine = isLive
    ? tournamentStatusLabel(tournament.status)
    : formatTournamentWinnerMeta(winner ?? null);
  const hasWinner = !isLive && winner != null;

  return (
    <TouchableOpacity
      style={[
        styles.playCard,
        isLive ? styles.playCardLive : styles.playCardHistory,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <GameModeChip label={PRODUCT_COPY.gameModeTournament} kind="tournament" />
      <Text style={styles.playCardTitle} numberOfLines={2}>
        {tournament.name}
      </Text>
      <Text
        style={[styles.playCardMeta, hasWinner && styles.playCardMetaWinner]}
        numberOfLines={2}
      >
        {metaLine}
      </Text>
      <View style={styles.playCardFooter}>
        <Text style={styles.playCardLink}>{isLive ? 'Open bracket' : 'View results'}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

export const RallyPlayPanel: React.FC<Props> = ({
  group,
  sessionCards,
  tournaments,
  isMember,
  busyActivityId,
  setBusyActivityId,
  onReload,
  navigation,
}) => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [winnersById, setWinnersById] = React.useState<
    Record<string, TournamentWinnerSummary | null>
  >({});

  const activities = sessionCards.map((card) => ({
    card,
    activity: activityFromSessionCard(card),
  }));
  const upcoming = activities.filter(({ activity }) => activity.status === 'active');
  const past = activities.filter(({ activity }) => activity.status !== 'active');
  const currentActivity = upcoming[0]?.activity;

  const liveTournaments = tournaments.filter((t) => t.status === 'open' || t.status === 'active');
  const completedTournaments = tournaments.filter((t) => t.status === 'completed');
  const showTournaments = sportSupportsMiniTournament(group.sport_type);
  const hasUpcoming = upcoming.length > 0 || (showTournaments && liveTournaments.length > 0);
  const hasHistory = past.length > 0 || completedTournaments.length > 0;

  React.useEffect(() => {
    const completedIds = tournaments
      .filter((tournament) => tournament.status === 'completed')
      .map((tournament) => tournament.id);
    if (completedIds.length === 0) {
      setWinnersById({});
      return;
    }

    let cancelled = false;
    void getCompletedTournamentWinners(completedIds)
      .then((winners) => {
        if (!cancelled) {
          setWinnersById(winners);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWinnersById({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tournaments]);

  const openTournament = (tournamentId: string) => {
    navigation.navigate(ROUTES.TOURNAMENT.MINI as never, { tournamentId } as never);
  };

  const handleCreated = async (result: { kind: 'activity' | 'tournament'; id: string }) => {
    await onReload();
    if (result.kind === 'tournament') {
      openTournament(result.id);
    }
  };

  const openActivityDetail = (activityId: string) => {
    navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, { activityId } as never);
  };

  const renderSessionCard = (card: SessionCardPayload, activity: Activity, isCurrent: boolean) => {
    const viewer = card.viewer;
    return (
      <CrewGameSessionCard
        key={card.activity_id}
        activity={activity}
        variant="rally"
        gameModeLabel={PRODUCT_COPY.gameModePickup}
        isCurrent={isCurrent}
        showActions={viewer.show_actions}
        isHost={viewer.is_host}
        isOnRoster={viewer.is_on_roster}
        isReady={viewer.is_ready}
        isFinalized={viewer.is_finalized}
        isWaitlisted={viewer.is_waitlisted}
        isFull={viewer.is_full}
        readyCount={card.ready_count}
        canLock={viewer.can_lock}
        lockReadiness={viewer.lock_readiness}
        waitlistPosition={viewer.waitlist_position}
        busy={busyActivityId === activity.id}
        onJoin={async () => {
          setBusyActivityId(activity.id);
          try {
            const result = await joinCrewGame(activity.id);
            if (result === 'waitlisted') {
              Alert.alert('Waitlist', 'Game is full. You are on the waitlist if a spot opens.');
            }
            await onReload();
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
            await onReload();
          } finally {
            setBusyActivityId(null);
          }
        }}
        onUndoImIn={
          viewer.is_host
            ? undefined
            : () => {
                Alert.alert(PRODUCT_COPY.undoImInTitle, PRODUCT_COPY.undoImInBody, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: PRODUCT_COPY.undoImIn,
                    style: 'destructive',
                    onPress: () => {
                      setBusyActivityId(activity.id);
                      void (async () => {
                        try {
                          await setGameReady(activity.id, false);
                          await onReload();
                        } catch (e: unknown) {
                          Alert.alert(
                            "Couldn't save",
                            e instanceof Error ? e.message : 'Try again.'
                          );
                        } finally {
                          setBusyActivityId(null);
                        }
                      })();
                    },
                  },
                ]);
              }
        }
        onLockRoster={async () => {
          setBusyActivityId(activity.id);
          try {
            await finalizeGameCommitment(activity.id);
            await onReload();
          } finally {
            setBusyActivityId(null);
          }
        }}
        showNudge={viewer.can_nudge}
        onNudge={async () => {
          setBusyActivityId(activity.id);
          try {
            const count = await nudgeSessionRoster(activity.id);
            Alert.alert(
              PRODUCT_COPY.nudgeRosterSent,
              `Reminder sent to ${count} player${count === 1 ? '' : 's'}.`
            );
          } catch (e: unknown) {
            Alert.alert('Could not nudge', e instanceof Error ? e.message : 'Try again.');
          } finally {
            setBusyActivityId(null);
          }
        }}
        onOpenDetails={() => openActivityDetail(activity.id)}
      />
    );
  };

  const renderCreateGameCta = () => {
    if (!isMember) {
      return null;
    }
    return (
      <Button
        title={PRODUCT_COPY.createGame}
        onPress={() => setCreateOpen(true)}
        style={styles.createBtn}
      />
    );
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {!hasUpcoming ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.hint}>{PRODUCT_COPY.createGameHint}</Text>
            {renderCreateGameCta()}
          </View>
        ) : (
          <View style={styles.cardStack}>
            {upcoming.map(({ card, activity }) =>
              renderSessionCard(card, activity, activity.id === currentActivity?.id)
            )}
            {showTournaments
              ? liveTournaments.map((tournament) => (
                  <RallyTournamentRow
                    key={tournament.id}
                    tournament={tournament}
                    tone="live"
                    onPress={() => openTournament(tournament.id)}
                  />
                ))
              : null}
            {renderCreateGameCta()}
          </View>
        )}

        {hasHistory ? (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={styles.cardStack}>
              {past.map(({ card, activity }) => renderSessionCard(card, activity, false))}
              {completedTournaments.map((tournament) => (
                <RallyTournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  tone="history"
                  winner={winnersById[tournament.id] ?? null}
                  onPress={() => openTournament(tournament.id)}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            <Text style={styles.hint}>Finished games and tournaments show up here.</Text>
          </>
        )}
      </ScrollView>

      <CreateRallyGameSheet
        visible={createOpen}
        group={group}
        onClose={() => setCreateOpen(false)}
        onCreated={(result) => void handleCreated(result)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  emptyBlock: {
    gap: spacing.sm,
  },
  cardStack: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  createBtn: {
    marginTop: spacing.sm,
  },
  playCard: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  playCardLive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  playCardHistory: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.85,
  },
  playCardTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  playCardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  playCardMetaWinner: {
    color: colors.warning,
    fontWeight: '600',
  },
  playCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  playCardLink: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});

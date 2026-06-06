import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { createMiniTournament } from '../../services/miniTournamentService';
import { sportSupportsMiniTournament } from '../../constants/sports';
import { formatRosterSummary } from '../../utils/activityHelpers';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  group: RegularGroup;
  sessionCards: SessionCardPayload[];
  tournaments: MiniTournament[];
  isHost: boolean;
  busyActivityId: string | null;
  setBusyActivityId: (id: string | null) => void;
  onReload: () => Promise<void>;
  navigation: NativeStackNavigationProp<any>;
  onOpenGameRoom: (activityId: string) => void;
};

export const RallyPlayPanel: React.FC<Props> = ({
  group,
  sessionCards,
  tournaments,
  isHost,
  busyActivityId,
  setBusyActivityId,
  onReload,
  navigation,
  onOpenGameRoom,
}) => {
  const [creatingTournament, setCreatingTournament] = React.useState(false);

  const activities = sessionCards.map((card) => ({
    card,
    activity: activityFromSessionCard(card),
  }));
  const upcoming = activities.filter(({ activity }) => activity.status === 'active');
  const past = activities.filter(({ activity }) => activity.status !== 'active');
  const currentActivity = upcoming[0]?.activity;

  const openScheduleNext = () => {
    const sourceId = currentActivity?.id ?? group.source_activity_id;
    if (!sourceId) {
      Alert.alert(group.name, 'No game yet. Host can schedule the first one.');
      return;
    }
    navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, { activityId: sourceId } as never);
  };

  const handleCreateTournament = async () => {
    setCreatingTournament(true);
    try {
      const tournamentId = await createMiniTournament(group.id);
      await onReload();
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

  const renderSessionCard = (card: SessionCardPayload, activity: Activity, isCurrent: boolean) => {
    const viewer = card.viewer;
    return (
      <CrewGameSessionCard
        key={card.activity_id}
        activity={activity}
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
        onUndoImIn={() => {
          setBusyActivityId(activity.id);
          void (async () => {
            try {
              await setGameReady(activity.id, false);
              await onReload();
            } catch (e: unknown) {
              Alert.alert("Couldn't save", e instanceof Error ? e.message : 'Try again.');
            } finally {
              setBusyActivityId(null);
            }
          })();
        }}
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
        onOpenDetails={() => onOpenGameRoom(activity.id)}
      />
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isHost ? (
        <Button title="Schedule next game" size="sm" onPress={openScheduleNext} />
      ) : null}

      <Text style={styles.sectionTitle}>Upcoming</Text>
      {upcoming.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.hint}>{PRODUCT_COPY.scheduleFirstSessionHint}</Text>
          {isHost ? (
            <Button title={PRODUCT_COPY.scheduleFirstSession} size="sm" onPress={openScheduleNext} />
          ) : null}
        </View>
      ) : (
        <View style={styles.cardStack}>
          {upcoming.map(({ card, activity }) =>
            renderSessionCard(card, activity, activity.id === currentActivity?.id)
          )}
          {currentActivity ? (
            <Text style={styles.hint}>{formatRosterSummary(currentActivity)}</Text>
          ) : null}
        </View>
      )}

      <Text style={styles.sectionTitle}>Past games</Text>
      {past.length === 0 ? (
        <Text style={styles.hint}>Finished games land here.</Text>
      ) : (
        <View style={styles.cardStack}>
          {past.map(({ card, activity }) => renderSessionCard(card, activity, false))}
        </View>
      )}

      {sportSupportsMiniTournament(group.sport_type) ? (
        <>
          <Text style={styles.sectionTitle}>Tournaments</Text>
          <View style={styles.tournamentBlock}>
            {isHost ? (
              <Button
                title={creatingTournament ? 'Creating…' : 'Start mini tournament'}
                variant="secondary"
                size="sm"
                onPress={() => void handleCreateTournament()}
                disabled={creatingTournament}
              />
            ) : null}
            {tournaments.length === 0 ? (
              <Text style={styles.hint}>Round-robin brackets for your regulars.</Text>
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
        </>
      ) : null}
    </ScrollView>
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
  tournamentBlock: {
    gap: spacing.sm,
  },
  tournamentRow: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
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

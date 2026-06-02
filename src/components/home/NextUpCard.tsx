import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { MyGameEntry } from '../../services/activityService';
import { RegularGroup } from '../../types/regularGroup';
import { formatRelativeStart } from '../../utils/formatRelativeStart';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface NextUpCardProps {
  nextGame: MyGameEntry | null;
  fallbackGroup: RegularGroup | null;
  currentUserId?: string;
  onOpenGameRoom: (entry: MyGameEntry) => void;
  onScheduleNext: (sourceActivityId: string) => void;
  openingGameId?: string | null;
}

export const NextUpCard: React.FC<NextUpCardProps> = ({
  nextGame,
  fallbackGroup,
  currentUserId,
  onOpenGameRoom,
  onScheduleNext,
  openingGameId,
}) => {
  if (nextGame) {
    const busy = openingGameId === nextGame.activity.id;
    const court = nextGame.activity.location?.name || 'Court TBD';
    return (
      <View style={styles.card}>
        <Text style={styles.label}>NEXT UP</Text>
        <Text style={styles.title}>
          {nextGame.activity.sport_type} · {court}
        </Text>
        <Text style={styles.time}>{formatRelativeStart(nextGame.activity.start_time)}</Text>
        <Button
          title={busy ? 'Opening…' : 'Open Game Room'}
          variant="secondary"
          size="sm"
          onPress={() => onOpenGameRoom(nextGame)}
          disabled={busy}
          loading={busy}
          style={styles.cta}
        />
      </View>
    );
  }

  if (!fallbackGroup) {
    return null;
  }

  const isGroupHost = fallbackGroup.host_id === currentUserId;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>YOUR CREW</Text>
      <Text style={styles.title}>{fallbackGroup.name}</Text>
      <Text style={styles.time}>No game on the calendar yet.</Text>
      {isGroupHost && fallbackGroup.source_activity_id ? (
        <Button
          title="Schedule next"
          variant="secondary"
          size="sm"
          onPress={() => onScheduleNext(fallbackGroup.source_activity_id as string)}
          style={styles.cta}
        />
      ) : (
        <Text style={styles.waiting}>Waiting for the host to schedule the next game.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
  },
  title: {
    marginTop: spacing.xs + 2,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
  },
  time: {
    marginTop: 2,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  cta: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  waiting: {
    marginTop: spacing.md,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
});

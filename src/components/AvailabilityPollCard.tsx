import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilityPoll } from '../types/availabilityPoll';
import {
  closeAvailabilityPoll,
  voteAvailabilityPoll,
} from '../services/availabilityPollService';
import { Button } from './ui';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  poll: AvailabilityPoll;
  isHost: boolean;
  userId?: string;
  onUpdated: () => void;
  onScheduleFromOption?: (option: { starts_at: string; label: string }) => void;
};

const formatSlot = (startsAt: string, label: string): string => {
  const d = new Date(startsAt);
  const when = d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return label && label !== when ? `${label} · ${when}` : when;
};

export const AvailabilityPollCard: React.FC<Props> = ({
  poll,
  isHost,
  userId,
  onUpdated,
  onScheduleFromOption,
}) => {
  const [busyOptionId, setBusyOptionId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const totalVotes = useMemo(
    () => poll.options.reduce((sum, o) => sum + (o.vote_count ?? 0), 0),
    [poll.options]
  );

  const leadingOption = useMemo(() => {
    if (!poll.options.length) {
      return null;
    }
    return [...poll.options].sort((a, b) => b.vote_count - a.vote_count)[0];
  }, [poll.options]);

  const handleVote = async (optionId: string) => {
    if (!userId || poll.status !== 'open') {
      return;
    }
    setBusyOptionId(optionId);
    try {
      await voteAvailabilityPoll(poll.id, optionId);
      onUpdated();
    } catch (err: unknown) {
      Alert.alert('Vote failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusyOptionId(null);
    }
  };

  const handleClose = async (winningOptionId?: string) => {
    setClosing(true);
    try {
      await closeAvailabilityPoll(poll.id, winningOptionId ?? leadingOption?.id);
      onUpdated();
    } catch (err: unknown) {
      Alert.alert('Could not close poll', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setClosing(false);
    }
  };

  const handleSchedule = (optionId: string) => {
    const option = poll.options.find((o) => o.id === optionId);
    if (!option || !onScheduleFromOption) {
      return;
    }
    onScheduleFromOption({ starts_at: option.starts_at, label: option.label });
  };

  const isOpen = poll.status === 'open';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{poll.title}</Text>
      <Text style={styles.meta}>
        {isOpen ? 'Tap a time to vote' : 'Poll closed'}
        {totalVotes > 0 ? ` · ${totalVotes} vote${totalVotes === 1 ? '' : 's'}` : ''}
      </Text>

      {poll.options.map((option) => {
        const selected = poll.my_vote_option_id === option.id;
        const isLeading =
          isOpen && leadingOption?.id === option.id && (option.vote_count ?? 0) > 0;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionRow,
              selected && styles.optionRowSelected,
              isLeading && styles.optionRowLeading,
            ]}
            onPress={() => handleVote(option.id)}
            disabled={!isOpen || busyOptionId !== null}
          >
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionLabel}>{formatSlot(option.starts_at, option.label)}</Text>
              <Text style={styles.optionVotes}>
                {option.vote_count ?? 0} vote{(option.vote_count ?? 0) === 1 ? '' : 's'}
                {selected ? ' · You' : ''}
              </Text>
            </View>
            {busyOptionId === option.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
          </TouchableOpacity>
        );
      })}

      {isHost && isOpen ? (
        <View style={styles.hostActions}>
          <Button
            title={closing ? 'Closing…' : 'Close poll'}
            variant="secondary"
            size="sm"
            onPress={() => handleClose(leadingOption?.id)}
            disabled={closing}
            loading={closing}
          />
          {leadingOption && onScheduleFromOption ? (
            <Button
              title="Schedule from top pick"
              size="sm"
              onPress={() => handleSchedule(leadingOption.id)}
            />
          ) : null}
        </View>
      ) : null}

      {!isOpen && isHost && leadingOption && onScheduleFromOption ? (
        <Button
          title="Create game from winner"
          size="sm"
          onPress={() => handleSchedule(poll.winning_option_id ?? leadingOption.id)}
          style={styles.scheduleBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.headline,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionRowLeading: {
    borderColor: colors.accent,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  optionLabel: {
    ...typography.body,
    color: colors.text,
  },
  optionVotes: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hostActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  scheduleBtn: {
    marginTop: spacing.sm,
  },
});

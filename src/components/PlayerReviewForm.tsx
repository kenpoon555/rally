import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, TextField } from './ui';
import { colors, radius, spacing } from '../constants/theme';

type ScoreField = 'friendliness' | 'physicality' | 'vibe';

const SCORE_FIELDS: { key: ScoreField; label: string; hint: string }[] = [
  { key: 'friendliness', label: 'Friendly', hint: '1 = cold · 5 = welcoming' },
  { key: 'physicality', label: 'Intensity', hint: '1 = light · 5 = competitive' },
  { key: 'vibe', label: 'Overall', hint: '1 = rough · 5 = great match' },
];

type PlayerOption = {
  userId: string;
  username: string;
};

type Props = {
  title?: string;
  subtitle?: string;
  players?: PlayerOption[];
  selectedPlayerId: string | null;
  onSelectPlayer?: (userId: string) => void;
  friendliness: number;
  physicality: number;
  vibe: number;
  onChangeFriendliness: (value: number) => void;
  onChangePhysicality: (value: number) => void;
  onChangeVibe: (value: number) => void;
  comment: string;
  onChangeComment: (text: string) => void;
  submitting?: boolean;
  onSubmit: () => void;
  hideSubmit?: boolean;
};

function StarRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.scoreBlock}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}/5</Text>
      </View>
      <Text style={styles.scoreHint}>{hint}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${star} of 5`}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <MaterialCommunityIcons
                name={filled ? 'star' : 'star-outline'}
                size={32}
                color={filled ? colors.warning : colors.borderStrong}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function PlayerReviewForm({
  title = 'Rate Players',
  subtitle,
  players,
  selectedPlayerId,
  onSelectPlayer,
  friendliness,
  physicality,
  vibe,
  onChangeFriendliness,
  onChangePhysicality,
  onChangeVibe,
  comment,
  onChangeComment,
  submitting = false,
  onSubmit,
  hideSubmit = false,
}: Props) {
  const scores: Record<ScoreField, { value: number; onChange: (v: number) => void }> = {
    friendliness: { value: friendliness, onChange: onChangeFriendliness },
    physicality: { value: physicality, onChange: onChangePhysicality },
    vibe: { value: vibe, onChange: onChangeVibe },
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {players && players.length > 1 && onSelectPlayer ? (
        <View style={styles.playerRow}>
          {players.map((player) => (
            <Chip
              key={player.userId}
              label={player.username}
              selected={selectedPlayerId === player.userId}
              tone="primary"
              compact
              onPress={() => onSelectPlayer(player.userId)}
              style={styles.playerChip}
            />
          ))}
        </View>
      ) : null}

      {SCORE_FIELDS.map((field) => (
        <StarRow
          key={field.key}
          label={field.label}
          hint={field.hint}
          value={scores[field.key].value}
          onChange={scores[field.key].onChange}
        />
      ))}

      <TextField
        label="Comment (optional)"
        value={comment}
        onChangeText={onChangeComment}
        placeholder="Anything worth noting for next time?"
        multiline
        style={styles.commentField}
        numberOfLines={3}
      />

      {hideSubmit ? null : (
        <Button
          title={submitting ? 'Submitting…' : 'Submit rating'}
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting || !selectedPlayerId}
          fullWidth
          accessibilityRole="button"
          accessibilityLabel="Submit rating"
        />
      )}
    </View>
  );
}

export function PlayerReviewSubmitButton({
  submitting = false,
  disabled,
  onSubmit,
}: {
  submitting?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
}) {
  return (
    <Button
      title={submitting ? 'Submitting…' : 'Submit rating'}
      onPress={onSubmit}
      loading={submitting}
      disabled={disabled || submitting}
      fullWidth
      accessibilityRole="button"
      accessibilityLabel="Submit rating"
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  playerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  playerChip: {
    marginBottom: 0,
  },
  scoreBlock: {
    marginBottom: spacing.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scoreHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  commentField: {
    marginBottom: spacing.md,
  },
});

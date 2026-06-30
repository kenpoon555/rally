import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MessageReaction, ReactionEmoji } from '../../types/chat';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  reactions: MessageReaction[];
  currentUserId?: string;
  onToggle: (emoji: ReactionEmoji) => void;
};

export const ReactionRow: React.FC<Props> = ({ reactions, currentUserId, onToggle }) => {
  const groups: Record<string, { count: number; mine: boolean }> = {};
  for (const r of reactions) {
    if (!groups[r.emoji]) {
      groups[r.emoji] = { count: 0, mine: false };
    }
    groups[r.emoji].count++;
    if (r.user_id === currentUserId) {
      groups[r.emoji].mine = true;
    }
  }

  const entries = Object.entries(groups);
  if (!entries.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {entries.map(([emoji, { count, mine }]) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.pill, mine && styles.pillMine]}
          onPress={() => onToggle(emoji as ReactionEmoji)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillText, mine && styles.pillTextMine]}>
            {emoji} {count}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    marginTop: 4,
  },
  content: {
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pillMine: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillTextMine: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
});

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CHAT_QUICK_REPLIES } from '../../constants/chatQuickReplies';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export const ChatQuickReplies: React.FC<Props> = ({ onSelect, disabled = false }) => {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {CHAT_QUICK_REPLIES.map((reply) => (
          <TouchableOpacity
            key={reply.id}
            style={[styles.chip, disabled && styles.chipDisabled]}
            onPress={() => onSelect(reply.text)}
            disabled={disabled}
            activeOpacity={0.85}
          >
            <Text style={styles.chipText}>{reply.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});

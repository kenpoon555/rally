import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CHAT_QUICK_REPLIES } from '../../constants/chatQuickReplies';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export const ChatQuickReplies: React.FC<Props> = ({ onSelect, disabled = false }) => {
  return (
    <View style={styles.wrap}>
      {CHAT_QUICK_REPLIES.map((reply) => (
        <TouchableOpacity
          key={reply.id}
          style={[styles.bar, disabled && styles.barDisabled]}
          onPress={() => onSelect(reply.text)}
          disabled={disabled}
          activeOpacity={0.85}
        >
          <Text style={styles.barText}>{reply.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  bar: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  barDisabled: {
    opacity: 0.5,
  },
  barText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});

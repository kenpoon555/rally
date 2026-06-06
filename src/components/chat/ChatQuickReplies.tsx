import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CHAT_QUICK_REPLIES } from '../../constants/chatQuickReplies';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export const ChatQuickReplies: React.FC<Props> = ({ onSelect, disabled = false }) => {
  const { width } = useWindowDimensions();
  const stripWidth = width * 0.5;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={[styles.scroll, { width: stripWidth }]}
        contentContainerStyle={styles.row}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
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

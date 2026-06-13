import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../../types/chat';
import { GameRecapCard } from '../GameRecapCard';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  message: ChatMessage;
  isMine: boolean;
};

export const ChatMessageBubble: React.FC<Props> = ({ message, isMine }) => {
  if (message.message_type === 'recap' && message.recap_id) {
    return <GameRecapCard recapId={message.recap_id} />;
  }

  if (message.message_type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
          {message.content}
        </Text>
        <Text style={[styles.messageMeta, isMine && styles.messageMetaMine]}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  systemRow: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  systemText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  row: {
    marginBottom: spacing.sm,
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  rowOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
  },
  messageTextMine: {
    color: colors.onPrimary,
  },
  messageMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageMetaMine: {
    color: 'rgba(20, 25, 22, 0.55)',
  },
});

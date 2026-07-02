import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChatMessage, MessageReaction, ReactionEmoji } from '../../types/chat';
import { GameRecapCard } from '../GameRecapCard';
import { ReactionRow } from './ReactionRow';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  message: ChatMessage;
  isMine: boolean;
  reactions?: MessageReaction[];
  currentUserId?: string;
  onLongPressOther?: (message: ChatMessage) => void;
  onLongPressReact?: (message: ChatMessage) => void;
  onToggleReaction?: (messageId: string, emoji: ReactionEmoji) => void;
};

export const ChatMessageBubble: React.FC<Props> = ({
  message,
  isMine,
  reactions,
  currentUserId,
  onLongPressOther,
  onLongPressReact,
  onToggleReaction,
}) => {
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

  const handleLongPress = () => {
    if (onLongPressReact) {
      onLongPressReact(message);
    } else if (!isMine && onLongPressOther) {
      onLongPressOther(message);
    }
  };

  const hasLongPress = Boolean(onLongPressReact || (!isMine && onLongPressOther));

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
      <Pressable
        onLongPress={hasLongPress ? handleLongPress : undefined}
        delayLongPress={400}
      >
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
      </Pressable>
      {reactions && reactions.length > 0 && onToggleReaction ? (
        <ReactionRow
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={(emoji) => onToggleReaction(message.id, emoji)}
        />
      ) : null}
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
    color: colors.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageMetaMine: {
    color: 'rgba(20, 25, 22, 0.70)',
  },
});

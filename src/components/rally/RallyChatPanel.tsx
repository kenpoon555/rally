import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useCrewChatSessions } from '../../hooks/useCrewChatSessions';
import {
  getConversationMessages,
  markConversationRead,
  sendConversationMessage,
} from '../../services/chatService';
import { useChatChannel } from '../../hooks/useChatChannel';
import { getConversationPolls } from '../../services/availabilityPollService';
import { ChatMessage } from '../../types/chat';
import { AvailabilityPoll } from '../../types/availabilityPoll';
import { AvailabilityPollCard } from '../AvailabilityPollCard';
import { CreateAvailabilityPollSheet } from '../CreateAvailabilityPollSheet';
import { RallyPlayTabHint } from './RallyPlayTabHint';
import GameRoomAnnouncementBanner from '../GameRoomAnnouncementBanner';
import { ChatMessageBubble } from '../chat/ChatMessageBubble';
import { ChatQuickReplies } from '../chat/ChatQuickReplies';
import { Button, useComposerBottomPadding } from '../ui';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { ROUTES } from '../../constants/routes';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { countPlayTabActions } from '../../utils/playTabActions';

type Props = {
  groupId: string;
  groupName: string;
  conversationId: string | null;
  chatError: string | null;
  chatLoading: boolean;
  onRetryChat: () => void;
  onGoToPlay: () => void;
};

export const RallyChatPanel: React.FC<Props> = ({
  groupId,
  groupName,
  conversationId,
  chatError,
  chatLoading,
  onRetryChat,
  onGoToPlay,
}) => {
  const chatChannel = useChatChannel(conversationId ?? '');
  const navigation = useNavigation();
  const { user } = useAuth();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [crewPolls, setCrewPolls] = useState<AvailabilityPoll[]>([]);
  const [pollSheetOpen, setPollSheetOpen] = useState(false);
  const composerPaddingBottom = useComposerBottomPadding(spacing.md);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    setLoading(true);
    setErrorText(null);
    try {
      const rows = await getConversationMessages(conversationId, 100);
      setMessages(rows);
      if (user?.id) {
        await markConversationRead(conversationId, user.id);
      }
    } catch {
      setErrorText('Could not load messages. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  const {
    crewSessions,
    bannerIsHost,
    crewPollsHost,
    reloadCrewSessions,
  } = useCrewChatSessions({
    conversationId,
    groupId,
    userId: user?.id,
    onAfterAction: () => {
      void loadMessages();
    },
  });

  const reloadCrewPolls = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    try {
      setCrewPolls(await getConversationPolls(conversationId));
    } catch {
      setCrewPolls([]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (crewPolls.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [crewPolls.length]);

  useEffect(() => {
    if (conversationId) {
      void loadMessages();
      void reloadCrewPolls();
    } else {
      setMessages([]);
      setCrewPolls([]);
    }
  }, [conversationId, loadMessages, reloadCrewPolls]);

  useEffect(() => {
    if (!conversationId) return;

    chatChannel.register({
      table: 'messages',
      event: 'INSERT',
      filter: `conversation_id=eq.${conversationId}`,
      handler: (payload) => {
        const message = payload.new as ChatMessage;
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === message.id)) return prev;
          return [...prev, message];
        });
        if (message.message_type === 'system' || message.activity_id) {
          void reloadCrewSessions();
        }
        if (user?.id) {
          markConversationRead(conversationId, user.id).catch(() => null);
        }
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      },
    });

    chatChannel.subscribe(() => {
      void getConversationMessages(conversationId, 20).then((recent) => {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = recent.filter((m) => !existingIds.has(m.id));
          return newOnes.length > 0 ? [...prev, ...newOnes].sort((a, b) =>
            a.created_at < b.created_at ? -1 : 1) : prev;
        });
      }).catch(() => null);
    });
  }, [conversationId, chatChannel, reloadCrewSessions, user?.id]);

  const canSend = useMemo(
    () => !!user?.id && draft.trim().length > 0 && !sending && !!conversationId,
    [conversationId, draft, sending, user?.id]
  );

  const playActionCount = useMemo(
    () => countPlayTabActions(crewSessions.map((s) => s.card)),
    [crewSessions]
  );

  const sendContent = useCallback(
    async (content: string) => {
      if (!user?.id || !conversationId || sending) {
        return;
      }
      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }
      setSending(true);
      try {
        const sent = await sendConversationMessage(conversationId, user.id, trimmed);
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === sent.id)) {
            return prev;
          }
          return [...prev, sent];
        });
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      } catch (error: unknown) {
        Alert.alert(
          'Message not sent',
          error instanceof Error ? error.message : 'Could not send message.'
        );
        throw error;
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending, user?.id]
  );

  const handleSend = async () => {
    if (!canSend) {
      return;
    }
    const content = draft.trim();
    setDraft('');
    try {
      await sendContent(content);
    } catch {
      setDraft(content);
    }
  };

  const handleQuickReply = (text: string) => {
    void sendContent(text);
  };

  const handleScheduleFromPoll = (option: { starts_at: string; label: string }) => {
    navigation.navigate(ROUTES.ACTIVITY.CREATE, {
      prefillStartTime: option.starts_at,
      prefillTitle: option.label,
      prefillGroupId: groupId,
    });
  };

  if (chatLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Opening chat…</Text>
      </View>
    );
  }

  if (chatError || !conversationId) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.errorTitle}>Chat isn't ready yet</Text>
        <Text style={styles.errorBody}>
          {chatError ?? 'We could not connect to this Rally chat.'}
        </Text>
        <Button title="Try again" size="sm" onPress={onRetryChat} />
      </View>
    );
  }

  const listHeader = (
    <>
      <RallyPlayTabHint actionCount={playActionCount} onPress={onGoToPlay} />
      {crewPolls.map((poll) => (
        <AvailabilityPollCard
          key={poll.id}
          poll={poll}
          isHost={crewPollsHost}
          userId={user?.id}
          onUpdated={() => void reloadCrewPolls()}
          onScheduleFromOption={handleScheduleFromPoll}
        />
      ))}
      <GameRoomAnnouncementBanner
        conversationId={conversationId}
        isHost={bannerIsHost}
      />
      {errorText ? <Text style={styles.inlineError}>{errorText}</Text> : null}
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        onRefresh={() => {
          void loadMessages();
          void reloadCrewSessions();
        }}
        refreshing={loading}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>👋</Text>
              <Text style={styles.emptyTitle}>Say hi to your Rally</Text>
              <Text style={styles.emptyHint}>{PRODUCT_COPY.rallyChatEmpty}</Text>
            </View>
          ) : null
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        renderItem={({ item }) => (
          <ChatMessageBubble message={item} isMine={item.sender_id === user?.id} />
        )}
      />

      <ChatQuickReplies onSelect={handleQuickReply} disabled={sending} />
      <View style={[styles.composer, { paddingBottom: composerPaddingBottom }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          testID="rally-chat-create-poll"
          accessibilityLabel="Create availability poll"
          onPress={() => setPollSheetOpen(true)}
        >
          <Ionicons name="bar-chart-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${groupName}…`}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={() => void handleSend()}
          disabled={!canSend}
        >
          <Ionicons name="arrow-up" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <CreateAvailabilityPollSheet
        visible={pollSheetOpen}
        groupId={groupId}
        conversationId={conversationId}
        onClose={() => setPollSheetOpen(false)}
        onCreated={() => {
          void reloadCrewPolls();
          void loadMessages();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  inlineError: {
    ...typography.caption,
    color: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});

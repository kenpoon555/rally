import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getConversationMessages,
  getConversationPeerUserIds,
  getConversationById,
  markConversationRead,
  sendConversationMessage,
  subscribeToConversationMessages,
} from '../../services/chatService';
import { ChatMessage, Conversation } from '../../types/chat';
import { getRegularGroupById, joinCrewGame } from '../../services/regularGroupService';
import {
  finalizeGameCommitment,
  nudgeSessionRoster,
  setGameReady,
} from '../../services/activityService';
import { CrewChatSessionList } from '../../components/CrewChatSessionList';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { trackProductEvent } from '../../services/analyticsService';
import { getUserById } from '../../services/userService';
import { usersAreBlocked } from '../../services/safetyService';
import SafetyActionsSheet from '../../components/SafetyActionsSheet';
import {
  GameRoomFooter,
  GameRoomHeader,
  GameRoomProvider,
  useOptionalGameRoom,
} from '../../components/GameRoomActionBar';
import GameRoomAnnouncementBanner from '../../components/GameRoomAnnouncementBanner';
import { AvailabilityPollCard } from '../../components/AvailabilityPollCard';
import { CreateAvailabilityPollSheet } from '../../components/CreateAvailabilityPollSheet';
import { getConversationPolls } from '../../services/availabilityPollService';
import { listConversationSessionCards } from '../../services/sessionCardService';
import { ConversationSessionCard } from '../../types/sessionCard';
import { AvailabilityPoll } from '../../types/availabilityPoll';
import { ChatMessageBubble } from '../../components/chat/ChatMessageBubble';
import { ChatQuickReplies } from '../../components/chat/ChatQuickReplies';
import { ROUTES } from '../../constants/routes';
import { colors, radius, spacing } from '../../constants/theme';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string; fromGameRoom?: boolean };
  CreateActivity: undefined;
  Profile: undefined;
  ChatList: undefined;
  ChatThread: {
    conversationId: string;
    title?: string;
    activityId?: string;
    groupId?: string;
  };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ChatThread'>;

const GameRoomChatBody: React.FC<{
  isGameRoom: boolean;
  isCrewChat: boolean;
  conversationId: string;
  bannerIsHost: boolean;
  crewSessionsHeader: React.ReactNode | null;
  userId?: string;
  messages: ChatMessage[];
  loading: boolean;
  errorText: string | null;
  draft: string;
  sending: boolean;
  canSend: boolean;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  onRefresh: () => void;
  crewPolls?: AvailabilityPoll[];
  crewPollsHost?: boolean;
  onReloadPolls?: () => void;
  onOpenPollSheet?: () => void;
  onScheduleFromPoll?: (option: { starts_at: string; label: string }) => void;
  showQuickReplies?: boolean;
  onQuickReply?: (text: string) => void;
}> = ({
  isGameRoom,
  isCrewChat,
  conversationId,
  bannerIsHost,
  crewSessionsHeader,
  userId,
  messages,
  loading,
  errorText,
  draft,
  sending,
  canSend,
  onDraftChange,
  onSend,
  onRefresh,
  crewPolls,
  crewPollsHost = false,
  onReloadPolls,
  onOpenPollSheet,
  onScheduleFromPoll,
  showQuickReplies = false,
  onQuickReply,
}) => {
  const gameRoom = useOptionalGameRoom();
  const chatReadOnly = gameRoom?.isChatReadOnly ?? false;
  const canSendMessage = canSend && !chatReadOnly;

  return (
  <>
    {isCrewChat && crewSessionsHeader}
    {isCrewChat && crewPolls?.length
      ? crewPolls.map((poll) => (
          <AvailabilityPollCard
            key={poll.id}
            poll={poll}
            isHost={crewPollsHost}
            userId={userId}
            onUpdated={() => onReloadPolls?.()}
            onScheduleFromOption={onScheduleFromPoll}
          />
        ))
      : null}
    {isCrewChat || (isGameRoom && gameRoom?.activity) ? (
      <GameRoomAnnouncementBanner
        conversationId={isCrewChat ? conversationId : undefined}
        activityId={gameRoom?.activity?.id}
        isHost={bannerIsHost}
        costNote={gameRoom?.activity?.cost_note}
        showCostNote={false}
      />
    ) : null}
    {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    {isGameRoom ? <GameRoomFooter /> : null}
    <FlatList
      style={styles.list}
      contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.listContent}
      data={messages}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={loading}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        !loading && !errorText ? (
          <Text style={styles.emptyHint}>
            {isGameRoom
              ? isCrewChat
                ? PRODUCT_COPY.rallyChatEmpty
                : PRODUCT_COPY.gameRoomCoordinateHint
              : 'No messages yet. Say hi!'}
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <ChatMessageBubble message={item} isMine={item.sender_id === userId} />
      )}
    />

    {!chatReadOnly && showQuickReplies && onQuickReply ? (
      <ChatQuickReplies onSelect={onQuickReply} disabled={sending} />
    ) : null}

    {!chatReadOnly ? (
    <View style={styles.composer}>
      {isCrewChat && onOpenPollSheet ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenPollSheet}>
          <Ionicons name="bar-chart-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={onDraftChange}
        placeholder={isGameRoom ? 'Message the group…' : 'Type a message…'}
        placeholderTextColor={colors.textTertiary}
        multiline
        maxLength={2000}
      />
      <TouchableOpacity
        style={[styles.sendBtn, !canSendMessage && styles.sendBtnDisabled]}
        onPress={onSend}
        disabled={!canSendMessage}
      >
        <Ionicons name="arrow-up" size={18} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
    ) : null}
  </>
  );
};

const ChatThreadScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, title, activityId, groupId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [peerUsername, setPeerUsername] = useState<string | null>(null);
  const [blockedThread, setBlockedThread] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [crewSessions, setCrewSessions] = useState<ConversationSessionCard[]>([]);
  const [focusedActivityId, setFocusedActivityId] = useState<string | undefined>(activityId);
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);
  const [crewHostId, setCrewHostId] = useState<string | null>(null);
  const [crewPolls, setCrewPolls] = useState<AvailabilityPoll[]>([]);
  const [pollSheetOpen, setPollSheetOpen] = useState(false);

  const isCrewChat = conversation?.conversation_type === 'crew_group';
  const resolvedActivityId = isCrewChat ? focusedActivityId : focusedActivityId;
  const isGameRoom = Boolean(isCrewChat ? focusedActivityId : resolvedActivityId);

  const reloadCrewPolls = useCallback(async () => {
    if (!isCrewChat) {
      setCrewPolls([]);
      return;
    }
    try {
      const polls = await getConversationPolls(conversationId);
      setCrewPolls(polls);
    } catch {
      setCrewPolls([]);
    }
  }, [conversationId, isCrewChat]);

  const reloadCrewSessions = useCallback(async () => {
    const sessions = await listConversationSessionCards(conversationId);
    setCrewSessions(sessions);
    const now = Date.now();
    const upcoming = sessions
      .filter((s) => {
        const card = s.card;
        if (card.status !== 'active') {
          return false;
        }
        const endMs =
          new Date(card.start_time).getTime() + (card.duration ?? 60) * 60 * 1000;
        return endMs >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.card.start_time).getTime() - new Date(b.card.start_time).getTime()
      );
    const current =
      sessions.find((s) => s.is_current) ?? upcoming[0] ?? sessions[sessions.length - 1];
    if (!focusedActivityId && current?.activity_id) {
      setFocusedActivityId(current.activity_id);
    }
    return sessions;
  }, [conversationId, focusedActivityId]);

  useEffect(() => {
    const resolvedGroupId = groupId ?? conversation?.regular_group_id;
    if (!isCrewChat || !resolvedGroupId) {
      setCrewHostId(null);
      return;
    }
    getRegularGroupById(resolvedGroupId)
      .then((g) => setCrewHostId(g?.host_id ?? null))
      .catch(() => setCrewHostId(null));
  }, [groupId, conversation?.regular_group_id, isCrewChat]);

  useEffect(() => {
    getConversationById(conversationId)
      .then(async (convo) => {
        setConversation(convo);
        if (convo?.conversation_type === 'crew_group') {
          await reloadCrewSessions();
          await reloadCrewPolls();
          return;
        }
        if (activityId) {
          setFocusedActivityId(activityId);
        } else if (convo?.activity_id) {
          setFocusedActivityId(convo.activity_id);
        }
      })
      .catch(() => undefined);
  }, [activityId, conversationId, reloadCrewPolls, reloadCrewSessions]);

  useEffect(() => {
    if (isCrewChat) {
      void reloadCrewPolls();
    }
  }, [isCrewChat, reloadCrewPolls]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    trackProductEvent('conversation_opened', { conversation_id: conversationId }, user.id);
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setPeerUserId(null);
      setPeerUsername(null);
      setBlockedThread(false);
      return;
    }
    getConversationPeerUserIds(conversationId, user.id)
      .then(async (peerIds) => {
        if (peerIds.length !== 1) {
          setPeerUserId(null);
          setPeerUsername(null);
          return;
        }
        const peerId = peerIds[0];
        setPeerUserId(peerId);
        const profile = await getUserById(peerId);
        setPeerUsername(profile?.username || 'Player');
      })
      .catch(() => {
        setPeerUserId(null);
        setPeerUsername(null);
        setBlockedThread(false);
      });
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!user?.id || !peerUserId || isGameRoom) {
      setBlockedThread(false);
      return;
    }
    usersAreBlocked(user.id, peerUserId)
      .then((blocked) => setBlockedThread(blocked))
      .catch(() => setBlockedThread(false));
  }, [isGameRoom, peerUserId, user?.id]);

  useEffect(() => {
    navigation.setOptions({
      title: isGameRoom ? title || 'Game Room' : title || 'Chat',
      headerRight: () => (
        <View style={styles.headerActions}>
          {!isGameRoom && peerUserId ? (
            <TouchableOpacity onPress={() => setSafetyOpen(true)} style={styles.headerSafety}>
              <Text style={styles.headerSafetyText}>Safety</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    });
  }, [navigation, title, isGameRoom, peerUserId]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const rows = await getConversationMessages(conversationId, 100);
      setMessages(rows);
      if (user?.id) {
        await markConversationRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setErrorText('Unable to load messages. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const subscription = subscribeToConversationMessages(conversationId, (message) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      if (isCrewChat && (message.message_type === 'system' || message.activity_id)) {
        void reloadCrewSessions();
      }
      if (user?.id) {
        markConversationRead(conversationId, user.id).catch(() => null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, isCrewChat, reloadCrewSessions, user?.id]);

  const canSend = useMemo(
    () => !!user?.id && draft.trim().length > 0 && !sending && !blockedThread,
    [blockedThread, draft, sending, user?.id]
  );

  const sendContent = async (content: string) => {
    if (!user?.id || blockedThread || sending) {
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
    } catch (error: unknown) {
      Alert.alert(
        'Message not sent',
        error instanceof Error ? error.message : 'Could not send message.'
      );
      throw error;
    } finally {
      setSending(false);
    }
  };

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

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const focusedSession = crewSessions.find((s) => s.activity_id === focusedActivityId);
  const bannerIsHost =
    Boolean(user?.id && crewHostId && user.id === crewHostId) ||
    focusedSession?.activity?.user_id === user?.id;
  const resolvedGroupId = groupId ?? conversation?.regular_group_id ?? undefined;
  const crewPollsHost = Boolean(user?.id && crewHostId && user.id === crewHostId);

  const handleScheduleFromPoll = (option: { starts_at: string; label: string }) => {
    navigation.navigate(ROUTES.ACTIVITY.CREATE as never, {
      prefillStartTime: option.starts_at,
      prefillTitle: option.label,
      prefillGroupId: resolvedGroupId,
    } as never);
  };

  const chatBody = (
    <GameRoomChatBody
      isGameRoom={isGameRoom}
      isCrewChat={isCrewChat}
      conversationId={conversationId}
      bannerIsHost={bannerIsHost}
      crewSessionsHeader={
        isCrewChat ? (
          <CrewChatSessionList
            sessions={crewSessions}
            focusedActivityId={focusedActivityId}
            busyActivityId={busyActivityId}
            onFocusActivity={(id) => setFocusedActivityId(id)}
            onJoin={async (act) => {
              setBusyActivityId(act.id);
              try {
                const result = await joinCrewGame(act.id);
                if (result === 'waitlisted') {
                  Alert.alert(
                    'Waitlist',
                    'Game is full. You are on the waitlist if a spot opens.'
                  );
                }
                await reloadCrewSessions();
              } catch (error: unknown) {
                Alert.alert(
                  'Join failed',
                  error instanceof Error ? error.message : 'Could not join.'
                );
              } finally {
                setBusyActivityId(null);
              }
            }}
            onConfirmIn={async (act) => {
              setBusyActivityId(act.id);
              try {
                await setGameReady(act.id, true);
                await reloadCrewSessions();
              } catch (error: unknown) {
                Alert.alert(
                  "Couldn't save",
                  error instanceof Error ? error.message : 'Try again.'
                );
              } finally {
                setBusyActivityId(null);
              }
            }}
            onUndoImIn={(act) => {
              setBusyActivityId(act.id);
              void (async () => {
                try {
                  await setGameReady(act.id, false);
                  await reloadCrewSessions();
                } catch (error: unknown) {
                  Alert.alert(
                    "Couldn't save",
                    error instanceof Error ? error.message : 'Try again.'
                  );
                } finally {
                  setBusyActivityId(null);
                }
              })();
            }}
            onLockRoster={async (act) => {
              setBusyActivityId(act.id);
              try {
                await finalizeGameCommitment(act.id);
                await reloadCrewSessions();
              } catch (error: unknown) {
                Alert.alert(
                  'Lock failed',
                  error instanceof Error ? error.message : 'Try again.'
                );
              } finally {
                setBusyActivityId(null);
              }
            }}
            onNudge={async (act) => {
              setBusyActivityId(act.id);
              try {
                const count = await nudgeSessionRoster(act.id);
                await reloadCrewSessions();
                await loadMessages();
                Alert.alert(
                  PRODUCT_COPY.nudgeRosterSent,
                  `Reminder sent to ${count} player${count === 1 ? '' : 's'}.`
                );
              } catch (error: unknown) {
                Alert.alert(
                  'Could not nudge',
                  error instanceof Error ? error.message : 'Try again.'
                );
              } finally {
                setBusyActivityId(null);
              }
            }}
            onOpenDetails={(act) =>
              navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, {
                activityId: act.id,
                fromGameRoom: true,
              } as never)
            }
          />
        ) : null
      }
      userId={user?.id}
      messages={messages}
      loading={loading}
      errorText={errorText}
      draft={draft}
      sending={sending}
      canSend={canSend}
      onDraftChange={setDraft}
      onSend={() => void handleSend()}
      onRefresh={() => void loadMessages()}
      crewPolls={isCrewChat ? crewPolls : undefined}
      crewPollsHost={crewPollsHost}
      onReloadPolls={() => void reloadCrewPolls()}
      onOpenPollSheet={isCrewChat && resolvedGroupId ? () => setPollSheetOpen(true) : undefined}
      onScheduleFromPoll={isCrewChat ? handleScheduleFromPoll : undefined}
      showQuickReplies={isCrewChat || isGameRoom}
      onQuickReply={handleQuickReply}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {isGameRoom && resolvedActivityId ? (
        <GameRoomProvider
          activityId={resolvedActivityId}
          onOpenDetails={() =>
            navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, {
              activityId: resolvedActivityId,
              fromGameRoom: true,
            } as never)
          }
          onLeftGame={() => navigation.goBack()}
          onScheduledNextGame={async (newActivityId) => {
            if (isCrewChat) {
              await reloadCrewSessions();
              setFocusedActivityId(newActivityId);
              await loadMessages();
            } else {
              navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, {
                activityId: newActivityId,
              } as never);
            }
          }}
        >
          <GameRoomHeader />
          {chatBody}
        </GameRoomProvider>
      ) : (
        chatBody
      )}

      {!isGameRoom && blockedThread ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>
            Messaging is disabled because one of you has blocked the other.
          </Text>
        </View>
      ) : null}

      {isCrewChat && resolvedGroupId ? (
        <CreateAvailabilityPollSheet
          visible={pollSheetOpen}
          groupId={resolvedGroupId}
          conversationId={conversationId}
          onClose={() => setPollSheetOpen(false)}
          onCreated={() => {
            void reloadCrewPolls();
            void loadMessages();
          }}
        />
      ) : null}

      {user?.id && peerUserId && peerUsername ? (
        <SafetyActionsSheet
          visible={safetyOpen}
          onClose={() => setSafetyOpen(false)}
          currentUserId={user.id}
          targetUserId={peerUserId}
          targetUsername={peerUsername}
          contextType="chat"
          contextId={conversationId}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorText: {
    color: '#b42318',
    fontSize: 12,
    marginHorizontal: 12,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 4,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyHint: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: spacing.lg,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#222',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  messageMeta: {
    marginTop: 4,
    fontSize: 10,
    color: '#777',
  },
  myMessageMeta: {
    color: colors.primaryLight,
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
  headerSafety: {
    marginRight: 12,
    paddingVertical: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSafetyText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  blockedBanner: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#fff3e8',
    borderWidth: 1,
    borderColor: '#ffd2a8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  blockedBannerText: {
    color: '#8a4b08',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ChatThreadScreen;

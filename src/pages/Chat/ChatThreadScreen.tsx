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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getConversationMessages,
  getConversationPeerUserIds,
  getConversationById,
  getCrewConversationActivities,
  markConversationRead,
  sendConversationMessage,
  subscribeToConversationMessages,
} from '../../services/chatService';
import { ChatMessage, Conversation } from '../../types/chat';
import { getRegularGroupById, joinCrewGame } from '../../services/regularGroupService';
import {
  finalizeGameCommitment,
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
}) => {
  const gameRoom = useOptionalGameRoom();
  const chatReadOnly = gameRoom?.isChatReadOnly ?? false;
  const canSendMessage = canSend && !chatReadOnly;

  return (
  <>
    {isCrewChat && crewSessionsHeader}
    {isCrewChat || (isGameRoom && gameRoom?.activity) ? (
      <GameRoomAnnouncementBanner
        conversationId={isCrewChat ? conversationId : undefined}
        activityId={gameRoom?.activity?.id}
        isHost={bannerIsHost}
        costNote={gameRoom?.activity?.cost_note}
      />
    ) : null}
    {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
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
      renderItem={({ item }) => {
        const mine = item.sender_id === userId;
        return (
          <View style={[styles.messageBubble, mine ? styles.myBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, mine && styles.myMessageText]}>{item.content}</Text>
            <Text style={[styles.messageMeta, mine && styles.myMessageMeta]}>
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        );
      }}
    />

    {isGameRoom ? <GameRoomFooter /> : null}

    {!chatReadOnly ? (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={onDraftChange}
        placeholder={isGameRoom ? 'Message the group…' : 'Type a message…'}
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={canSendMessage ? onSend : undefined}
      />
      <TouchableOpacity
        style={[styles.sendButton, !canSendMessage && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSendMessage}
      >
        <Text style={styles.sendButtonText}>{sending ? '…' : 'Send'}</Text>
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
  const [crewSessions, setCrewSessions] = useState<Awaited<
    ReturnType<typeof getCrewConversationActivities>
  >>([]);
  const [focusedActivityId, setFocusedActivityId] = useState<string | undefined>(activityId);
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);
  const [crewHostId, setCrewHostId] = useState<string | null>(null);

  const isCrewChat = conversation?.conversation_type === 'crew_group';
  const resolvedActivityId = isCrewChat ? focusedActivityId : focusedActivityId;
  const isGameRoom = Boolean(isCrewChat ? focusedActivityId : resolvedActivityId);

  const reloadCrewSessions = useCallback(async () => {
    const sessions = await getCrewConversationActivities(conversationId);
    setCrewSessions(sessions);
    const now = Date.now();
    const upcoming = sessions
      .filter((s) => {
        const a = s.activity;
        if (!a || a.status !== 'active') {
          return false;
        }
        const endMs = new Date(a.start_time).getTime() + (a.duration ?? 60) * 60 * 1000;
        return endMs >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.activity!.start_time).getTime() - new Date(b.activity!.start_time).getTime()
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
          return;
        }
        if (activityId) {
          setFocusedActivityId(activityId);
        } else if (convo?.activity_id) {
          setFocusedActivityId(convo.activity_id);
        }
      })
      .catch(() => undefined);
  }, [activityId, conversationId, reloadCrewSessions]);

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
      if (user?.id) {
        markConversationRead(conversationId, user.id).catch(() => null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, user?.id]);

  const canSend = useMemo(
    () => !!user?.id && draft.trim().length > 0 && !sending && !blockedThread,
    [blockedThread, draft, sending, user?.id]
  );

  const handleSend = async () => {
    if (!user?.id || !canSend) {
      return;
    }
    const content = draft.trim();
    setDraft('');
    setSending(true);
    try {
      const sent = await sendConversationMessage(conversationId, user.id, content);
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === sent.id)) {
          return prev;
        }
        return [...prev, sent];
      });
    } catch (error: any) {
      console.error('Send message failed:', error);
      setDraft(content);
      Alert.alert('Message not sent', error?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
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
            userId={user?.id}
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
  inputRow: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: colors.background,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  markConversationRead,
  sendConversationMessage,
  subscribeToConversationMessages,
} from '../../services/chatService';
import { ChatMessage } from '../../types/chat';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
  Profile: undefined;
  ChatList: undefined;
  ChatThread: { conversationId: string; title?: string };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ChatThread'>;

const ChatThreadScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, title } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [navigation, title]);

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

  const canSend = useMemo(() => !!user?.id && draft.trim().length > 0 && !sending, [draft, sending, user?.id]);

  const handleSend = async () => {
    if (!user?.id || !canSend) {
      return;
    }
    const content = draft.trim();
    setDraft('');
    setSending(true);
    try {
      await sendConversationMessage(conversationId, user.id, content);
    } catch (error: any) {
      console.error('Send message failed:', error);
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {errorText && <Text style={styles.errorText}>{errorText}</Text>}
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(item) => item.id}
        onRefresh={loadMessages}
        refreshing={loading}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View style={[styles.messageBubble, mine ? styles.myBubble : styles.otherBubble]}>
              <Text style={[styles.messageText, mine && styles.myMessageText]}>{item.content}</Text>
              <Text style={[styles.messageMeta, mine && styles.myMessageMeta]}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#f7f7f7',
  },
  errorText: {
    color: '#b42318',
    fontSize: 12,
    marginHorizontal: 12,
    marginTop: 8,
  },
  list: {
    flex: 1,
    padding: 12,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e4',
  },
  messageText: {
    fontSize: 15,
    color: '#222',
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
    color: '#dfeaff',
  },
  inputRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ececec',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ChatThreadScreen;

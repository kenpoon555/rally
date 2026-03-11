import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { getMyConversations, getUnreadConversationCounts } from '../../services/chatService';
import { Conversation } from '../../types/chat';
import { ROUTES } from '../../constants/routes';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
  Profile: undefined;
  ChatList: undefined;
  ChatThread: { conversationId: string; title?: string };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ChatList'>;

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }
    setLoading(true);
    setErrorText(null);
    try {
      const [rows, unreadMap] = await Promise.all([
        getMyConversations(user.id),
        getUnreadConversationCounts(user.id),
      ]);
      setConversations(rows);
      setUnreadCounts(unreadMap);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setErrorText('Could not load chats right now. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openThread = (conversation: Conversation) => {
    const title =
      conversation.conversation_type === 'activity_group'
        ? conversation.title || 'Activity Chat'
        : 'Direct Chat';
    navigation.navigate(ROUTES.CHAT.THREAD as any, {
      conversationId: conversation.id,
      title,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorText && <Text style={styles.errorText}>{errorText}</Text>}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        onRefresh={loadConversations}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>
              Chat threads appear after opening a friend chat or finalizing an activity chat.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openThread(item)}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>
                {item.conversation_type === 'activity_group'
                  ? item.title || 'Activity Chat'
                  : 'Direct Chat'}
              </Text>
              {(unreadCounts[item.id] || 0) > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCounts[item.id]}</Text>
                </View>
              )}
            </View>
            <Text style={styles.rowMeta}>
              {item.conversation_type === 'activity_group' ? 'Group' : 'Friend'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#b42318',
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});

export default ChatListScreen;

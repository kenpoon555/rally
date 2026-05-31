import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../hooks/useAuth';
import {
  ChatInboxFilter,
  ChatInboxItem,
  filterChatInbox,
  useChatInboxWithRealtime,
} from '../../hooks/useChatInbox';
import {
  ensureActivityGroupConversation,
  getOrCreateDirectConversation,
} from '../../services/chatService';
import { ROUTES } from '../../constants/routes';

type TabParamList = {
  Home: undefined;
  Chats: undefined;
  Map: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Chats'>;

const FILTERS: { id: ChatInboxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'games', label: 'Games' },
  { id: 'friends', label: 'Friends' },
];

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { items, loading, errorText, load } = useChatInboxWithRealtime(user?.id);
  const [filter, setFilter] = useState<ChatInboxFilter>('all');
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visibleItems = useMemo(() => filterChatInbox(items, filter), [items, filter]);

  const openThread = (
    conversationId: string,
    title: string,
    activityId?: string
  ) => {
    navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
      conversationId,
      title,
      activityId,
    } as never);
  };

  const openGameChat = async (item: Extract<ChatInboxItem, { kind: 'game' }>) => {
    setOpeningKey(item.key);
    try {
      const conversationId =
        item.conversationId || (await ensureActivityGroupConversation(item.activity.id));
      openThread(conversationId, item.title, item.activity.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open game chat.';
      Alert.alert('Chat unavailable', message);
    } finally {
      setOpeningKey(null);
    }
  };

  const openFriendChat = async (item: Extract<ChatInboxItem, { kind: 'friend' }>) => {
    setOpeningKey(item.key);
    try {
      const conversationId =
        item.conversationId ||
        (await getOrCreateDirectConversation(item.userId, user?.id));
      openThread(conversationId, `@${item.username}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open chat.';
      Alert.alert('Chat unavailable', message);
    } finally {
      setOpeningKey(null);
    }
  };

  const handlePress = (item: ChatInboxItem) => {
    if (item.kind === 'game') {
      void openGameChat(item);
      return;
    }
    void openFriendChat(item);
  };

  const renderItem = ({ item }: { item: ChatInboxItem }) => {
    const busy = openingKey === item.key;
    return (
      <TouchableOpacity
        style={[styles.row, item.kind === 'game' && item.isPast && styles.rowPast]}
        onPress={() => handlePress(item)}
        disabled={busy}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.kind === 'game' ? '💬 ' : '👤 '}
              {item.title}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unread}</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          {item.kind === 'game' ? (
            <View style={styles.metaRow}>
              <View style={[styles.chip, item.role === 'host' ? styles.chipHost : styles.chipJoined]}>
                <Text style={styles.chipText}>{item.role === 'host' ? 'Hosting' : 'Joined'}</Text>
              </View>
              <View style={styles.chipMuted}>
                <Text style={styles.chipText}>{item.statusLabel}</Text>
              </View>
              {item.isPast ? (
                <View style={styles.chipMuted}>
                  <Text style={styles.chipText}>Played</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        {busy ? <ActivityIndicator size="small" color="#007AFF" style={styles.rowSpinner} /> : null}
      </TouchableOpacity>
    );
  };

  const emptyCopy =
    filter === 'games'
      ? 'No game chats yet. Host or join a game from Discover — your lobby appears here.'
      : filter === 'friends'
        ? 'No friends to message yet. Add friends from the Friends tab.'
        : 'Your game lobbies and friend chats show up here. Tap a row to open chat.';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSubtitle}>
          Game lobbies and friend messages — tap a game to open the Game Room.
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {loading && visibleItems.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          onRefresh={load}
          refreshing={loading}
          contentContainerStyle={visibleItems.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>{emptyCopy}</Text>
              {filter !== 'friends' ? (
                <View style={styles.emptyCtaRow}>
                  <TouchableOpacity
                    style={styles.emptyPrimaryCta}
                    onPress={() => navigation.navigate(ROUTES.HOME.MAIN as never)}
                  >
                    <Text style={styles.emptyPrimaryCtaText}>Find a game</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.emptySecondaryCta}
                    onPress={() =>
                      navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never)
                    }
                  >
                    <Text style={styles.emptySecondaryCtaText}>Create game</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptyPrimaryCta}
                  onPress={() => navigation.navigate(ROUTES.FRIENDS.LIST as never)}
                >
                  <Text style={styles.emptyPrimaryCtaText}>Go to Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowPast: {
    opacity: 0.85,
    backgroundColor: '#fafafa',
  },
  rowMain: {
    flex: 1,
    paddingRight: 8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    paddingRight: 8,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipHost: {
    backgroundColor: '#e8f1ff',
  },
  chipJoined: {
    backgroundColor: '#ddf8e8',
  },
  chipMuted: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  rowSpinner: {
    marginLeft: 8,
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
  errorText: {
    color: '#b42318',
    fontSize: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
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
    lineHeight: 22,
  },
  emptyCtaRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  emptyPrimaryCta: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptyPrimaryCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  emptySecondaryCta: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptySecondaryCtaText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ChatListScreen;

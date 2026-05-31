import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserFriends,
  getPendingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  searchUsers,
} from '../../services/friendsService';
import { Friend } from '../../types/friends';
import { User } from '../../types/user';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../../constants/routes';
import { getOrCreateDirectConversation } from '../../services/chatService';
import { Button, Chip, EmptyState, ScreenHeader, TextField } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';

type TabParamList = {
  Home: undefined;
  Chats: undefined;
  Map: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Friends'>;

const FriendsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const friendsList = await getUserFriends(user.id);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }, [user]);

  const loadPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const requests = await getPendingFriendRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }, [user]);

  const loadOutgoingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const requests = await getOutgoingFriendRequests(user.id);
      setOutgoingRequests(requests);
    } catch (error) {
      console.error('Error loading outgoing requests:', error);
    }
  }, [user]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([loadFriends(), loadPendingRequests(), loadOutgoingRequests()]);
  }, [user, loadFriends, loadPendingRequests, loadOutgoingRequests]);

  useEffect(() => {
    if (!user) return;
    setLoadingInitial(true);
    loadAll().finally(() => setLoadingInitial(false));
  }, [user, loadAll]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter((u) => u.id !== user?.id));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    if (!user) return;
    try {
      await sendFriendRequest(user.id, friendId);
      Alert.alert('Success', 'Friend request sent');
      await Promise.all([handleSearch(), loadOutgoingRequests()]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      await loadAll();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleRemove = async (friendshipId: string) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(friendshipId);
            await loadAll();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to remove friend');
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleDirectChat = async (friendUserId?: string, username?: string) => {
    if (!friendUserId) {
      return;
    }
    try {
      const conversationId = await getOrCreateDirectConversation(friendUserId, user?.id);
      navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
        conversationId,
        title: username ? `@${username}` : 'Direct message',
      } as never);
    } catch (error: any) {
      Alert.alert('Chat unavailable', error?.message || 'Could not open chat right now.');
    }
  };

  const pendingTotal = pendingRequests.length + outgoingRequests.length;
  const headerSubtitle = useMemo(() => {
    if (friends.length > 0) {
      return `${friends.length} friend${friends.length > 1 ? 's' : ''} connected`;
    }
    return 'Find and invite people with similar sports';
  }, [friends.length]);

  if (loadingInitial) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Friends" subtitle={headerSubtitle} />

      <View style={styles.tabs}>
        {([
          { id: 'friends' as const, label: 'Friends' },
          { id: 'requests' as const, label: `Requests (${pendingTotal})` },
          { id: 'search' as const, label: 'Add' },
        ]).map((tab) => (
          <Chip
            key={tab.id}
            label={tab.label}
            selected={activeTab === tab.id}
            tone="primary"
            compact
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabChip}
          />
        ))}
      </View>

      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.friend?.username || 'Unknown'}</Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item.id)}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => handleDirectChat(item.friend?.id, item.friend?.username)}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title="No friends yet"
              message="Add friends to send quick play invites."
              primaryAction={{ label: 'Add Friends', onPress: () => setActiveTab('search') }}
            />
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={[...pendingRequests, ...outgoingRequests]}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isIncoming = item.friend_id === user?.id;
            const label = isIncoming
              ? item.user?.username || 'Unknown'
              : item.friend?.username || 'Unknown';

            return (
              <View style={styles.requestItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.requestName}>{label}</Text>
                  <Text style={styles.requestMeta}>
                    {isIncoming ? 'Incoming request' : 'Outgoing request'}
                  </Text>
                </View>
                {isIncoming ? (
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.outgoingBadge}>
                    <Text style={styles.outgoingBadgeText}>Pending</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="📬"
              title="No requests right now"
              message="Invite someone to play and start building your list."
              primaryAction={{ label: 'Add Friends', onPress: () => setActiveTab('search') }}
            />
          }
        />
      )}

      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <View style={styles.searchFieldWrap}>
              <TextField
                placeholder="Username or phone"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                style={styles.searchInput}
              />
            </View>
            <Button
              title={loadingSearch ? 'Searching…' : 'Search'}
              size="sm"
              onPress={handleSearch}
              loading={loadingSearch}
            />
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.searchItem}>
                <Text style={styles.searchItemName}>{item.username}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleSendRequest(item.id)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="🔍"
                title={searchQuery ? 'No users found' : 'Search for players'}
                message={
                  searchQuery
                    ? 'Try a different username.'
                    : 'Find people by username to send a friend request.'
                }
              />
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabChip: {
    flexGrow: 0,
  },
  friendInfo: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  removeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.error,
    marginLeft: spacing.sm,
  },
  removeButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginLeft: spacing.sm,
  },
  chatButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  requestMeta: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
  acceptButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
  },
  acceptButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  outgoingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  outgoingBadgeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchFieldWrap: {
    flex: 1,
    marginBottom: -spacing.lg,
  },
  searchInput: {
    marginBottom: 0,
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchItemName: {
    fontSize: 16,
    flex: 1,
    color: colors.text,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FriendsScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
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
import { getOrCreateDirectConversation, getTotalUnreadCount } from '../../services/chatService';

type TabParamList = {
  Home: undefined;
  Chats: undefined;
  Map: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Friends'>;

type Presence = 'available' | 'playing' | 'offline';

const PRESENCE_SEQUENCE: Presence[] = ['available', 'playing', 'offline'];

const FriendsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [unreadChats, setUnreadChats] = useState(0);

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

  useEffect(() => {
    if (!user?.id) {
      setUnreadChats(0);
      return;
    }
    getTotalUnreadCount(user.id)
      .then(setUnreadChats)
      .catch(() => setUnreadChats(0));
  }, [user?.id, friends.length, pendingRequests.length, outgoingRequests.length]);

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

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleOpenChats = () => {
    navigation.navigate(ROUTES.CHAT.TAB as never);
  };

  const handleDirectChat = async (friendUserId?: string) => {
    if (!friendUserId) {
      return;
    }
    try {
      const conversationId = await getOrCreateDirectConversation(friendUserId, user?.id);
      navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
        conversationId,
        title: 'Direct Chat',
      } as never);
    } catch (error: any) {
      Alert.alert('Chat unavailable', error?.message || 'Could not open chat right now.');
    }
  };

  const getPresence = (index: number): Presence => {
    return PRESENCE_SEQUENCE[index % PRESENCE_SEQUENCE.length];
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Friends</Text>
          <View style={styles.headerActionRow}>
            <TouchableOpacity onPress={handleOpenChats} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.chatLink}>
                Chats{unreadChats > 0 ? ` (${unreadChats})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.signOutLink}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests ({pendingTotal})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Add
          </Text>
        </TouchableOpacity>
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
                <Text style={styles.friendStatus}>
                  {getPresence(friends.findIndex((f) => f.id === item.id))}
                </Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item.id)}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => handleDirectChat(item.friend?.id)}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyText}>Add friends to send quick play invites.</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setActiveTab('search')}
              >
                <Text style={styles.primaryButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No requests right now</Text>
              <Text style={styles.emptyText}>Invite someone to play and start building your list.</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setActiveTab('search')}
              >
                <Text style={styles.primaryButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or phone"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>
                {loadingSearch ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
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
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : 'Search for users to add'}
                </Text>
              </View>
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatLink: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  signOutLink: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  friendInfo: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendStatus: {
    marginTop: 4,
    color: '#666',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginLeft: 8,
  },
  chatButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#34C759',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  outgoingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbb',
  },
  outgoingBadgeText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchItemName: {
    fontSize: 16,
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    color: '#222',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FriendsScreen;

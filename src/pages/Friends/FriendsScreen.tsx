import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserFriends,
  getPendingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from '../../services/friendsService';
import { searchUsers } from '../../services/userService';
import { Friend } from '../../types/friends';
import { User } from '../../types/user';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROUTES } from '../../constants/routes';
import { getOrCreateDirectConversation } from '../../services/chatService';
import { Avatar, Button, Chip, EmptyState, ScreenHeader, TextField } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';
import PlayerProfileModal, { PlayerProfilePreview } from '../../components/PlayerProfileModal';
import { PlayerTrustLine } from '../../components/PlayerTrustLine';

export type FriendsStackParams = {
  Friends: { openSearch?: boolean } | undefined;
};

type Props = NativeStackScreenProps<FriendsStackParams, 'Friends'>;

const FriendsScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<RouteProp<FriendsStackParams, 'Friends'>>();
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
  const [profileContext, setProfileContext] = useState<{
    player: PlayerProfilePreview;
    friendshipId?: string;
  } | null>(null);

  const openProfile = useCallback((player: PlayerProfilePreview, friendshipId?: string) => {
    setProfileContext({ player, friendshipId });
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      if (route.params?.openSearch) {
        setActiveTab('search');
      }
    }, [route.params?.openSearch])
  );

  useEffect(() => {
    if (!user) return;
    setLoadingInitial(true);
    loadAll().finally(() => setLoadingInitial(false));
  }, [user, loadAll]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const results = await searchUsers(q);
      setSearchResults(results.filter((u) => u.id !== user?.id));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchQuery, user?.id]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (activeTab !== 'search') {
      return;
    }
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      void handleSearch();
    }, 400);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [activeTab, searchQuery, handleSearch]);

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
          renderItem={({ item }) => {
            const friend = item.friend;
            const username = friend?.username || 'Unknown';
            return (
              <View style={styles.friendItem}>
                <TouchableOpacity
                  style={styles.avatarTap}
                  activeOpacity={0.7}
                  accessibilityLabel={`View ${username}'s profile`}
                  onPress={() =>
                    friend &&
                    openProfile(
                      {
                        id: friend.id,
                        username: friend.username,
                        profile_photo_url: friend.profile_photo_url,
                      },
                      item.id
                    )
                  }
                >
                  {friend?.profile_photo_url ? (
                    <Image source={{ uri: friend.profile_photo_url }} style={styles.rowAvatarImage} />
                  ) : (
                    <Avatar name={username} size="md" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.friendRowBody}
                  activeOpacity={0.7}
                  accessibilityLabel={`Chat with ${username}`}
                  onPress={() => handleDirectChat(friend?.id, friend?.username)}
                >
                  <View style={styles.friendTextBlock}>
                    <Text style={styles.friendName}>{username}</Text>
                    {friend?.id ? <PlayerTrustLine userId={friend.id} style={styles.trustLine} /> : null}
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
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

            const profile = isIncoming ? item.user : item.friend;
            return (
              <View style={styles.requestItem}>
                <TouchableOpacity
                  style={styles.avatarTap}
                  activeOpacity={0.7}
                  onPress={() =>
                    profile &&
                    openProfile({
                      id: profile.id,
                      username: profile.username,
                      profile_photo_url: profile.profile_photo_url,
                    })
                  }
                >
                  {profile?.profile_photo_url ? (
                    <Image source={{ uri: profile.profile_photo_url }} style={styles.rowAvatarImage} />
                  ) : (
                    <Avatar name={label} size="md" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.friendRowBody}
                  activeOpacity={0.7}
                  onPress={() =>
                    profile &&
                    openProfile({
                      id: profile.id,
                      username: profile.username,
                      profile_photo_url: profile.profile_photo_url,
                    })
                  }
                >
                  <View style={styles.friendTextBlock}>
                    <Text style={styles.requestName}>{label}</Text>
                    <Text style={styles.requestMeta}>
                      {isIncoming ? 'Incoming request' : 'Outgoing request'}
                    </Text>
                  </View>
                </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.avatarTap}
                  activeOpacity={0.7}
                  onPress={() =>
                    openProfile({
                      id: item.id,
                      username: item.username,
                      profile_photo_url: item.profile_photo_url,
                    })
                  }
                >
                  {item.profile_photo_url ? (
                    <Image source={{ uri: item.profile_photo_url }} style={styles.rowAvatarImage} />
                  ) : (
                    <Avatar name={item.username} size="md" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.friendRowBody}
                  activeOpacity={0.7}
                  onPress={() =>
                    openProfile({
                      id: item.id,
                      username: item.username,
                      profile_photo_url: item.profile_photo_url,
                    })
                  }
                >
                  <View style={styles.friendTextBlock}>
                    <Text style={styles.searchItemName}>{item.username}</Text>
                    <PlayerTrustLine userId={item.id} style={styles.trustLine} />
                  </View>
                </TouchableOpacity>
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
                  searchQuery.trim().length < 2
                    ? 'Type at least 2 characters (username is case-insensitive).'
                    : searchQuery
                      ? 'No match — check spelling or ask them to open Profile and confirm their @username.'
                      : 'Find people by username to send a friend request.'
                }
              />
            }
          />
        </View>
      )}

      <PlayerProfileModal
        visible={!!profileContext}
        player={profileContext?.player ?? null}
        onClose={() => setProfileContext(null)}
        currentUserId={user?.id}
        contextType="profile"
        onMessage={
          profileContext
            ? () => handleDirectChat(profileContext.player.id, profileContext.player.username)
            : undefined
        }
        onRemoveFriend={
          profileContext?.friendshipId
            ? () => {
                const friendshipId = profileContext.friendshipId!;
                setProfileContext(null);
                handleRemove(friendshipId);
              }
            : undefined
        }
      />
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
  avatarTap: {
    marginRight: spacing.md,
  },
  friendRowBody: {
    flex: 1,
    minWidth: 0,
  },
  friendTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  rowAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  trustLine: {
    marginTop: 2,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
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
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchItemName: {
    fontSize: 16,
    fontWeight: '600',
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

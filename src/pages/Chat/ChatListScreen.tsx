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
import { useUserPlayMode } from '../../hooks/useUserPlayMode';
import { MyGameEntry } from '../../services/activityService';
import { Button, Chip, EmptyState, ScreenHeader } from '../../components/ui';
import { SportIcon } from '../../components/SportIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

function formatRelativeStart(startTime?: string | null): string {
  if (!startTime) {
    return 'Time TBD';
  }
  const diffMs = new Date(startTime).getTime() - Date.now();
  if (diffMs <= 0) {
    return 'Happening now';
  }
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) {
    return `In ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `In ${hours} hr${hours === 1 ? '' : 's'}`;
  }
  const days = Math.round(hours / 24);
  return `In ${days} day${days === 1 ? '' : 's'}`;
}

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

const ChatRowIcon: React.FC<{ item: ChatInboxItem }> = ({ item }) => {
  if (item.kind === 'game') {
    return <SportIcon sport={item.activity.sport_type} size="sm" style={styles.rowIcon} />;
  }
  if (item.kind === 'group') {
    return <SportIcon sport={item.group.sport_type} size="sm" style={styles.rowIcon} />;
  }
  return (
    <View style={styles.rowIconFriend}>
      <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.primaryDark} />
    </View>
  );
};

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { items, loading, errorText, load } = useChatInboxWithRealtime(user?.id);
  const { mode, regularGroups, nextGame, refetch: refetchPlayMode } = useUserPlayMode(user?.id);
  const [filter, setFilter] = useState<ChatInboxFilter>('all');
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
      refetchPlayMode();
    }, [load, refetchPlayMode])
  );

  const visibleItems = useMemo(() => filterChatInbox(items, filter), [items, filter]);

  const nextUpDuplicatesInbox = useMemo(() => {
    if (!nextGame?.activity.regular_group_id) {
      return false;
    }
    return visibleItems.some(
      (item) =>
        item.kind === 'group' &&
        item.group.id === nextGame.activity.regular_group_id &&
        item.nextActivity?.id === nextGame.activity.id
    );
  }, [nextGame, visibleItems]);

  const hasNextUpCard =
    mode === 'regular' &&
    filter !== 'friends' &&
    !nextUpDuplicatesInbox &&
    Boolean(nextGame || regularGroups[0]);

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

  const openGroupRow = async (item: Extract<ChatInboxItem, { kind: 'group' }>) => {
    if (item.nextActivity) {
      setOpeningKey(item.key);
      try {
        const conversationId =
          item.conversationId || (await ensureActivityGroupConversation(item.nextActivity.id));
        openThread(conversationId, item.title, item.nextActivity.id);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Could not open Game Room.';
        Alert.alert('Game Room unavailable', message);
      } finally {
        setOpeningKey(null);
      }
      return;
    }
    if (item.group.source_activity_id) {
      navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
        activityId: item.group.source_activity_id,
      } as never);
      return;
    }
    Alert.alert(item.group.name, 'No game scheduled yet. The host can schedule the next one.');
  };

  const handlePress = (item: ChatInboxItem) => {
    if (item.kind === 'group') {
      void openGroupRow(item);
      return;
    }
    if (item.kind === 'game') {
      void openGameChat(item);
      return;
    }
    void openFriendChat(item);
  };

  const openActivityRoom = async (entry: MyGameEntry) => {
    const key = `next-${entry.activity.id}`;
    setOpeningKey(key);
    try {
      const conversationId = await ensureActivityGroupConversation(entry.activity.id);
      openThread(
        conversationId,
        entry.activity.location?.name || `${entry.activity.sport_type} game`,
        entry.activity.id
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open Game Room.';
      Alert.alert('Game Room unavailable', message);
    } finally {
      setOpeningKey(null);
    }
  };

  const openGroupSourceDetails = (sourceActivityId: string) => {
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
      activityId: sourceActivityId,
    } as never);
  };

  const renderNextUp = () => {
    if (mode !== 'regular' || filter === 'friends') {
      return null;
    }

    if (nextGame) {
      const busy = openingKey === `next-${nextGame.activity.id}`;
      const court = nextGame.activity.location?.name || 'Court TBD';
      return (
        <View style={styles.nextUpCard}>
          <Text style={styles.nextUpLabel}>NEXT UP</Text>
          <Text style={styles.nextUpTitle}>
            {nextGame.activity.sport_type} · {court}
          </Text>
          <Text style={styles.nextUpTime}>{formatRelativeStart(nextGame.activity.start_time)}</Text>
          <Button
            title={busy ? 'Opening…' : 'Open Game Room'}
            variant="secondary"
            size="sm"
            onPress={() => void openActivityRoom(nextGame)}
            disabled={busy}
            loading={busy}
            style={styles.nextUpCtaButton}
          />
        </View>
      );
    }

    const group = regularGroups[0];
    if (!group) {
      return null;
    }
    const isGroupHost = group.host_id === user?.id;
    return (
      <View style={styles.nextUpCard}>
        <Text style={styles.nextUpLabel}>YOUR CREW</Text>
        <Text style={styles.nextUpTitle}>{group.name}</Text>
        <Text style={styles.nextUpTime}>No game on the calendar yet.</Text>
        {isGroupHost && group.source_activity_id ? (
          <Button
            title="Schedule next"
            variant="secondary"
            size="sm"
            onPress={() => openGroupSourceDetails(group.source_activity_id as string)}
            style={styles.nextUpCtaButton}
          />
        ) : (
          <Text style={styles.nextUpWaiting}>Waiting for the host to schedule the next game.</Text>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatInboxItem }) => {
    const busy = openingKey === item.key;
    return (
      <TouchableOpacity
        style={[
          styles.row,
          item.kind === 'group' && styles.rowGroup,
          item.kind === 'game' && item.isPast && styles.rowPast,
        ]}
        onPress={() => handlePress(item)}
        disabled={busy}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <View style={styles.rowTitleRow}>
              <ChatRowIcon item={item} />
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
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
        {busy ? <ActivityIndicator size="small" color={colors.primary} style={styles.rowSpinner} /> : null}
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
      <ScreenHeader
        title="Chats"
        subtitle="Tap your crew or game to open the Game Room."
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            selected={filter === f.id}
            tone="primary"
            onPress={() => setFilter(f.id)}
          />
        ))}
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {loading && visibleItems.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          onRefresh={load}
          refreshing={loading}
          ListHeaderComponent={renderNextUp()}
          contentContainerStyle={visibleItems.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            hasNextUpCard ? null : (
              <EmptyState
                icon="💬"
                title="Nothing here yet"
                message={emptyCopy}
                primaryAction={
                  filter !== 'friends'
                    ? {
                        label: 'Find a game',
                        onPress: () => navigation.navigate(ROUTES.HOME.MAIN as never),
                      }
                    : {
                        label: 'Go to Friends',
                        onPress: () => navigation.navigate(ROUTES.FRIENDS.LIST as never),
                      }
                }
                secondaryAction={
                  filter !== 'friends'
                    ? {
                        label: 'Create game',
                        onPress: () =>
                          navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never),
                      }
                    : undefined
                }
              />
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowPast: {
    opacity: 0.85,
    backgroundColor: colors.background,
  },
  rowGroup: {
    backgroundColor: colors.primaryLight,
  },
  rowMain: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowIconFriend: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    ...typography.bodyMedium,
    paddingRight: spacing.sm,
  },
  rowSubtitle: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chipHost: {
    backgroundColor: colors.infoSoft,
  },
  chipJoined: {
    backgroundColor: colors.successSoft,
  },
  chipMuted: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  rowSpinner: {
    marginLeft: spacing.sm,
  },
  unreadBadge: {
    minWidth: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  nextUpCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  nextUpLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
  },
  nextUpTitle: {
    marginTop: spacing.xs + 2,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
  },
  nextUpTime: {
    marginTop: 2,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  nextUpCtaButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  nextUpWaiting: {
    marginTop: spacing.md,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
});

export default ChatListScreen;

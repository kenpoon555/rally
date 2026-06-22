import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
  sumUnreadByFilter,
  useChatInboxWithRealtime,
} from '../../hooks/useChatInbox';
import {
  ensureActivityGroupConversation,
  getOrCreateDirectConversation,
} from '../../services/chatService';
import { ROUTES } from '../../constants/routes';
import { Avatar, Chip, EmptyState, ScreenHeader } from '../../components/ui';
import { SportIconForSurface } from '../../components/SportIconForSurface';
import { formatInboxMessageDate } from '../../utils/chatHelpers';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { CLASS_INBOX_ANNOUNCE } from '../../constants/coachParentFlags';
import { listClassAnnouncements } from '../../services/coachParentService';
import { ClassAnnouncementInboxItem } from '../../types/coachParent';

type TabParamList = {
  Home: undefined;
  Chats: undefined;
  Map: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Chats'>;

const FILTERS: { id: ChatInboxFilter; label: string }[] = [
  { id: 'friends', label: 'Friends' },
  { id: 'games', label: 'Games' },
  { id: 'rallies', label: 'Rallies' },
];

const ChatRowIcon: React.FC<{ item: ChatInboxItem }> = ({ item }) => {
  if (item.kind === 'game') {
    return (
      <SportIconForSurface
        sport={item.activity.sport_type}
        surface="inboxGameRow"
        style={styles.rowIcon}
      />
    );
  }
  if (item.kind === 'group') {
    return (
      <SportIconForSurface
        sport={item.group.sport_type}
        surface="inboxRallyRow"
        style={styles.rowIcon}
      />
    );
  }
  if (item.profilePhotoUrl) {
    return (
      <Image source={{ uri: item.profilePhotoUrl }} style={[styles.rowAvatarImage, styles.rowIcon]} />
    );
  }
  return <Avatar name={item.username} size="sm" tone="accent" style={styles.rowIcon} />;
};

type InboxFilter = ChatInboxFilter | 'announcements';

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { items, loading, errorText, load } = useChatInboxWithRealtime(user?.id);
  const [filter, setFilter] = useState<InboxFilter>('friends');
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<ClassAnnouncementInboxItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      load({ force: false });
      if (CLASS_INBOX_ANNOUNCE) {
        void listClassAnnouncements(user?.id).then(setAnnouncements);
      }
    }, [load, user?.id])
  );

  const filters = useMemo(() => {
    const base: { id: InboxFilter; label: string }[] = [...FILTERS];
    if (CLASS_INBOX_ANNOUNCE) {
      base.push({ id: 'announcements', label: 'Classes' });
    }
    return base;
  }, []);

  const visibleItems = useMemo(() => {
    if (filter === 'announcements') {
      return [];
    }
    return filterChatInbox(items, filter);
  }, [items, filter]);
  const unreadByFilter = useMemo(() => sumUnreadByFilter(items), [items]);

  const openRallyHub = (
    groupId: string,
    initialTab: 'chat' | 'play' | 'members' = 'chat'
  ) => {
    navigation.getParent()?.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
      groupId,
      initialTab,
    } as never);
  };

  const openThread = (
    conversationId: string,
    title: string,
    activityId?: string,
    groupId?: string
  ) => {
    navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
      conversationId,
      title,
      activityId,
      groupId,
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

  const openGroupRow = (item: Extract<ChatInboxItem, { kind: 'group' }>) => {
    setOpeningKey(item.key);
    openRallyHub(item.group.id, 'chat');
    setOpeningKey(null);
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

  const renderItem = ({ item }: { item: ChatInboxItem }) => {
    const busy = openingKey === item.key;
    const hasUnread = item.unread > 0;
    const dateLabel = formatInboxMessageDate(item.lastMessageAt);
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
        <ChatRowIcon item={item} />
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <Text
              style={[styles.rowTitle, hasUnread && styles.rowTitleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={styles.rowRight}>
              {dateLabel ? (
                <Text style={[styles.rowDate, hasUnread && styles.rowDateUnread]}>{dateLabel}</Text>
              ) : null}
              {hasUnread ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unread > 99 ? '99+' : item.unread}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text
            style={[styles.rowSubtitle, hasUnread && styles.rowSubtitleUnread]}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
          {item.kind === 'game' ? (
            <View style={styles.metaRow}>
              <View style={[styles.chip, item.role === 'host' ? styles.chipHost : styles.chipJoined]}>
                <Text style={styles.chipText}>
                  {item.role === 'host'
                    ? item.isPast
                      ? 'Hosted'
                      : 'Hosting'
                    : item.role === 'waitlisted'
                      ? 'Waitlist'
                      : 'Joined'}
                </Text>
              </View>
              <View style={styles.chipMuted}>
                <Text style={styles.chipText}>{item.statusLabel}</Text>
              </View>
            </View>
          ) : null}
        </View>
        {busy ? <ActivityIndicator size="small" color={colors.primary} style={styles.rowSpinner} /> : null}
      </TouchableOpacity>
    );
  };

  const emptyCopy =
    filter === 'announcements'
      ? 'No class announcements yet. Coaches message parents here — not children.'
      : filter === 'games'
      ? 'No active game rooms. Host or join from Play — archived chat moves to My Games after 2 days.'
      : filter === 'rallies'
        ? 'No Rally chats yet. Start a Rally from Today or save one from a game.'
        : 'No friend messages yet. Add friends from Profile.';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Inbox"
        subtitle="Game rooms, Rallies, and friends."
        showLogo
        accentColor={colors.info}
      />

      <View style={styles.filterRow}>
        <View style={styles.filterSegment}>
          {filters.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              badge={f.id === 'announcements' ? 0 : unreadByFilter[f.id as ChatInboxFilter]}
              selected={filter === f.id}
              tone="primary"
              compact
              style={styles.filterChip}
              testID={`inbox-filter-${f.id}`}
              accessibilityLabel={`${f.label} filter`}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </View>
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {filter === 'announcements' ? (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{item.class_title}</Text>
                <Text style={styles.rowSubtitle}>{item.preview}</Text>
                <Text style={styles.announceMeta}>To parents · not child DM</Text>
              </View>
            </View>
          )}
          contentContainerStyle={announcements.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <EmptyState icon="📣" title="Nothing here yet" message={emptyCopy} />
          }
        />
      ) : loading && visibleItems.length === 0 ? (
        <View style={styles.centered} accessibilityLabel="Loading inbox">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          onRefresh={() => void load({ force: true })}
          refreshing={loading}
          contentContainerStyle={visibleItems.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
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
                        onPress: () =>
                          navigation.getParent()?.navigate(ROUTES.FRIENDS.LIST as never),
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  filterSegment: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 4,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
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
    backgroundColor: colors.surface,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  rowDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  rowDateUnread: {
    color: colors.primary,
    fontWeight: '600',
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rowTitle: {
    flex: 1,
    ...typography.bodyMedium,
    minWidth: 0,
  },
  rowTitleUnread: {
    fontWeight: '700',
    color: colors.text,
  },
  announceMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  rowSubtitle: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowSubtitleUnread: {
    color: colors.text,
    fontWeight: '500',
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
});

export default ChatListScreen;

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
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
  prefetchConversationMessages,
} from '../../services/chatService';
import { ROUTES } from '../../constants/routes';
import { Avatar, Chip, EmptyState, ScreenHeader } from '../../components/ui';
import { SportIconForSurface } from '../../components/SportIconForSurface';
import { formatInboxMessageDate } from '../../utils/chatHelpers';
import {
  countUnreadClassAnnouncements,
  markClassAnnouncementsSeen,
} from '../../services/classAnnouncementReadStore';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { CLASS_INBOX_ANNOUNCE } from '../../constants/coachParentFlags';
import { listClassAnnouncements } from '../../services/coachParentService';
import { ClassAnnouncementInboxItem } from '../../types/coachParent';
import { useCoachParent } from '../../hooks/useCoachParent';
import { shouldShowInboxClassesFilter } from '../../config/surfaceVisibility';
import type { MainTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Chats'>;

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
  const { isCoach, hasClassContext } = useCoachParent();
  const { items, loading, errorText, load, clearUnread } = useChatInboxWithRealtime(user?.id);
  const [filter, setFilter] = useState<InboxFilter>('friends');
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<ClassAnnouncementInboxItem[]>([]);
  const [announcementsUnread, setAnnouncementsUnread] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ClassAnnouncementInboxItem | null>(
    null
  );

  const refreshAnnouncementsUnread = useCallback(async (rows: ClassAnnouncementInboxItem[]) => {
    setAnnouncementsUnread(await countUnreadClassAnnouncements(rows.map((row) => row.id)));
  }, []);

  const showInboxClasses = useMemo(
    () =>
      shouldShowInboxClassesFilter({
        classInboxEnabled: CLASS_INBOX_ANNOUNCE,
        userId: user?.id,
        isCoach,
        hasClassContext,
      }),
    [user?.id, isCoach, hasClassContext]
  );

  useFocusEffect(
    useCallback(() => {
      load({ force: false });
      if (showInboxClasses) {
        void listClassAnnouncements(user?.id, { isCoach, hasClassContext }).then((rows) => {
          setAnnouncements(rows);
          void refreshAnnouncementsUnread(rows);
        });
      } else {
        setAnnouncements([]);
        setAnnouncementsUnread(0);
      }
    }, [load, user?.id, showInboxClasses, isCoach, hasClassContext, refreshAnnouncementsUnread])
  );

  const filters = useMemo(() => {
    const base: { id: InboxFilter; label: string }[] = [...FILTERS];
    if (showInboxClasses) {
      base.push({ id: 'announcements', label: 'Classes' });
    }
    return base;
  }, [showInboxClasses]);

  React.useEffect(() => {
    if (!showInboxClasses && filter === 'announcements') {
      setFilter('friends');
    }
  }, [showInboxClasses, filter]);

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
    navigation.getParent()?.navigate(ROUTES.REGULAR_GROUP.CREW, {
      groupId,
      initialTab,
    });
  };

  React.useEffect(() => {
    if (filter === 'announcements' && announcements.length > 0) {
      void markClassAnnouncementsSeen(announcements.map((row) => row.id)).then(() => {
        setAnnouncementsUnread(0);
      });
    }
  }, [filter, announcements]);

  const openThread = (
    conversationId: string,
    title: string,
    activityId?: string,
    groupId?: string
  ) => {
    clearUnread(conversationId);
    void prefetchConversationMessages(conversationId, 100);
    navigation.getParent()?.navigate(ROUTES.CHAT.THREAD, {
      conversationId,
      title,
      activityId,
      groupId,
    });
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

  const emptyTitle =
    filter === 'announcements'
      ? 'No class chats yet'
      : filter === 'games'
      ? 'No game chats yet'
      : filter === 'rallies'
        ? 'No Rally chats yet'
        : 'No friend messages yet';

  const emptyIconName =
    filter === 'announcements'
      ? ('bullhorn-outline' as const)
      : filter === 'games'
      ? ('calendar-check-outline' as const)
      : filter === 'rallies'
        ? ('account-group-outline' as const)
        : ('account-multiple-outline' as const);

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
              badge={
                f.id === 'announcements'
                  ? announcementsUnread
                  : unreadByFilter[f.id as ChatInboxFilter]
              }
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
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setSelectedAnnouncement(item);
                void markClassAnnouncementsSeen([item.id]).then(() => {
                  setAnnouncementsUnread((count) => Math.max(0, count - 1));
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Class announcement, ${item.class_title}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{item.class_title}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={2}>
                  {item.preview}
                </Text>
                <Text style={styles.announceMeta}>
                  To parents · not child DM
                  {item.sent_at ? ` · ${formatInboxMessageDate(item.sent_at)}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={announcements.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <EmptyState iconName={emptyIconName} title={emptyTitle} message={emptyCopy} />
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
                iconName={emptyIconName}
                title={emptyTitle}
                message={emptyCopy}
                primaryAction={
                  filter !== 'friends'
                    ? {
                        label: 'Find a game',
                        onPress: () => navigation.navigate(ROUTES.HOME.MAIN),
                      }
                    : {
                        label: 'Go to Friends',
                        onPress: () =>
                          navigation.getParent()?.navigate(ROUTES.FRIENDS.LIST),
                      }
                }
                secondaryAction={
                  filter !== 'friends'
                    ? {
                        label: 'Create game',
                        onPress: () =>
                          navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE),
                      }
                    : undefined
                }
              />
          }
        />
      )}

      <Modal
        visible={selectedAnnouncement != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedAnnouncement(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            {selectedAnnouncement ? (
              <>
                <Text style={styles.modalTitle}>{selectedAnnouncement.class_title}</Text>
                <Text style={styles.modalMeta}>
                  To parents · not child DM
                  {selectedAnnouncement.sent_at
                    ? ` · ${new Date(selectedAnnouncement.sent_at).toLocaleString()}`
                    : ''}
                </Text>
                <Text style={styles.modalBody}>{selectedAnnouncement.preview}</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSelectedAnnouncement(null)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
    color: colors.onAccent,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  modalBody: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalClose: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  modalCloseText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ChatListScreen;

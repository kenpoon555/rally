import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useUserPlayMode } from '../../hooks/useUserPlayMode';
import { useHomeDashboard } from '../../hooks/useHomeDashboard';
import {
  ensureActivityGroupConversation,
  ensureCrewConversation,
} from '../../services/chatService';
import { ProductGlossarySheet } from '../../components/ProductGlossarySheet';
import { MyGameEntry } from '../../services/activityService';
import { ROUTES } from '../../constants/routes';
import { EmptyState, ScreenHeader } from '../../components/ui';
import { NextUpCard } from '../../components/home/NextUpCard';
import { MyGameListCard } from '../../components/game/MyGameListCard';
import { TodaySectionHeader } from '../../components/home/TodaySectionHeader';
import { RallyCarouselCard } from '../../components/home/RallyCarouselCard';
import { RallyInviteCard } from '../../components/rally/RallyInviteCard';
import { colors, spacing, typography } from '../../constants/theme';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { needsConfirmPlaying } from '../../utils/activityHelpers';
import { getTodaySubtitle } from '../../utils/todaySubtitle';
import {
  acceptRegularGroupFriendInvite,
  declineRegularGroupFriendInvite,
  getRegularGroupMembers,
  listMyPendingRegularGroupInvites,
} from '../../services/regularGroupService';
import { RallyFriendInvite } from '../../types/rallyInvite';

type TabParamList = {
  DynamicHome: undefined;
  Chats: undefined;
  Home: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'DynamicHome'>;

const MAX_ROOM_ROWS = 5;

const DynamicHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { location, fetchLocation } = useLocation(false);
  const { mode, loading, activeGames, regularGroups, nextGame, refetch } = useUserPlayMode(
    user?.id
  );
  const [openingGameId, setOpeningGameId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [rallyInvites, setRallyInvites] = useState<RallyFriendInvite[]>([]);
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [rallyMemberCounts, setRallyMemberCounts] = useState<Record<string, number>>({});
  const dashboard = useHomeDashboard(activeGames, user?.id);

  const loadRallyInvites = useCallback(async () => {
    try {
      setRallyInvites(await listMyPendingRegularGroupInvites());
    } catch {
      setRallyInvites([]);
    }
  }, []);

  const loadRallyMemberCounts = useCallback(async () => {
    const groups = regularGroups.slice(0, 8);
    if (groups.length === 0) {
      setRallyMemberCounts({});
      return;
    }

    const entries = await Promise.all(
      groups.map(async (group) => {
        try {
          const members = await getRegularGroupMembers(group.id);
          return [group.id, members.length] as const;
        } catch {
          return [group.id, 0] as const;
        }
      })
    );

    setRallyMemberCounts(Object.fromEntries(entries));
  }, [regularGroups]);

  useFocusEffect(
    useCallback(() => {
      refetch(false);
      void loadRallyInvites();
    }, [refetch, loadRallyInvites])
  );

  useEffect(() => {
    if (user?.id) {
      void fetchLocation();
    }
  }, [user?.id, fetchLocation]);

  useEffect(() => {
    void loadRallyMemberCounts();
  }, [loadRallyMemberCounts]);

  const handleAcceptRallyInvite = async (invite: RallyFriendInvite) => {
    setInviteBusyId(invite.id);
    try {
      const result = await acceptRegularGroupFriendInvite(invite.id);
      setRallyInvites((prev) => prev.filter((row) => row.id !== invite.id));
      refetch();
      openCrew(result.group_id);
    } catch (error: unknown) {
      Alert.alert(
        'Could not join',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setInviteBusyId(null);
    }
  };

  const handleDeclineRallyInvite = async (invite: RallyFriendInvite) => {
    setInviteBusyId(invite.id);
    try {
      await declineRegularGroupFriendInvite(invite.id);
      setRallyInvites((prev) => prev.filter((row) => row.id !== invite.id));
    } catch (error: unknown) {
      Alert.alert(
        'Could not decline',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setInviteBusyId(null);
    }
  };

  const openGameRoom = async (entry: MyGameEntry) => {
    setOpeningGameId(entry.activity.id);
    try {
      const conversationId = entry.activity.regular_group_id
        ? await ensureCrewConversation(entry.activity.regular_group_id)
        : await ensureActivityGroupConversation(entry.activity.id);
      const title = entry.activity.regular_group_id
        ? PRODUCT_COPY.rallyChat
        : entry.activity.location?.name || `${entry.activity.sport_type} game`;
      navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
        conversationId,
        title,
        activityId: entry.activity.id,
        groupId: entry.activity.regular_group_id ?? undefined,
      } as never);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open Game Room.';
      Alert.alert('Game Room unavailable', message);
    } finally {
      setOpeningGameId(null);
    }
  };

  const openActivityDetails = (activityId: string) => {
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
      activityId,
    } as never);
  };

  const openDiscover = () => navigation.navigate(ROUTES.HOME.MAIN as never);
  const openCreateGame = () =>
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never);
  const openChats = () => navigation.navigate(ROUTES.CHAT.TAB as never);
  const openProfile = () => navigation.navigate(ROUTES.PROFILE.MAIN as never);
  const openCrew = (groupId: string) => {
    navigation.getParent()?.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
      groupId,
    } as never);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch(true);
    await Promise.all([loadRallyInvites(), loadRallyMemberCounts()]);
    setRefreshing(false);
  };

  const otherActiveGames = useMemo(() => {
    const playable = activeGames.filter((entry) => entry.role !== 'waitlisted');
    if (!nextGame) {
      return playable.slice(0, MAX_ROOM_ROWS);
    }
    return playable
      .filter((entry) => entry.activity.id !== nextGame.activity.id)
      .slice(0, MAX_ROOM_ROWS);
  }, [activeGames, nextGame]);

  const needsConfirm = Boolean(
    nextGame && needsConfirmPlaying(nextGame.activity, user?.id)
  );

  const showExplorerEmpty =
    mode === 'explorer' && !loading && regularGroups.length === 0 && activeGames.length === 0;

  const rosterLockHint = (item: NonNullable<typeof dashboard.rosterToLock>) => {
    if (item.readiness === 'ready') {
      return PRODUCT_COPY.hostLockReady;
    }
    if (item.readiness === 'needs_players') {
      return PRODUCT_COPY.hostLockNeedsPlayers(
        item.rosterCount,
        1 + Math.max(item.entry.activity.missing_players ?? 1, 0)
      );
    }
    return PRODUCT_COPY.hostLockWaitingImIn(item.readyCount, item.rosterCount);
  };

  const lockOnNextUp =
    dashboard.rosterToLock &&
    nextGame &&
    dashboard.rosterToLock.entry.activity.id === nextGame.activity.id;

  const todaySubtitle = useMemo(
    () =>
      getTodaySubtitle({
        needsCommitmentGames: dashboard.needsCommitmentGames,
        rosterToLock: dashboard.rosterToLock,
        nextGame: nextGame ?? null,
        activeGameCount: activeGames.filter((entry) => entry.role !== 'waitlisted').length,
        rallyInviteCount: rallyInvites.length,
        isExplorerEmpty: showExplorerEmpty,
      }),
    [
      dashboard.needsCommitmentGames,
      dashboard.rosterToLock,
      nextGame,
      activeGames,
      rallyInvites.length,
      showExplorerEmpty,
    ]
  );

  const headerRight = (
    <TouchableOpacity onPress={openChats} hitSlop={8} accessibilityLabel="Notifications">
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {rallyInvites.length > 0 ? <View style={styles.notificationDot} /> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Today" subtitle={todaySubtitle} right={headerRight} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={showExplorerEmpty ? styles.scrollEmpty : styles.scrollContent}
      >
        {loading && activeGames.length === 0 && regularGroups.length === 0 ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {rallyInvites.map((invite) => (
            <RallyInviteCard
              key={invite.id}
              invite={invite}
              busy={inviteBusyId === invite.id}
              onAccept={() => void handleAcceptRallyInvite(invite)}
              onDecline={() => void handleDeclineRallyInvite(invite)}
            />
          ))}

          {needsConfirm ? (
            <View style={styles.rsvpNeededCard}>
              <Text style={styles.rsvpNeededTitle}>{PRODUCT_COPY.confirmPlayingTitle}</Text>
              <Text style={styles.rsvpNeededBody}>{PRODUCT_COPY.confirmPlayingBody}</Text>
            </View>
          ) : null}

          <NextUpCard
            nextGame={nextGame}
            fallbackGroup={nextGame ? null : regularGroups[0] ?? null}
            currentUserId={user?.id}
            userLocation={location}
            onOpenGameRoom={(entry) => void openGameRoom(entry)}
            onScheduleNext={openActivityDetails}
            openingGameId={openingGameId}
            footerHint={needsConfirm ? PRODUCT_COPY.needsImInHint : undefined}
            hostLock={
              lockOnNextUp && dashboard.rosterToLock
                ? {
                    readiness: dashboard.rosterToLock.readiness,
                    hint: rosterLockHint(dashboard.rosterToLock),
                  }
                : undefined
            }
          />

          {otherActiveGames.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Also on your calendar</Text>
              {otherActiveGames.map((entry) => (
                <MyGameListCard
                  key={entry.activity.id}
                  entry={entry}
                  userLocation={location}
                  busy={openingGameId === entry.activity.id}
                  onPress={() => void openGameRoom(entry)}
                />
              ))}
            </View>
          ) : null}

          {dashboard.waitlistedGames.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{PRODUCT_COPY.waitlistSectionTitle}</Text>
              {dashboard.waitlistedGames.map((entry) => (
                <TouchableOpacity
                  key={entry.activity.id}
                  style={styles.waitlistRow}
                  onPress={() => void openGameRoom(entry)}
                >
                  <Text style={styles.waitlistRowTitle} numberOfLines={1}>
                    {entry.activity.sport_type} · {entry.activity.location?.name ?? 'Game'}
                  </Text>
                  <Text style={styles.waitlistRowMeta}>{PRODUCT_COPY.onWaitlist}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {regularGroups.length > 0 ? (
            <View style={styles.ralliesSection}>
              <TodaySectionHeader
                title={PRODUCT_COPY.rallies.toUpperCase()}
                actionLabel="See all >"
                onAction={openProfile}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rallyCarousel}
              >
                {regularGroups.map((group, index) => (
                  <RallyCarouselCard
                    key={group.id}
                    group={group}
                    memberCount={rallyMemberCounts[group.id]}
                    accentIndex={index}
                    onPress={() => openCrew(group.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TouchableOpacity onPress={() => setGlossaryOpen(true)} style={styles.footerLink}>
            <Text style={styles.glossaryLink}>How Join, I'm in, and Lock roster work →</Text>
          </TouchableOpacity>

          {showExplorerEmpty ? (
            <EmptyState
              icon="🏸"
              title="No games yet"
              message="Discover open games in LA or host one and share the invite link with your crew."
              primaryAction={{ label: 'Browse Play', onPress: openDiscover }}
              secondaryAction={{ label: 'Host a Game', onPress: openCreateGame }}
            />
          ) : null}
      </ScrollView>
      <ProductGlossarySheet visible={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineLoader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  scrollEmpty: {
    flexGrow: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  rsvpNeededCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  rsvpNeededTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rsvpNeededBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  waitlistRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  waitlistRowTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  waitlistRowMeta: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  ralliesSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  rallyCarousel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  footerLink: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  glossaryLink: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default DynamicHomeScreen;

import React, { useCallback, useMemo, useState } from 'react';
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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useUserPlayMode } from '../../hooks/useUserPlayMode';
import {
  ensureActivityGroupConversation,
  ensureCrewConversation,
} from '../../services/chatService';
import { useHomeDashboard } from '../../hooks/useHomeDashboard';
import { ProductGlossarySheet } from '../../components/ProductGlossarySheet';
import { MyGameEntry } from '../../services/activityService';
import { ROUTES } from '../../constants/routes';
import { Button, EmptyState, ScreenHeader } from '../../components/ui';
import { NextUpCard } from '../../components/home/NextUpCard';
import { ActiveGameRoomRow } from '../../components/home/ActiveGameRoomRow';
import { TodayQuickActions } from '../../components/home/TodayQuickActions';
import { RallyRowCard } from '../../components/home/RallyRowCard';
import { RallyInviteCard } from '../../components/rally/RallyInviteCard';
import { PlayTeaserCard } from '../../components/home/PlayTeaserCard';
import { colors, spacing, typography } from '../../constants/theme';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { needsConfirmPlaying } from '../../utils/activityHelpers';
import {
  acceptRegularGroupFriendInvite,
  declineRegularGroupFriendInvite,
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
  const dashboard = useHomeDashboard(activeGames, user?.id, location);

  const loadRallyInvites = useCallback(async () => {
    try {
      setRallyInvites(await listMyPendingRegularGroupInvites());
    } catch {
      setRallyInvites([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
      void fetchLocation();
      void loadRallyInvites();
    }, [refetch, fetchLocation, loadRallyInvites])
  );

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

  const openCreateGame = () =>
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never);
  const openDiscover = () => navigation.navigate(ROUTES.HOME.MAIN as never);
  const openChats = () => navigation.navigate(ROUTES.CHAT.TAB as never);
  const openCrew = (groupId: string) => {
    navigation.getParent()?.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
      groupId,
    } as never);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    await loadRallyInvites();
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
    nextGame &&
      needsConfirmPlaying(nextGame.activity, user?.id)
  );

  const subtitle =
    mode === 'regular'
      ? PRODUCT_COPY.homeRegularSubtitle
      : PRODUCT_COPY.homeExplorerSubtitle;

  const showExplorerEmpty = mode === 'explorer' && !loading && regularGroups.length === 0;

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

  const otherRosterToLock =
    dashboard.rosterToLock && !lockOnNextUp ? dashboard.rosterToLock : null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Today" subtitle={subtitle} showLogo accentColor={colors.primary} />

      {loading && activeGames.length === 0 && regularGroups.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={showExplorerEmpty ? styles.scrollEmpty : undefined}
        >
          {rallyInvites.map((invite) => (
            <RallyInviteCard
              key={invite.id}
              invite={invite}
              busy={inviteBusyId === invite.id}
              onAccept={() => void handleAcceptRallyInvite(invite)}
              onDecline={() => void handleDeclineRallyInvite(invite)}
            />
          ))}

          {otherRosterToLock ? (
            <TouchableOpacity
              style={styles.rosterLockRow}
              onPress={() => openGameRoom(otherRosterToLock.entry)}
            >
              <Text style={styles.rosterLockRowTitle} numberOfLines={1}>
                {otherRosterToLock.readiness === 'ready'
                  ? PRODUCT_COPY.hostLockReady
                  : 'Roster to lock'}
                {' · '}
                {otherRosterToLock.entry.activity.sport_type}
              </Text>
              <Text style={styles.rosterLockRowHint} numberOfLines={1}>
                {rosterLockHint(otherRosterToLock)}
              </Text>
            </TouchableOpacity>
          ) : dashboard.hostSummary.hosting > 0 && !lockOnNextUp ? (
            <View style={styles.hostSummaryCard}>
              <Text style={styles.hostSummaryTitle}>Host summary</Text>
              <Text style={styles.hostSummaryMeta}>
                {dashboard.hostSummary.hosting} hosting
                {dashboard.hostSummary.needsLock > 0
                  ? ` · ${dashboard.hostSummary.needsLock} awaiting lock`
                  : ''}
              </Text>
            </View>
          ) : null}

          {dashboard.waitlistedGames.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{PRODUCT_COPY.waitlistSectionTitle}</Text>
              <Text style={styles.waitlistSectionHint}>{PRODUCT_COPY.onWaitlistHint}</Text>
              {dashboard.waitlistedGames.map((entry) => (
                <TouchableOpacity
                  key={entry.activity.id}
                  style={styles.waitlistRow}
                  onPress={() => void openGameRoom(entry)}
                >
                  <Text style={styles.waitlistRowTitle}>
                    {entry.activity.sport_type} ·{' '}
                    {entry.activity.location?.name ?? 'Game'}
                  </Text>
                  <Text style={styles.waitlistRowMeta}>{PRODUCT_COPY.onWaitlist}</Text>
                </TouchableOpacity>
              ))}
              <Button
                title="Discover other games"
                variant="ghost"
                size="sm"
                onPress={openDiscover}
                style={styles.sectionLink}
              />
            </View>
          ) : null}

          {needsConfirm ? (
            <View style={styles.rsvpNeededCard}>
              <Text style={styles.rsvpNeededTitle}>{PRODUCT_COPY.confirmPlayingTitle}</Text>
              <Text style={styles.rsvpNeededBody}>{PRODUCT_COPY.confirmPlayingBody}</Text>
            </View>
          ) : null}

          {nextGame || regularGroups[0] ? (
            <NextUpCard
              nextGame={nextGame}
              fallbackGroup={regularGroups[0] ?? null}
              currentUserId={user?.id}
              userLocation={location}
              onOpenGameRoom={(entry) => void openGameRoom(entry)}
              onScheduleNext={openActivityDetails}
              openingGameId={openingGameId}
              footerHint={
                needsConfirm ? PRODUCT_COPY.needsImInHint : undefined
              }
              hostLock={
                lockOnNextUp && dashboard.rosterToLock
                  ? {
                      readiness: dashboard.rosterToLock.readiness,
                      hint: rosterLockHint(dashboard.rosterToLock),
                    }
                  : undefined
              }
            />
          ) : null}

          <TodayQuickActions
            actions={[
              { key: 'play', label: 'Browse Play', icon: 'compass-outline', onPress: openDiscover },
              { key: 'host', label: 'Host', icon: 'add-circle-outline', onPress: openCreateGame },
              { key: 'inbox', label: 'Inbox', icon: 'chatbubbles-outline', onPress: openChats },
            ]}
          />

          {otherActiveGames.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Game Rooms</Text>
              {otherActiveGames.map((entry) => (
                <ActiveGameRoomRow
                  key={entry.activity.id}
                  entry={entry}
                  busy={openingGameId === entry.activity.id}
                  onPress={() => void openGameRoom(entry)}
                />
              ))}
              {activeGames.length > MAX_ROOM_ROWS ? (
                <Button
                  title="See all games"
                  variant="ghost"
                  size="sm"
                  onPress={openChats}
                  style={styles.sectionLink}
                />
              ) : null}
            </View>
          ) : null}

          {regularGroups.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{PRODUCT_COPY.yourRallies}</Text>
              {regularGroups.slice(0, 4).map((group) => (
                <RallyRowCard key={group.id} group={group} onPress={() => openCrew(group.id)} />
              ))}
            </View>
          ) : null}

          {mode !== 'explorer' ? (
            <PlayTeaserCard
              nearbyGames={dashboard.nearbyPublicGames}
              onBrowsePlay={openDiscover}
              onOpenGame={openActivityDetails}
            />
          ) : null}

          {mode === 'explorer' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get started</Text>
              <Text style={styles.explorerHint}>
                Find open games on Play first — join a session, then bring your crew into a Rally.
              </Text>
              <Button title="Browse Play" size="sm" onPress={openDiscover} />
              <Button
                title="Host a game"
                variant="secondary"
                size="sm"
                onPress={openCreateGame}
                style={styles.explorerSecondaryBtn}
              />
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
      )}
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
  scrollEmpty: {
    flexGrow: 1,
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
  sectionLink: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  explorerHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  explorerSecondaryBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
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
  hostSummaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hostSummaryTitle: { ...typography.bodyMedium, color: colors.text },
  hostSummaryMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  rosterLockRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rosterLockRowTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  rosterLockRowHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  waitlistSectionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
  waitlistRowTitle: { ...typography.bodyMedium, color: colors.text },
  waitlistRowMeta: { ...typography.caption, color: colors.warning, marginTop: spacing.xs },
});

export default DynamicHomeScreen;

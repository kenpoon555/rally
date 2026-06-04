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
  Linking,
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
import { buildBetaContactMailto, BETA_COPY } from '../../constants/betaCopy';
import { ProductGlossarySheet } from '../../components/ProductGlossarySheet';
import { MyGameEntry } from '../../services/activityService';
import { ROUTES } from '../../constants/routes';
import { Button, EmptyState, ScreenHeader } from '../../components/ui';
import { NextUpCard } from '../../components/home/NextUpCard';
import { ActiveGameRoomRow } from '../../components/home/ActiveGameRoomRow';
import { colors, spacing, typography } from '../../constants/theme';
import { FOUNDER_BENEFITS_COPY } from '../../constants/betaCopy';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { needsConfirmPlaying } from '../../utils/activityHelpers';
import { SportBadge } from '../../components/SportBadge';

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
  const dashboard = useHomeDashboard(activeGames, user?.id, location);

  useFocusEffect(
    useCallback(() => {
      refetch();
      void fetchLocation();
    }, [refetch, fetchLocation])
  );

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
  const openFriends = () =>
    navigation.getParent()?.navigate(ROUTES.FRIENDS.LIST as never);

  const openCrew = (groupId: string) => {
    navigation.getParent()?.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
      groupId,
    } as never);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
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

  const hostingCount = useMemo(
    () => activeGames.filter((entry) => entry.role === 'host').length,
    [activeGames]
  );

  const needsConfirm = Boolean(
    nextGame &&
      needsConfirmPlaying(nextGame.activity, user?.id)
  );

  const subtitle =
    mode === 'regular'
      ? PRODUCT_COPY.homeRegularSubtitle
      : PRODUCT_COPY.homeExplorerSubtitle;

  const showExplorerEmpty = mode === 'explorer' && !loading && regularGroups.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Today" subtitle={subtitle} />

      {loading && activeGames.length === 0 && regularGroups.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={showExplorerEmpty ? styles.scrollEmpty : undefined}
        >
          {dashboard.rosterToLock ? (
            <TouchableOpacity
              style={[
                styles.rosterLockCard,
                dashboard.rosterToLock.readiness === 'ready' && styles.rosterLockCardReady,
              ]}
              onPress={() => openGameRoom(dashboard.rosterToLock!.entry)}
            >
              <View style={styles.rosterLockHeader}>
                <Text style={styles.rosterLockTitle}>
                  {dashboard.rosterToLock.readiness === 'ready'
                    ? PRODUCT_COPY.hostLockReady
                    : 'Roster to lock'}
                </Text>
                {dashboard.rosterToLock.readiness === 'ready' ? (
                  <View style={styles.rosterLockBadge}>
                    <Text style={styles.rosterLockBadgeText}>Ready</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.rosterLockMeta}>
                {dashboard.rosterToLock.entry.activity.sport_type}
                {dashboard.rosterToLock.entry.activity.location?.name
                  ? ` · ${dashboard.rosterToLock.entry.activity.location.name}`
                  : ''}
              </Text>
              <Text style={styles.rosterLockHint}>
                {dashboard.rosterToLock.readiness === 'ready'
                  ? PRODUCT_COPY.hostLockTapToOpen
                  : dashboard.rosterToLock.readiness === 'needs_players'
                    ? PRODUCT_COPY.hostLockNeedsPlayers(
                        dashboard.rosterToLock.rosterCount,
                        1 + Math.max(dashboard.rosterToLock.entry.activity.missing_players ?? 1, 0)
                      )
                    : PRODUCT_COPY.hostLockWaitingImIn(
                        dashboard.rosterToLock.readyCount,
                        dashboard.rosterToLock.rosterCount
                      )}
              </Text>
              {dashboard.hostSummary.hosting > 1 ? (
                <Text style={styles.hostSummaryInline}>
                  {dashboard.hostSummary.hosting} hosting
                  {dashboard.hostSummary.readyToLock > 0
                    ? ` · ${dashboard.hostSummary.readyToLock} ready to lock`
                    : ` · ${dashboard.hostSummary.needsLock} need lock`}
                </Text>
              ) : null}
            </TouchableOpacity>
          ) : dashboard.hostSummary.hosting > 0 ? (
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

          {mode === 'explorer' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get started — LA badminton & pickleball</Text>
              <View style={styles.actionRow}>
                <Button title="Host a Game" size="sm" onPress={openCreateGame} />
                <Button title="Play" variant="accent" size="sm" onPress={openDiscover} />
              </View>
              <Button
                title={PRODUCT_COPY.startARally}
                variant="secondary"
                size="sm"
                onPress={openCreateGame}
              />
              <Button title="Invite friends" variant="ghost" size="sm" onPress={openFriends} />
            </View>
          ) : null}

          {dashboard.nearbyPublicGames.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Games near you</Text>
              {dashboard.nearbyPublicGames.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.nearbyRow}
                  onPress={() => openActivityDetails(game.id)}
                >
                  <View style={styles.nearbyTitleRow}>
                    <SportBadge sport={game.sport_type} />
                    <Text style={styles.nearbyTitle} numberOfLines={1}>
                      {game.location?.name ?? 'Open game'}
                    </Text>
                  </View>
                  <Text style={styles.nearbyMeta}>{PRODUCT_COPY.publicGameShort}</Text>
                </TouchableOpacity>
              ))}
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
            />
          ) : null}

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {hostingCount > 0 ? `Hosting ${hostingCount} upcoming` : 'Quick actions'}
            </Text>
            <View style={styles.actionRow}>
              <Button title="Host" size="sm" onPress={openCreateGame} />
              <Button title="Play" variant="accent" size="sm" onPress={openDiscover} />
            </View>
            <Button
              title={PRODUCT_COPY.addFriends}
              variant="secondary"
              size="sm"
              onPress={() =>
                navigation.getParent()?.navigate(ROUTES.FRIENDS.LIST as never, {
                  openSearch: true,
                } as never)
              }
              style={styles.addFriendsBtn}
            />
            <Text style={styles.addFriendsHint}>{PRODUCT_COPY.addFriendsHint}</Text>
          </View>

          {regularGroups.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{PRODUCT_COPY.yourRallies}</Text>
              {regularGroups.slice(0, 4).map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.crewRow}
                  onPress={() => openCrew(group.id)}
                >
                  <Text style={styles.crewName}>{group.name}</Text>
                  <Text style={styles.crewMeta}>
                    {group.sport_type} · {PRODUCT_COPY.rally} · mini tournaments
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TouchableOpacity onPress={() => setGlossaryOpen(true)}>
            <Text style={styles.glossaryLink}>How Join, I'm in, and Lock roster work →</Text>
          </TouchableOpacity>

          <Text style={styles.founder}>{FOUNDER_BENEFITS_COPY}</Text>
          <TouchableOpacity onPress={() => void Linking.openURL(buildBetaContactMailto())}>
            <Text style={styles.bringRally}>{BETA_COPY.contactCta} — {PRODUCT_COPY.bringRallyCta}</Text>
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  crewRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  crewName: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  crewMeta: {
    ...typography.caption,
    color: colors.textSecondary,
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
  founder: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bringRally: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...typography.caption,
    color: colors.primary,
  },
  glossaryLink: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...typography.caption,
    color: colors.primary,
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
  rosterLockCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  rosterLockCardReady: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  rosterLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rosterLockTitle: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  rosterLockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  rosterLockBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textInverse },
  rosterLockMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  rosterLockHint: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  hostSummaryInline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  addFriendsBtn: { marginTop: spacing.sm },
  addFriendsHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  nearbyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nearbyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  nearbyTitle: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  nearbyMeta: { ...typography.caption, color: colors.textSecondary },
});

export default DynamicHomeScreen;

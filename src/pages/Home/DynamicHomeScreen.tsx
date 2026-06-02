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
import { ensureActivityGroupConversation } from '../../services/chatService';
import { MyGameEntry } from '../../services/activityService';
import { ROUTES } from '../../constants/routes';
import { Button, EmptyState, ScreenHeader } from '../../components/ui';
import { BetaMarketBanner } from '../../components/home/BetaMarketBanner';
import { NextUpCard } from '../../components/home/NextUpCard';
import { ActiveGameRoomRow } from '../../components/home/ActiveGameRoomRow';
import { colors, spacing, typography } from '../../constants/theme';
import { FOUNDER_BENEFITS_COPY } from '../../constants/betaCopy';
import { needsConfirmPlaying } from '../../utils/activityHelpers';

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

  useFocusEffect(
    useCallback(() => {
      refetch();
      void fetchLocation();
    }, [refetch, fetchLocation])
  );

  const openGameRoom = async (entry: MyGameEntry) => {
    setOpeningGameId(entry.activity.id);
    try {
      const conversationId = await ensureActivityGroupConversation(entry.activity.id);
      const title = entry.activity.location?.name || `${entry.activity.sport_type} game`;
      navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
        conversationId,
        title,
        activityId: entry.activity.id,
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
    if (!nextGame) {
      return activeGames.slice(0, MAX_ROOM_ROWS);
    }
    return activeGames
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
      ? 'Next up, your crews, and active Game Rooms.'
      : 'Find a game in LA, host one, or start a Regulars crew.';

  const showExplorerEmpty = mode === 'explorer' && !loading && regularGroups.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Home" subtitle={subtitle} />

      {loading && activeGames.length === 0 && regularGroups.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={showExplorerEmpty ? styles.scrollEmpty : undefined}
        >
          <BetaMarketBanner />

          {needsConfirm ? (
            <View style={styles.rsvpNeededCard}>
              <Text style={styles.rsvpNeededTitle}>Confirm you're playing</Text>
              <Text style={styles.rsvpNeededBody}>
                Your crew game is coming up. Open Chats and tap I'm in on the game card.
              </Text>
            </View>
          ) : null}

          {mode === 'explorer' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get started</Text>
              <View style={styles.actionRow}>
                <Button title="Host a Game" size="sm" onPress={openCreateGame} />
                <Button title="Discover" variant="accent" size="sm" onPress={openDiscover} />
              </View>
              <Button title="Invite friends" variant="secondary" size="sm" onPress={openFriends} />
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
                needsConfirm ? "Crew game — tap I'm in in Chats" : undefined
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
              <Button title="Discover" variant="accent" size="sm" onPress={openDiscover} />
            </View>
          </View>

          {regularGroups.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your crews</Text>
              {regularGroups.slice(0, 4).map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.crewRow}
                  onPress={() => openCrew(group.id)}
                >
                  <Text style={styles.crewName}>{group.name}</Text>
                  <Text style={styles.crewMeta}>
                    {group.sport_type} · Crew · mini tournaments
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.founder}>{FOUNDER_BENEFITS_COPY}</Text>

          {showExplorerEmpty ? (
            <EmptyState
              icon="🏸"
              title="No games yet"
              message="Discover open games in LA or host one and share the invite link with your crew."
              primaryAction={{ label: 'Browse Discover', onPress: openDiscover }}
              secondaryAction={{ label: 'Host a Game', onPress: openCreateGame }}
            />
          ) : null}
        </ScrollView>
      )}
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
    marginBottom: spacing.xl,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default DynamicHomeScreen;

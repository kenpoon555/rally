import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../hooks/useAuth';
import { useUserPlayMode } from '../../hooks/useUserPlayMode';
import { ensureActivityGroupConversation } from '../../services/chatService';
import { MyGameEntry } from '../../services/activityService';
import { ROUTES } from '../../constants/routes';
import { Button, EmptyState, ScreenHeader } from '../../components/ui';
import { BetaMarketBanner } from '../../components/home/BetaMarketBanner';
import { NextUpCard } from '../../components/home/NextUpCard';
import { ActiveGameRoomRow } from '../../components/home/ActiveGameRoomRow';
import { colors, spacing, typography } from '../../constants/theme';

type TabParamList = {
  DynamicHome: undefined;
  Chats: undefined;
  MyGames: undefined;
  Home: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'DynamicHome'>;

const MAX_ROOM_ROWS = 5;

const DynamicHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { mode, loading, activeGames, regularGroups, nextGame, refetch } = useUserPlayMode(
    user?.id
  );
  const [openingGameId, setOpeningGameId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
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

  const openCreateGame = () => {
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never);
  };

  const openDiscover = () => {
    navigation.navigate(ROUTES.HOME.MAIN as never);
  };

  const openChats = () => {
    navigation.navigate(ROUTES.CHAT.TAB as never);
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

  const subtitle =
    mode === 'regular'
      ? 'Your next game, active rooms, and host tools — all in one place.'
      : 'Find a game in LA or host one for your crew.';

  const showExplorerEmpty = mode === 'explorer' && !loading;

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

          {mode === 'regular' ? (
            <NextUpCard
              nextGame={nextGame}
              fallbackGroup={regularGroups[0] ?? null}
              currentUserId={user?.id}
              onOpenGameRoom={(entry) => void openGameRoom(entry)}
              onScheduleNext={openActivityDetails}
              openingGameId={openingGameId}
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
                  title="See all in My Games"
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate(ROUTES.MY_GAMES.TAB as never)}
                  style={styles.sectionLink}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {hostingCount > 0 ? `Hosting ${hostingCount} upcoming` : 'Host or find a game'}
            </Text>
            <View style={styles.actionRow}>
              <Button title="Create Game" size="sm" onPress={openCreateGame} />
              <Button title="Discover" variant="accent" size="sm" onPress={openDiscover} />
            </View>
            {mode === 'regular' ? (
              <Button
                title="Open Chats"
                variant="ghost"
                size="sm"
                onPress={openChats}
                style={styles.ghostLink}
              />
            ) : null}
          </View>

          {showExplorerEmpty ? (
            <EmptyState
              icon="🏸"
              title="No games yet"
              message="Discover open games in LA or create one and share the invite link with your crew."
              primaryAction={{ label: 'Browse Discover', onPress: openDiscover }}
              secondaryAction={{ label: 'Create Game', onPress: openCreateGame }}
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
  },
  ghostLink: {
    alignSelf: 'flex-start',
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
  },
});

export default DynamicHomeScreen;

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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useMyGames } from '../../hooks/useActivities';
import MyGameListItem from '../../components/MyGameListItem';
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../constants/theme';
import { Chip, EmptyState, ScreenHeader } from '../../components/ui';
import { ensureActivityGroupConversation } from '../../services/chatService';
import { isActivityListingActive } from '../../utils/activityExpiry';

type Segment = 'upcoming' | 'past' | 'hosting';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'hosting', label: 'Hosting' },
];

const MyGamesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { games, loading, refetch } = useMyGames(user?.id || '');
  const [segment, setSegment] = useState<Segment>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const entries = useMemo(() => {
    if (segment === 'upcoming') {
      return games.active;
    }
    if (segment === 'past') {
      return games.past;
    }
    return [...games.active, ...games.past].filter(({ role }) => role === 'host');
  }, [games.active, games.past, segment]);

  const openActivityDetail = (activityId: string) => {
    navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, { activityId } as never);
  };

  const openGameRoom = async (activityId: string, title: string) => {
    setOpeningId(activityId);
    try {
      const conversationId = await ensureActivityGroupConversation(activityId);
      navigation.getParent()?.navigate(ROUTES.CHAT.THREAD as never, {
        conversationId,
        title,
        activityId,
      } as never);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open game chat.';
      Alert.alert('Chat unavailable', message);
    } finally {
      setOpeningId(null);
    }
  };

  const handleGamePress = (activityId: string, title: string, isPast: boolean) => {
    if (isPast) {
      openActivityDetail(activityId);
      return;
    }
    void openGameRoom(activityId, title);
  };

  const openCreateGame = () => {
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never);
  };

  const openDiscover = () => {
    navigation.navigate(ROUTES.HOME.MAIN as never);
  };

  const emptyCopy =
    segment === 'hosting'
      ? 'No hosted games yet. Create one and invite your crew.'
      : segment === 'past'
        ? 'Past games show here after play time.'
        : 'Join from Discover or open an invite link — your games show up here.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <ScreenHeader
        title="My Games"
        subtitle="Upcoming, past, and hosting. Past games keep archived chat on the activity."
      />

      <View style={styles.segmentRow}>
        {SEGMENTS.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            selected={segment === key}
            tone="primary"
            onPress={() => setSegment(key)}
          />
        ))}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate(ROUTES.CHAT.TAB as never)}>
        <Text style={styles.linkText}>Active chats in Inbox →</Text>
      </TouchableOpacity>

      {loading && entries.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Nothing here yet"
          message={emptyCopy}
          primaryAction={
            segment !== 'past'
              ? { label: 'Find a game', onPress: openDiscover }
              : undefined
          }
          secondaryAction={
            segment !== 'past'
              ? { label: 'Create game', onPress: openCreateGame }
              : undefined
          }
        />
      ) : (
        entries.map(({ activity, role }) => {
          const title = activity.location?.name || `${activity.sport_type} game`;
          const isPast = !isActivityListingActive(activity) || activity.status === 'completed';
          const busy = openingId === activity.id;
          return (
            <MyGameListItem
              key={activity.id}
              activity={activity}
              role={role}
              busy={busy}
              onPress={() => handleGamePress(activity.id, title, isPast)}
            />
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
});

export default MyGamesScreen;

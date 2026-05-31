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
import { PRIMARY_COLOR } from '../../constants/theme';
import { ensureActivityGroupConversation } from '../../services/chatService';
import { isActivityListingActive } from '../../utils/activityExpiry';

type Segment = 'upcoming' | 'past' | 'hosting';

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
      <Text style={styles.title}>My Games</Text>
      <Text style={styles.subtitle}>Upcoming, past, and games you host.</Text>

      <View style={styles.segmentRow}>
        {(['upcoming', 'past', 'hosting'] as Segment[]).map((key) => {
          const selected = segment === key;
          const label = key === 'upcoming' ? 'Upcoming' : key === 'past' ? 'Past' : 'Hosting';
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segmentChip, selected && styles.segmentChipSelected]}
              onPress={() => setSegment(key)}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate(ROUTES.CHAT.TAB as never)}>
        <Text style={styles.linkText}>Open game chats →</Text>
      </TouchableOpacity>

      {loading && entries.length === 0 ? (
        <ActivityIndicator color={PRIMARY_COLOR} style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
          {segment !== 'past' ? (
            <View style={styles.emptyCtaRow}>
              <TouchableOpacity style={styles.emptyPrimaryCta} onPress={openDiscover}>
                <Text style={styles.emptyPrimaryCtaText}>Find a game</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptySecondaryCta} onPress={openCreateGame}>
                <Text style={styles.emptySecondaryCtaText}>Create game</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f0f0f0',
  },
  segmentChipSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  segmentTextSelected: {
    color: '#fff',
  },
  linkText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
    marginBottom: 16,
  },
  loader: {
    marginTop: 24,
  },
  emptyContainer: {
    marginTop: 8,
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyCtaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyPrimaryCta: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyPrimaryCtaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptySecondaryCta: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptySecondaryCtaText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default MyGamesScreen;

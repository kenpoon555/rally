import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useMyGames } from '../../hooks/useActivities';
import { MyGameEntry } from '../../services/activityService';
import MyGameListItem from '../../components/MyGameListItem';
import { ROUTES } from '../../constants/routes';

type Segment = 'upcoming' | 'past' | 'hosting';

const MyGamesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { games, loading, refetch } = useMyGames(user?.id || '');
  const [segment, setSegment] = useState<Segment>('upcoming');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {loading ? (
        <ActivityIndicator color="#007AFF" style={styles.loader} />
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>
          {segment === 'hosting'
            ? 'No hosted games yet. Create one from Discover.'
            : 'No games here yet. Join from Discover or accept an invite link.'}
        </Text>
      ) : (
        entries.map(({ activity, role }) => (
          <MyGameListItem
            key={activity.id}
            activity={activity}
            role={role}
            onPress={() => openActivityDetail(activity.id)}
          />
        ))
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
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  loader: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
    marginTop: 8,
  },
});

export default MyGamesScreen;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Activity } from '../types/activity';
import JoinRequestButton from './JoinRequestButton';
import { formatGameCardRosterLine } from '../utils/activityHelpers';

interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const status = activity.match_status || 'open';
  const showDeadline = status === 'collecting' && activity.preference_deadline;
  const deadlineText = showDeadline
    ? `Prefs close: ${new Date(activity.preference_deadline as string).toLocaleTimeString()}`
    : null;
  const hostLabel = activity.user?.username || 'Unknown host';
  const rosterLabel = formatGameCardRosterLine(activity);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.topRow}>
          <Text style={styles.sport}>{activity.sport_type}</Text>
          <View style={[styles.statusBadge, status === 'finalized' && styles.statusBadgeFinalized]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <Text style={styles.location}>
          {activity.location?.name || 'Unknown location'}
        </Text>
        {deadlineText && <Text style={styles.deadlineText}>{deadlineText}</Text>}
        <Text style={styles.players}>{rosterLabel}</Text>
        {activity.user && (
          <Text style={styles.host}>Host: {hostLabel}</Text>
        )}
      </TouchableOpacity>
      <JoinRequestButton activity={activity} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sport: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: 10,
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeFinalized: {
    backgroundColor: '#ddf8e8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#245fa7',
    textTransform: 'capitalize',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 12,
    color: '#9a3412',
    marginBottom: 4,
  },
  players: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  host: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default ActivityCard;

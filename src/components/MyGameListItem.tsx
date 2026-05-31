import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '../types/activity';
import { MyGameRole } from '../services/activityService';
import { formatActivityTime, getGameStatusLabel } from '../utils/activityHelpers';
import { PRIMARY_COLOR } from '../constants/theme';

interface MyGameListItemProps {
  activity: Activity;
  role: MyGameRole;
  onPress: () => void;
  busy?: boolean;
}

const MyGameListItem: React.FC<MyGameListItemProps> = ({ activity, role, onPress, busy }) => {
  const timeLabel = formatActivityTime(activity.start_time, activity.duration);
  const statusLabel = getGameStatusLabel(activity);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={busy}
    >
      <View style={styles.row}>
        <Text style={styles.sport}>{activity.sport_type}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, role === 'host' ? styles.badgeHost : styles.badgeJoined]}>
            <Text style={styles.badgeText}>{role === 'host' ? 'Hosting' : 'Joined'}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { marginLeft: 6 },
              statusLabel === 'Played'
                ? styles.badgePlayed
                : statusLabel === 'Open'
                  ? styles.badgeOpen
                  : styles.badgeMuted,
            ]}
          >
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
          {activity.visibility === 'invite_only' ? (
            <View style={[styles.badge, styles.badgeInvite, { marginLeft: 6 }]}>
              <Text style={styles.badgeText}>Invite</Text>
            </View>
          ) : null}
          {activity.urgency_level === 'tonight' ? (
            <View style={[styles.badge, styles.badgeUrgent, { marginLeft: 6 }]}>
              <Text style={styles.badgeText}>Tonight</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.location} numberOfLines={1}>
        {activity.location?.name || 'Court TBD'}
      </Text>
      <Text style={styles.meta}>{timeLabel}</Text>
      <Text style={styles.meta}>
        {activity.player_count} player{activity.player_count === 1 ? '' : 's'}
      </Text>
      {busy ? <ActivityIndicator size="small" color={PRIMARY_COLOR} style={styles.busy} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  sport: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeHost: {
    backgroundColor: '#e8f1ff',
  },
  badgeJoined: {
    backgroundColor: '#ddf8e8',
  },
  badgeOpen: {
    backgroundColor: '#eef2ff',
  },
  badgePlayed: {
    backgroundColor: '#eceff1',
  },
  badgeMuted: {
    backgroundColor: '#f5f5f5',
  },
  badgeInvite: {
    backgroundColor: '#f3e8ff',
  },
  badgeUrgent: {
    backgroundColor: '#ffe8e8',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  location: {
    marginTop: 6,
    fontSize: 14,
    color: '#444',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },
  busy: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

export default MyGameListItem;

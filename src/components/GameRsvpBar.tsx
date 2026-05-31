import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity, GameRsvpStatus } from '../types/activity';

type Props = {
  activity: Activity;
  userId?: string;
  saving?: boolean;
  onSetRsvp: (status: GameRsvpStatus) => void;
  compact?: boolean;
  /** Regulars / series members can RSVP before host approves a join request. */
  allowGroupRsvp?: boolean;
};

const RSVP_OPTIONS: { status: GameRsvpStatus; label: string }[] = [
  { status: 'going', label: 'Going' },
  { status: 'maybe', label: 'Maybe' },
  { status: 'not_going', label: "Can't go" },
];

export function countRsvps(activity: Activity, status: GameRsvpStatus): number {
  return (activity.rsvps || []).filter((r) => r.status === status).length;
}

const GameRsvpBar: React.FC<Props> = ({
  activity,
  userId,
  saving,
  onSetRsvp,
  compact,
  allowGroupRsvp,
}) => {
  if (!userId) {
    return null;
  }

  const isHost = activity.user_id === userId;
  const isApproved = (activity.join_requests || []).some(
    (r) => r.user_id === userId && r.status === 'approved'
  );
  if (!isHost && !isApproved && !allowGroupRsvp) {
    return null;
  }

  const capacity =
    Math.max(1, (activity.player_count ?? 1) + (activity.missing_players ?? 0)) - 1;
  const going = countRsvps(activity, 'going');
  const spotsLeft = Math.max(0, capacity - going);

  const mine = (activity.rsvps || []).find((r) => r.user_id === userId)?.status;
  const maybe = countRsvps(activity, 'maybe');
  const notGoing = countRsvps(activity, 'not_going');

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? (
        <Text style={styles.title}>
          {allowGroupRsvp && !isApproved && !isHost
            ? 'RSVP — first come for open court spots'
            : 'RSVP for this game'}
        </Text>
      ) : null}
      <View style={styles.row}>
        {RSVP_OPTIONS.map(({ status, label }) => {
          const selected = mine === status;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.chip, selected && styles.chipSelected, saving && styles.chipDisabled]}
              onPress={() => onSetRsvp(status)}
              disabled={saving}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        {saving ? <ActivityIndicator size="small" color="#007AFF" style={styles.spinner} /> : null}
      </View>
      <Text style={styles.summary}>
        {going} going · {maybe} maybe · {notGoing} out
        {allowGroupRsvp ? ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#f8f9fb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  wrapCompact: {
    marginBottom: 8,
    paddingVertical: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipDisabled: {
    opacity: 0.6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  chipTextSelected: {
    color: '#fff',
  },
  spinner: {
    marginLeft: 4,
  },
  summary: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});

export default GameRsvpBar;

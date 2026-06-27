import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '../../types/activity';
import {
  getApprovedParticipants,
  sortApprovedRosterParticipants,
} from '../../utils/activityHelpers';
import { colors, radius, spacing, typography } from '../../constants/theme';

type RosterMember = {
  key: string;
  name: string;
  userId?: string;
  isHost?: boolean;
};

type Props = {
  activity: Activity;
  onPlayerPress?: (member: { userId?: string; name: string }) => void;
};

/**
 * Status-grouped pickup roster (taste-tier6 J2) — ports the coaching
 * `ClassDetailScreen` pattern: Confirmed / Not responded groups with counts.
 * Presentational; maps `ready_at` → Confirmed, approved-without-ready → Not responded.
 * Host always counts as Confirmed.
 */
export const StatusGroupedRoster: React.FC<Props> = ({ activity, onPlayerPress }) => {
  const groups = useMemo(() => {
    const confirmed: RosterMember[] = [];
    const notResponded: RosterMember[] = [];
    const isFinalized = activity.match_status === 'finalized';

    const hostName = activity.user?.username?.trim();
    if (hostName) {
      confirmed.push({
        key: `host-${activity.user?.id ?? activity.user_id}`,
        name: hostName,
        userId: activity.user?.id ?? activity.user_id,
        isHost: true,
      });
    }

    for (const req of sortApprovedRosterParticipants(getApprovedParticipants(activity))) {
      const name = req.user?.username?.trim();
      if (!name || req.user_id === activity.user_id) {
        continue;
      }
      const member: RosterMember = {
        key: req.id,
        name,
        userId: req.user?.id ?? req.user_id,
      };
      if (isFinalized || Boolean(req.ready_at)) {
        confirmed.push(member);
      } else {
        notResponded.push(member);
      }
    }

    return { confirmed, notResponded };
  }, [activity]);

  const renderGroup = (label: string, members: RosterMember[]) => {
    if (members.length === 0) {
      return null;
    }
    const groupKey = label.toLowerCase().replace(/[^a-z]+/g, '-');
    return (
      <View style={styles.group} testID={`pickup-roster-group-${groupKey}`}>
        <Text style={styles.groupLabel}>
          {label} · {members.length}
        </Text>
        {members.map((member) => (
          <TouchableOpacity
            key={member.key}
            style={styles.row}
            disabled={!onPlayerPress || !member.userId}
            onPress={() => onPlayerPress?.({ userId: member.userId, name: member.name })}
            testID={`pickup-roster-row-${member.name}`}
          >
            <Text style={styles.name}>{member.name}</Text>
            {member.isHost ? <Text style={styles.hostTag}>Host</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} testID="pickup-status-grouped-roster">
      {renderGroup('Confirmed', groups.confirmed)}
      {renderGroup('Not responded', groups.notResponded)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  groupLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    flexShrink: 1,
  },
  hostTag: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

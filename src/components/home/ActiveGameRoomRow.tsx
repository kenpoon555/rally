import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SportIcon } from '../SportIcon';
import { MyGameEntry } from '../../services/activityService';
import { formatRelativeStart } from '../../utils/formatRelativeStart';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface ActiveGameRoomRowProps {
  entry: MyGameEntry;
  onPress: () => void;
  busy?: boolean;
  highlight?: boolean;
}

export const ActiveGameRoomRow: React.FC<ActiveGameRoomRowProps> = ({
  entry,
  onPress,
  busy,
  highlight,
}) => {
  const { activity, role } = entry;
  const court = activity.location?.name || 'Court TBD';

  return (
    <TouchableOpacity
      style={[styles.row, highlight && styles.rowHighlight]}
      onPress={onPress}
      disabled={busy}
    >
      <SportIcon sport={activity.sport_type} size="sm" style={styles.icon} />
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {activity.sport_type} · {court}
        </Text>
        <Text style={styles.subtitle}>{formatRelativeStart(activity.start_time)}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.chip, role === 'host' ? styles.chipHost : styles.chipJoined]}>
            <Text style={styles.chipText}>{role === 'host' ? 'Hosting' : 'Joined'}</Text>
          </View>
        </View>
      </View>
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowHighlight: {
    backgroundColor: colors.primaryLight,
  },
  icon: {
    marginRight: spacing.sm,
  },
  main: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
  },
  subtitle: {
    marginTop: 2,
    ...typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.xs + 2,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chipHost: {
    backgroundColor: colors.infoSoft,
  },
  chipJoined: {
    backgroundColor: colors.successSoft,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});

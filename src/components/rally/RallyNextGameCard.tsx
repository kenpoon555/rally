import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { formatActivityTime } from '../../utils/activityHelpers';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  activity: Activity;
  onPress: () => void;
  onOpenGameRoom?: () => void;
};

export const RallyNextGameCard: React.FC<Props> = ({ activity, onPress, onOpenGameRoom }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.left}>
      <Text style={styles.eyebrow}>Next up</Text>
      <Text style={styles.title} numberOfLines={1}>
        {activity.sport_type}
      </Text>
      <Text style={styles.when}>{formatActivityTime(activity.start_time, activity.duration)}</Text>
    </View>
    <View style={styles.actions}>
      {onOpenGameRoom ? (
        <TouchableOpacity style={styles.roomBtn} onPress={onOpenGameRoom}>
          <Text style={styles.roomBtnText}>Game room</Text>
        </TouchableOpacity>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(11, 122, 94, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.label,
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  when: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roomBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  roomBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});

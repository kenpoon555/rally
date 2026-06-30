import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { CoachClassListing } from '../../types/coachParent';
import { formatActivityTime } from '../../utils/activityHelpers';

type Props = {
  classes: CoachClassListing[];
};

export const TodayCoachClassesCard: React.FC<Props> = ({ classes }) => {
  const navigation = useNavigation();

  if (classes.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Classes I teach</Text>
        <Text style={styles.empty}>No classes scheduled today.</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(ROUTES.ACTIVITY.CREATE, { createMode: 'class' })
          }
        >
          <Text style={styles.link}>Create your first class →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Classes I teach</Text>
      {classes.map((row) => (
        <TouchableOpacity
          key={row.id}
          style={styles.row}
          onPress={() =>
            navigation.navigate(ROUTES.COACH_PARENT.CLASS_DETAIL, {
              classId: row.id,
              initialTab: 'roster',
            })
          }
        >
          <Text style={styles.classTitle}>{row.title}</Text>
          <Text style={styles.meta}>
            {formatActivityTime(row.start_time, row.duration_minutes)} · {row.enrolled_count} students ·{' '}
            {row.confirmed_count} confirmed
          </Text>
          <View style={styles.actions}>
            <Text style={styles.action}>Roster</Text>
            <Text style={styles.action}>Message Parents</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  classTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { ParentClassEnrollment } from '../../types/coachParent';
import { formatActivityTime } from '../../utils/activityHelpers';

type Props = {
  enrollments: ParentClassEnrollment[];
};

export const TodayMyClassesCard: React.FC<Props> = ({ enrollments }) => {
  const navigation = useNavigation();

  if (enrollments.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.empty}>No upcoming classes for your children.</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(ROUTES.COACH_PARENT.FAMILY_PROFILES as never)
          }
        >
          <Text style={styles.link}>Manage classes for your child →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>My Classes</Text>
      {enrollments.map((row) => (
        <TouchableOpacity
          key={row.id}
          style={styles.row}
          onPress={() =>
            navigation.navigate(ROUTES.COACH_PARENT.CLASS_DETAIL as never, {
              classId: row.class_id,
              initialTab: 'overview',
            } as never)
          }
        >
          <Text style={styles.childName}>{row.student_name}</Text>
          <Text style={styles.classLine}>
            {row.class_title} · {formatActivityTime(row.effective_start_time ?? row.start_time, 90)}
          </Text>
          <Text style={styles.status}>
            {row.session_status === 'cancelled'
              ? 'Session cancelled'
              : row.session_status === 'deferred'
                ? 'Session deferred'
                : row.response_status === 'confirmed'
                  ? 'Confirmed'
                  : row.response_status === 'cant_make_it'
                    ? "Can't make it"
                    : 'Not responded'}
          </Text>
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
  childName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  classLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  status: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: 4,
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

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../constants/theme';
import { ParentClassEnrollment } from '../../types/coachParent';

type Params = {
  EnrollmentConfirmation: { enrollment: ParentClassEnrollment };
};

type Props = NativeStackScreenProps<Params, 'EnrollmentConfirmation'>;

const EnrollmentConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { enrollment } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow} testID="enrollment-confirmed-label">
        Enrolled
      </Text>
      <Text style={styles.title}>{enrollment.student_name}</Text>
      <Text style={styles.line}>{enrollment.class_title}</Text>
      <Text style={styles.line}>{enrollment.sport_type}</Text>
      <Text style={styles.hint}>
        The coach can see {enrollment.student_name} on this class roster only. You can manage
        enrollments from Family Profiles.
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        testID="enrollment-confirmed-done"
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.primaryBtnText}>Back to Today</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  eyebrow: { color: colors.primaryDark, fontWeight: '700', marginBottom: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  line: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.xs },
  hint: { color: colors.textSecondary, marginTop: spacing.lg, lineHeight: 20 },
  primaryBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
});

export default EnrollmentConfirmationScreen;

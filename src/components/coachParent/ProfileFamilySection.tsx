import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../constants/routes';
import { ProfileSettingsRow } from '../profile/ProfileSettingsRow';
import { colors, spacing } from '../../constants/theme';
import { StudentProfile } from '../../types/coachParent';

type Props = {
  students: StudentProfile[];
};

export const ProfileFamilySection: React.FC<Props> = ({ students }) => {
  const navigation = useNavigation();
  const summary =
    students.length === 0
      ? 'Manage child/student profiles for classes'
      : students
          .slice(0, 2)
          .map((s) => `${s.display_name} · ${s.active_class_summary}`)
          .join('\n');

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.groupLabel}>Family</Text>
      <ProfileSettingsRow
        label="Family Profiles"
        value={summary}
        onPress={() =>
          navigation.navigate(ROUTES.COACH_PARENT.FAMILY_PROFILES as never)
        }
      />
      <ProfileSettingsRow
        label="Parent Settings / Consent"
        value="Guardian consent & privacy"
        onPress={() =>
          navigation.navigate(ROUTES.COACH_PARENT.FAMILY_PROFILES as never)
        }
      />
      <Text style={styles.privacy}>Private — only you and enrolled coaches</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  privacy: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
  },
});

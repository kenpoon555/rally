import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { listStudentProfiles } from '../../services/coachParentService';
import {
  archiveStudentProfile,
  MAX_ACTIVE_STUDENT_PROFILES,
} from '../../services/studentProfileService';
import { revokeGuardianConsentsForStudent } from '../../services/guardianConsentService';
import { STUDENT_PROFILES } from '../../constants/parentStudentFlags';
import { canCreateStudentProfiles } from '../../types/ageCategory';
import { StudentProfile } from '../../types/coachParent';
import { ROUTES } from '../../constants/routes';
import { colors, PRIMARY_COLOR, spacing } from '../../constants/theme';

const FamilyProfilesScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const [rows, setRows] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setLoading(true);
    try {
      setRows(await listStudentProfiles(user.id));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleAdd = () => {
    if (!canCreateStudentProfiles(user?.age_category)) {
      Alert.alert(
        'Adults only',
        'Only parents or guardians 18+ can create student profiles.'
      );
      return;
    }
    if (rows.length >= MAX_ACTIVE_STUDENT_PROFILES) {
      Alert.alert(
        'Profile limit',
        `You can have up to ${MAX_ACTIVE_STUDENT_PROFILES} active student profiles. Archive one to add another.`
      );
      return;
    }
    navigation.navigate(ROUTES.COACH_PARENT.GUARDIAN_CONSENT);
  };

  const handleArchive = (row: StudentProfile) => {
    if (!user?.id || !STUDENT_PROFILES) {
      Alert.alert('Archive', 'Archive ships with student profile backend.');
      return;
    }
    Alert.alert('Archive profile?', `Remove ${row.display_name} from active classes?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await archiveStudentProfile(user.id, row.id);
              await revokeGuardianConsentsForStudent(user.id, row.id);
              await load();
            } catch (error: unknown) {
              Alert.alert(
                'Could not archive',
                error instanceof Error ? error.message : 'Try again.'
              );
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Manage child/student profiles for classes.</Text>
        {loading ? (
          <ActivityIndicator color={PRIMARY_COLOR} style={styles.loader} />
        ) : (
          rows.map((row) => (
            <TouchableOpacity key={row.id} style={styles.card} onLongPress={() => handleArchive(row)}>
              <Text style={styles.name}>{row.display_name}</Text>
              <Text style={styles.summary}>{row.active_class_summary}</Text>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.cta} onPress={handleAdd}>
          <Text style={styles.ctaText}>Add Child Profile</Text>
        </TouchableOpacity>
        <Text style={styles.privacy}>Private — only you and enrolled coaches</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hint: { color: colors.textSecondary, marginBottom: spacing.md },
  loader: { marginVertical: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  summary: { marginTop: 4, color: colors.textSecondary },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
  privacy: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default FamilyProfilesScreen;

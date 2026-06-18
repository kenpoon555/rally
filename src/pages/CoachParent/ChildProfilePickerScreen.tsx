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
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { listStudentProfiles } from '../../services/coachParentService';
import { enrollStudentInClass } from '../../services/studentEnrollmentService';
import { ClassEnrollmentInvite, StudentProfile } from '../../types/coachParent';
import { colors, PRIMARY_COLOR, spacing } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

type Params = {
  ChildProfilePicker: {
    classTitle?: string;
    invite?: ClassEnrollmentInvite;
  };
};

type Props = NativeStackScreenProps<Params, 'ChildProfilePicker'>;

const ChildProfilePickerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const invite = route.params?.invite;
  const [rows, setRows] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

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

  const handleSelect = async (row: StudentProfile) => {
    if (!user?.id || !invite) {
      navigation.goBack();
      return;
    }
    setSubmittingId(row.id);
    try {
      const enrollment = await enrollStudentInClass({
        parentUserId: user.id,
        studentProfileId: row.id,
        invite,
      });
      navigation.replace(ROUTES.COACH_PARENT.ENROLLMENT_CONFIRMATION as never, {
        enrollment,
      } as never);
    } catch (err) {
      Alert.alert(
        'Enrollment failed',
        err instanceof Error ? err.message : 'Could not enroll this student.'
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const title = invite?.class_title ?? route.params?.classTitle;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint} testID="child-picker-heading">
          {title ? `Who is joining ${title}?` : 'Who is enrolling in this class?'}
        </Text>
        {loading ? (
          <ActivityIndicator color={PRIMARY_COLOR} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>No child profiles yet.</Text>
        ) : (
          rows.map((row) => (
            <TouchableOpacity
              key={row.id}
              style={styles.card}
              testID={`child-picker-${row.display_name.toLowerCase()}`}
              disabled={submittingId !== null}
              onPress={() => void handleSelect(row)}
            >
              <Text style={styles.name}>{row.display_name}</Text>
              <Text style={styles.summary}>{row.active_class_summary}</Text>
              {submittingId === row.id ? (
                <ActivityIndicator color={PRIMARY_COLOR} style={styles.spinner} />
              ) : null}
            </TouchableOpacity>
          ))
        )}
        {invite ? (
          <TouchableOpacity
            style={styles.addBtn}
            testID="child-picker-add"
            onPress={() =>
              navigation.navigate(ROUTES.COACH_PARENT.ADD_CHILD_PROFILE as never, {
                returnToInvite: invite,
              } as never)
            }
          >
            <Text style={styles.addBtnText}>+ Add child profile</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  hint: { color: colors.textSecondary, marginBottom: spacing.md, fontSize: 16 },
  empty: { color: colors.textSecondary, marginBottom: spacing.md },
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
  spinner: { marginTop: spacing.sm },
  addBtn: {
    marginTop: spacing.md,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtnText: { color: colors.primaryDark, fontWeight: '600', fontSize: 16 },
});

export default ChildProfilePickerScreen;

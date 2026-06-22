import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { getClassInviteByToken } from '../../services/studentEnrollmentService';
import { ClassEnrollmentInvite } from '../../types/coachParent';
import { colors, PRIMARY_COLOR, spacing } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { PARENT_PILOT_ENROLLMENT } from '../../constants/parentStudentFlags';
import { canCreateStudentProfiles } from '../../types/ageCategory';

type Params = {
  ParentClassInvite: { inviteToken: string };
};

type Props = NativeStackScreenProps<Params, 'ParentClassInvite'>;

const ParentClassInviteScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [invite, setInvite] = useState<ClassEnrollmentInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getClassInviteByToken(route.params.inviteToken);
      if (!row) {
        setError('This class invite is invalid or has expired.');
        setInvite(null);
        return;
      }
      setInvite(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load class invite.');
      setInvite(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.inviteToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!PARENT_PILOT_ENROLLMENT) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Parent enrollment is not enabled in this build.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (error || !invite) {
    return (
      <View style={styles.container}>
        <Text style={styles.error} testID="class-invite-error">
          {error ?? 'Invite not found.'}
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} testID="class-invite-preview">
          {invite.class_title}
        </Text>
        <Text style={styles.line}>{invite.sport_type}</Text>
        <Text style={styles.hint}>Parents must sign in to enroll a child in this class.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN as never)}
        >
          <Text style={styles.primaryBtnText}>Log in to enroll</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const canEnrollChild = canCreateStudentProfiles(user.age_category);

  if (!canEnrollChild) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Class enrollment</Text>
        <Text style={styles.title} testID="class-invite-preview">
          {invite.class_title}
        </Text>
        <Text style={styles.line}>{invite.sport_type}</Text>
        <Text style={styles.hint} testID="class-invite-teen-block">
          Only a parent or guardian 18+ can enroll a student in this class. Ask your parent to open
          this invite link.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Class enrollment</Text>
      <Text style={styles.title} testID="class-invite-preview">
        {invite.class_title}
      </Text>
      <Text style={styles.line}>{invite.sport_type}</Text>
      <Text style={styles.hint}>
        Who is joining this class? Only a parent or guardian can enroll a student.
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        testID="class-invite-continue"
        onPress={() =>
          navigation.navigate(ROUTES.COACH_PARENT.CHILD_PICKER as never, {
            invite,
          } as never)
        }
      >
        <Text style={styles.primaryBtnText}>Choose child profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryBtn}
        testID="class-invite-add-child"
        onPress={() =>
          navigation.navigate(ROUTES.COACH_PARENT.ADD_CHILD_PROFILE as never, {
            returnToInvite: invite,
          } as never)
        }
      >
        <Text style={styles.secondaryBtnText}>+ Add child profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  content: { padding: spacing.lg },
  eyebrow: { color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  line: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.md },
  hint: { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  error: { color: colors.textSecondary, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.primaryDark, fontWeight: '600', fontSize: 16 },
});

export default ParentClassInviteScreen;

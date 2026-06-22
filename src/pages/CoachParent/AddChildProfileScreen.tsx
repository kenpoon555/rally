import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { Button, TextField } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../constants/theme';
import { canCreateStudentProfiles } from '../../types/ageCategory';
import { createStudentProfile } from '../../services/studentProfileService';
import { hasActiveGuardianConsent } from '../../services/guardianConsentService';
import { canShowGuardianAttestation } from '../../constants/guardianConsent';
import { ClassEnrollmentInvite } from '../../types/coachParent';

type Params = {
  AddChildProfile: {
    returnToInvite?: ClassEnrollmentInvite;
  };
};

type Props = NativeStackScreenProps<Params, 'AddChildProfile'>;

const AddChildProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const returnToInvite = route.params?.returnToInvite;
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const resumeAfterCreate = () => {
    if (returnToInvite) {
      navigation.replace(ROUTES.COACH_PARENT.CHILD_PICKER as never, {
        invite: returnToInvite,
      } as never);
      return;
    }
    navigation.goBack();
  };

  const handleCreate = async () => {
    if (!user?.id) {
      return;
    }
    if (!canCreateStudentProfiles(user.age_category)) {
      Alert.alert(
        'Adults only',
        'Only parents or guardians 18+ can create student profiles.'
      );
      return;
    }
    if (!canShowGuardianAttestation()) {
      navigation.navigate(ROUTES.COACH_PARENT.GUARDIAN_CONSENT as never, {
        returnToInvite,
      } as never);
      return;
    }
    const consented = await hasActiveGuardianConsent(user.id);
    if (!consented) {
      navigation.navigate(ROUTES.COACH_PARENT.GUARDIAN_CONSENT as never, {
        returnToInvite,
      } as never);
      return;
    }

    setLoading(true);
    try {
      await createStudentProfile(user.id, displayName, user.age_category);
      resumeAfterCreate();
    } catch (error: unknown) {
      Alert.alert(
        'Could not create profile',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        Student profiles are private — only you and enrolled coaches see them. No login for your
        child in v1.
      </Text>
      <TextField
        label="Display name"
        placeholder="e.g. Alex"
        value={displayName}
        onChangeText={setDisplayName}
        editable={!loading}
      />
      <Button title="Create profile" onPress={() => void handleCreate()} loading={loading} fullWidth />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  hint: { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
});

export default AddChildProfileScreen;

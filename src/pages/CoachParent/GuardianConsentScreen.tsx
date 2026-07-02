import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import {
  canShowGuardianAttestation,
  GUARDIAN_ATTESTATION_COPY,
  GUARDIAN_CONSENT_PENDING_MESSAGE,
  GUARDIAN_CONSENT_POLICY_VERSION,
} from '../../constants/guardianConsent';
import { PRIVACY_POLICY_URL } from '../../constants/legal';
import { colors, radius, spacing } from '../../constants/theme';
import { recordGuardianConsent } from '../../services/guardianConsentService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'GuardianConsent'>;

const GuardianConsentScreen: React.FC<Props> = ({ navigation, route: _route }) => {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const approved = canShowGuardianAttestation();

  const handleContinue = async () => {
    if (!user?.id || !approved || !checked) {
      return;
    }
    setLoading(true);
    try {
      await recordGuardianConsent(user.id);
      navigation.navigate(ROUTES.COACH_PARENT.ADD_CHILD_PROFILE);
    } catch (error: unknown) {
      Alert.alert(
        'Could not record consent',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.version}>Policy version: {GUARDIAN_CONSENT_POLICY_VERSION}</Text>

      {!approved ? (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingTitle}>Legal review in progress</Text>
          <Text style={styles.pendingBody}>{GUARDIAN_CONSENT_PENDING_MESSAGE}</Text>
          <Text style={styles.pendingNote}>
            Draft attestation text lives in the contract doc for counsel only — it is not shown in
            the app until approved.
          </Text>
          <Button title="Go back" variant="secondary" onPress={() => navigation.goBack()} style={styles.pendingBack} />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.attestRow}
            onPress={() => setChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.attestCopy}>{GUARDIAN_ATTESTATION_COPY}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.privacyLink}>Privacy policy</Text>
          </TouchableOpacity>
          <Button
            title="Continue"
            onPress={() => void handleContinue()}
            disabled={!checked}
            loading={loading}
            fullWidth
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  version: { fontSize: 12, color: colors.textTertiary, marginBottom: spacing.md },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  pendingBody: { color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
  pendingNote: { fontSize: 12, color: colors.textTertiary, lineHeight: 18 },
  pendingBack: { marginTop: spacing.lg },
  attestRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  attestCopy: { flex: 1, color: colors.text, lineHeight: 22 },
  privacyLink: { color: colors.primary, fontWeight: '600', marginBottom: spacing.lg },
});

export default GuardianConsentScreen;

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { toAuthErrorMessage } from '../../utils/errorMessages';
import { SIGNUP_LEGAL_LABEL } from '../../constants/legal';
import { AuthTermsNotice } from '../../components/auth/AuthTermsNotice';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button, TextField } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';
import { AGE_CATEGORY_LABELS } from '../../types/ageCategory';
import type { AuthStackParamList } from './AgeGateScreen';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation, route }) => {
  const ageCategory = route.params?.ageCategory ?? 'adult_18_plus';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username, ageCategory);
    } catch (error: any) {
      Alert.alert('Signup Failed', toAuthErrorMessage(error, 'Unable to create account right now.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Get Started"
      subtitle={`Create an account (${AGE_CATEGORY_LABELS[ageCategory]}) to host games and join players in LA.`}
    >
      <TextField
        label="Username"
        placeholder="Pick a handle"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextField
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreedToTerms((v) => !v)}
        disabled={loading}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.termsText}>{SIGNUP_LEGAL_LABEL}</Text>
      </TouchableOpacity>

      <AuthTermsNotice variant="signup" />

      <Button
        title="Create account"
        onPress={handleSignup}
        loading={loading}
        disabled={!agreedToTerms}
        fullWidth
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkButton} disabled={loading}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginRight: spacing.sm,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  linkButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default SignupScreen;

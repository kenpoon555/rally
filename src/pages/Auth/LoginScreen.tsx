import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { toAuthErrorMessage } from '../../utils/errorMessages';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button, TextField } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const busy = loading || resetting;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', toAuthErrorMessage(error, 'Unable to sign in right now.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(
        'Enter your email',
        'Type the email on your account, then tap Forgot password again.'
      );
      return;
    }

    setResetting(true);
    try {
      await resetPassword(trimmed);
      Alert.alert(
        'Check your email',
        'We sent a password reset link. Open it on this device to set a new password.'
      );
    } catch (error: unknown) {
      Alert.alert(
        'Could not send reset link',
        toAuthErrorMessage(error, 'Try again in a few minutes.')
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Log In"
      subtitle="Sign in to open your game rooms and Rally chats."
    >
      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!busy}
      />

      <TextField
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!busy}
      />

      <TouchableOpacity
        onPress={() => void handleForgotPassword()}
        style={styles.forgotButton}
        disabled={busy}
      >
        <Text style={styles.forgotText}>{resetting ? 'Sending…' : 'Forgot password?'}</Text>
      </TouchableOpacity>

      <Button title="Sign in" onPress={handleLogin} loading={loading} fullWidth disabled={busy} />

      <TouchableOpacity
        onPress={() => navigation.navigate(ROUTES.AUTH.SIGNUP)}
        style={styles.linkButton}
        disabled={busy}
      >
        <Text style={styles.linkText}>
          New here? <Text style={styles.linkTextBold}>Get Started</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate(ROUTES.AUTH.WELCOME)}
        style={styles.linkButton}
        disabled={busy}
      >
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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

export default LoginScreen;

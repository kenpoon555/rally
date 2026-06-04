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
  const { signIn } = useAuth();

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
        editable={!loading}
      />

      <TextField
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Button title="Sign in" onPress={handleLogin} loading={loading} fullWidth />

      <TouchableOpacity
        onPress={() => navigation.navigate(ROUTES.AUTH.SIGNUP)}
        style={styles.linkButton}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          New here? <Text style={styles.linkTextBold}>Get Started</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate(ROUTES.AUTH.WELCOME)}
        style={styles.linkButton}
        disabled={loading}
      >
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
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

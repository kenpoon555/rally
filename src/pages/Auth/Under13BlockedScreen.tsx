import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../constants/theme';
import type { AuthStackParamList } from './AgeGateScreen';

type Props = NativeStackScreenProps<AuthStackParamList, 'Under13Blocked'>;

const Under13BlockedScreen: React.FC<Props> = ({ navigation }) => (
  <AuthScreenLayout
    title="Ask a parent or guardian"
    subtitle="Rally accounts for kids under 13 must be created by a parent or legal guardian. They can add a student profile for you after they sign up."
  >
    <Text style={styles.body}>
      Please ask a parent or guardian to create an account and manage your class profile.
    </Text>
    <Button
      title="Back to age selection"
      onPress={() => navigation.navigate(ROUTES.AUTH.AGE_GATE)}
      fullWidth
    />
    <TouchableOpacity
      onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}
      style={styles.link}
    >
      <Text style={styles.linkText}>I have an account</Text>
    </TouchableOpacity>
  </AuthScreenLayout>
);

const styles = StyleSheet.create({
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.primary, fontWeight: '600' },
});

export default Under13BlockedScreen;

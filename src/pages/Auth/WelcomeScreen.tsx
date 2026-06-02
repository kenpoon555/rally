import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/routes';
import { APP_NAME, APP_PROMISE_LINE1, APP_PROMISE_LINE2 } from '../../constants/brand';
import { BETA_COPY } from '../../constants/betaCopy';
import { RallyMark } from '../../components/RallyMark';
import { Button } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.hero}>
        <RallyMark size="lg" style={styles.logo} />
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.promise}>{APP_PROMISE_LINE1}</Text>
        <Text style={styles.promise}>{APP_PROMISE_LINE2}</Text>
        <Text style={styles.beta}>{BETA_COPY.headline}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          fullWidth
          onPress={() => navigation.navigate(ROUTES.AUTH.SIGNUP)}
        />
        <Button
          title="Log In"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}
        />
      </View>

      <View style={styles.popular}>
        <Text style={styles.popularLabel}>Popular near you:</Text>
        <Text style={styles.popularSports}>Badminton · Pickleball</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logo: {
    marginBottom: spacing.lg,
  },
  brand: {
    ...typography.display,
    color: colors.text,
    marginBottom: spacing.md,
  },
  promise: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  beta: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
  popular: {
    alignItems: 'center',
  },
  popularLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  popularSports: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
});

export default WelcomeScreen;

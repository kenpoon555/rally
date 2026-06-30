import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import { colors, radius, spacing } from '../../constants/theme';
import { AgeCategory } from '../../types/ageCategory';
import type { AuthStackParamList } from '../../navigation/types';

// Re-export for backward compatibility with Under13BlockedScreen and SignupScreen
export type { AuthStackParamList };

type Props = NativeStackScreenProps<AuthStackParamList, 'AgeGate'>;

const OPTIONS: { id: AgeCategory; title: string; subtitle: string }[] = [
  {
    id: 'under_13',
    title: 'Under 13',
    subtitle: 'A parent or guardian must create the account',
  },
  {
    id: 'teen_13_17',
    title: '13–17',
    subtitle: 'Teen account — no child profiles or payments',
  },
  {
    id: 'adult_18_plus',
    title: '18+',
    subtitle: 'Full adult account',
  },
];

const AgeGateScreen: React.FC<Props> = ({ navigation }) => {
  const [selected, setSelected] = useState<AgeCategory | null>(null);

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    if (selected === 'under_13') {
      navigation.navigate(ROUTES.AUTH.UNDER_13_BLOCKED);
      return;
    }
    navigation.navigate(ROUTES.AUTH.SIGNUP, { ageCategory: selected });
  };

  return (
    <AuthScreenLayout
      title="How old are you?"
      subtitle="We use this to keep minors safe. We store your age range only — not your birthday."
    >
      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const active = selected === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                {option.title}
              </Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={!selected}
        fullWidth
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  options: { gap: spacing.sm, marginBottom: spacing.lg },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  optionTitleActive: { color: colors.text },
  optionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  back: { marginTop: spacing.lg, alignItems: 'center' },
  backText: { color: colors.textSecondary, fontSize: 14 },
});

export default AgeGateScreen;

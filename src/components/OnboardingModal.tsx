import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { MARKET_COPY } from '../constants/betaCopy';
import { BETA_REGION } from '../constants/betaRegion';
import { SportType } from '../constants/sports';
import {
  ONBOARDING_FLAGS,
  setOnboardingPreference,
} from '../constants/onboardingFlags';
import { updateUserProfile } from '../services/userService';
import { Button, Chip } from './ui';
import { colors, spacing, typography } from '../constants/theme';

const BETA_SPORTS: SportType[] = ['Badminton', 'Pickleball'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Competitive'] as const;

type PlayIntent = 'casual' | 'serious' | 'both';
type SkillLevel = (typeof SKILL_LEVELS)[number];

type Props = {
  visible: boolean;
  userId: string;
  onComplete: () => void;
};

export const OnboardingModal: React.FC<Props> = ({ visible, userId, onComplete }) => {
  const [sport, setSport] = useState<SportType>('Badminton');
  const [skill, setSkill] = useState<SkillLevel>('Intermediate');
  const [intent, setIntent] = useState<PlayIntent>('casual');
  const [busy, setBusy] = useState(false);

  const handleContinue = async () => {
    setBusy(true);
    try {
      await Promise.all([
        updateUserProfile(userId, {
          preferred_sports: [sport],
          onboarding_completed: true,
        }),
        setOnboardingPreference(ONBOARDING_FLAGS.PLAY_INTENT, intent),
        setOnboardingPreference(ONBOARDING_FLAGS.SKILL_LEVEL, skill),
      ]);
      onComplete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <Text style={styles.title}>What do you want to play?</Text>
        <Text style={styles.subtitle}>{MARKET_COPY.headline}</Text>
        <View style={styles.chipRow}>
          {BETA_SPORTS.map((name) => (
            <Chip
              key={name}
              label={name}
              selected={sport === name}
              tone="primary"
              onPress={() => setSport(name)}
            />
          ))}
        </View>

        <Text style={styles.label}>Skill level</Text>
        <View style={styles.chipRow}>
          {SKILL_LEVELS.map((level) => (
            <Chip
              key={level}
              label={level}
              selected={skill === level}
              tone="primary"
              onPress={() => setSkill(level)}
            />
          ))}
        </View>

        <Text style={styles.label}>Play style</Text>
        <View style={styles.chipRow}>
          {(
            [
              { id: 'casual' as const, label: 'Casual' },
              { id: 'serious' as const, label: 'Serious' },
              { id: 'both' as const, label: 'Both' },
            ] as const
          ).map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={intent === option.id}
              tone="primary"
              onPress={() => setIntent(option.id)}
            />
          ))}
        </View>

        <Text style={styles.location}>
          General area: {BETA_REGION.name} (court picker uses approximate location when you host)
        </Text>
        <Button title={busy ? 'Saving…' : 'Continue'} onPress={() => void handleContinue()} disabled={busy} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  label: {
    ...typography.bodyMedium,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  location: {
    marginTop: spacing.lg,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  founder: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

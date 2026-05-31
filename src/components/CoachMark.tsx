import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  isOnboardingFlagSet,
  OnboardingFlag,
  setOnboardingFlag,
} from '../constants/onboardingFlags';
import { colors, radius, spacing, typography } from '../constants/theme';

type CoachMarkProps = {
  /** Persisted flag so the tip shows at most once. */
  flag: OnboardingFlag;
  /** Whether the contextual condition for this tip is currently met. */
  active: boolean;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

const CoachMark: React.FC<CoachMarkProps> = ({
  flag,
  active,
  title,
  body,
  actionLabel,
  onAction,
}) => {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    isOnboardingFlagSet(flag).then((set) => {
      if (!cancelled) {
        setDismissed(set);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [flag]);

  if (!active || dismissed !== false) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    void setOnboardingFlag(flag);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        {actionLabel && onAction ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              dismiss();
              onAction();
            }}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.dismissBtn} onPress={dismiss}>
          <Text style={styles.dismissText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    color: colors.primaryDark,
  },
  body: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
  },
  actionText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  dismissBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs + 2,
  },
  dismissText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default CoachMark;

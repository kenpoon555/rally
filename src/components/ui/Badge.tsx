import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'accent' | 'muted';

type Props = {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
};

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  default: { bg: colors.background, text: colors.textSecondary },
  primary: { bg: colors.primaryLight, text: colors.primaryDark },
  success: { bg: colors.successSoft, text: colors.success },
  warning: { bg: colors.warningSoft, text: colors.warning },
  accent: { bg: colors.accentSoft, text: colors.accent },
  muted: { bg: colors.background, text: colors.textTertiary },
};

export function Badge({ label, tone = 'default', style }: Props) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

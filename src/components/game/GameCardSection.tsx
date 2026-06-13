import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Shared section block inside Game card host tools. */
export function GameCardSection({ title, hint, children, style }: Props) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export const gameCardPanelStyles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  panelTitle: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});

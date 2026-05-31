import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
};

export function ScreenHeader({ title, subtitle, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
});

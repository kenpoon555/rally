import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';

type Props = {
  icon?: string;
  title: string;
  message: string;
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
  style?: ViewStyle;
};

export function EmptyState({
  icon = '🏸',
  title,
  message,
  primaryAction,
  secondaryAction,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {(primaryAction || secondaryAction) && (
        <View style={styles.actions}>
          {primaryAction ? (
            <Button title={primaryAction.label} onPress={primaryAction.onPress} fullWidth />
          ) : null}
          {secondaryAction ? (
            <Button
              title={secondaryAction.label}
              variant="secondary"
              onPress={secondaryAction.onPress}
              fullWidth
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
});

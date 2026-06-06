import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface DiscoverErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  /** Center in remaining list space when used as FlatList empty component. */
  fill?: boolean;
}

export const DiscoverErrorState: React.FC<DiscoverErrorStateProps> = ({
  message,
  onRetry,
  retrying = false,
  fill = false,
}) => (
  <View style={[styles.wrap, fill && styles.wrapFill]}>
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.warning} />
        </View>
      </View>

      <Text style={styles.title}>Couldn&apos;t load games</Text>
      <Text style={styles.message}>{message}</Text>

      <Button
        title={retrying ? 'Retrying…' : 'Try again'}
        onPress={onRetry}
        fullWidth
        disabled={retrying}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  wrapFill: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 360,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconRow: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headline,
    fontSize: 20,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Action = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

type Props = {
  actions: Action[];
};

export const TodayQuickActions: React.FC<Props> = ({ actions }) => (
  <View style={styles.row}>
    {actions.map((action) => (
      <TouchableOpacity key={action.key} style={styles.chip} onPress={action.onPress}>
        <Ionicons name={action.icon} size={18} color={colors.primaryDark} />
        <Text style={styles.label}>{action.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

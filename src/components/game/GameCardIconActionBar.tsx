import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export type GameCardIconAction = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
};

type Props = {
  actions: GameCardIconAction[];
};

/** Compact horizontal icon actions — Time, Court, Link, Friends. */
export function GameCardIconActionBar({ actions }: Props) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [
            styles.action,
            action.primary && styles.actionPrimary,
            action.disabled && styles.actionDisabled,
            pressed && !action.disabled && styles.actionPressed,
          ]}
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View style={[styles.iconWrap, action.primary && styles.iconWrapPrimary]}>
            <Ionicons
              name={action.icon}
              size={20}
              color={action.primary ? colors.onPrimary : colors.primaryDark}
            />
          </View>
          <Text
            style={[styles.actionLabel, action.primary && styles.actionLabelPrimary]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    gap: 4,
    minWidth: 0,
  },
  actionPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  iconWrapPrimary: {
    backgroundColor: colors.primary,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  actionLabelPrimary: {
    color: colors.text,
  },
});

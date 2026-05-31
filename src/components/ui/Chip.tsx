import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Tone = 'default' | 'primary' | 'accent' | 'success' | 'muted' | 'host';

type Props = TouchableOpacityProps & {
  label: string;
  selected?: boolean;
  tone?: Tone;
  compact?: boolean;
};

const toneMap: Record<Tone, { bg: string; bgSelected: string; text: string; textSelected: string }> = {
  default: {
    bg: colors.background,
    bgSelected: colors.primary,
    text: colors.textSecondary,
    textSelected: colors.textInverse,
  },
  primary: {
    bg: colors.primaryLight,
    bgSelected: colors.primary,
    text: colors.primaryDark,
    textSelected: colors.textInverse,
  },
  accent: {
    bg: colors.accentSoft,
    bgSelected: colors.accent,
    text: colors.accent,
    textSelected: colors.textInverse,
  },
  success: {
    bg: colors.successSoft,
    bgSelected: colors.success,
    text: colors.success,
    textSelected: colors.textInverse,
  },
  muted: {
    bg: colors.background,
    bgSelected: colors.borderStrong,
    text: colors.textTertiary,
    textSelected: colors.text,
  },
  host: {
    bg: colors.infoSoft,
    bgSelected: colors.info,
    text: colors.info,
    textSelected: colors.textInverse,
  },
};

export function Chip({
  label,
  selected = false,
  tone = 'default',
  compact = false,
  style,
  disabled,
  ...rest
}: Props) {
  const t = toneMap[tone];

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        compact && styles.compact,
        { backgroundColor: selected ? t.bgSelected : t.bg },
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: selected ? t.textSelected : t.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});

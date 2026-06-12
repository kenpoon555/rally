import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Tone = 'default' | 'primary' | 'accent' | 'success' | 'muted' | 'host';

type Props = TouchableOpacityProps & {
  label: string;
  selected?: boolean;
  tone?: Tone;
  compact?: boolean;
  /** Unread count shown beside the label when > 0. */
  badge?: number;
};

const toneMap: Record<Tone, { bg: string; bgSelected: string; text: string; textSelected: string }> = {
  default: {
    bg: colors.background,
    bgSelected: colors.primary,
    text: colors.textSecondary,
    textSelected: colors.onPrimary,
  },
  primary: {
    bg: colors.primaryLight,
    bgSelected: colors.primary,
    text: colors.primaryDark,
    textSelected: colors.onPrimary,
  },
  accent: {
    bg: colors.accentSoft,
    bgSelected: colors.accent,
    text: colors.primaryDark,
    textSelected: colors.onAccent,
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
  badge,
  style,
  disabled,
  ...rest
}: Props) {
  const t = toneMap[tone];
  const showBadge = badge != null && badge > 0;
  const badgeLabel = badge != null && badge > 99 ? '99+' : String(badge ?? '');

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
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            compact && styles.labelCompact,
            { color: selected ? t.textSelected : t.text },
          ]}
        >
          {label}
        </Text>
        {showBadge ? (
          <View style={[styles.badge, selected ? styles.badgeSelected : styles.badgeIdle]}>
            <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
              {badgeLabel}
            </Text>
          </View>
        ) : null}
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 12,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIdle: {
    backgroundColor: colors.accent,
  },
  badgeSelected: {
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onAccent,
  },
  badgeTextSelected: {
    color: colors.primaryDark,
  },
  disabled: {
    opacity: 0.5,
  },
});

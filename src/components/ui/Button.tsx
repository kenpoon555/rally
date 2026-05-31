import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = TouchableOpacityProps & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, { button: ViewStyle; text: { color: string } }> = {
  primary: {
    button: { backgroundColor: colors.primary },
    text: { color: colors.textInverse },
  },
  secondary: {
    button: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
    },
    text: { color: colors.text },
  },
  accent: {
    button: { backgroundColor: colors.accent },
    text: { color: colors.textInverse },
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
  danger: {
    button: { backgroundColor: colors.errorSoft, borderWidth: 1, borderColor: colors.error },
    text: { color: colors.error },
  },
};

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: Props) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        v.button,
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.85}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <Text style={[styles.text, typography.button, v.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
});

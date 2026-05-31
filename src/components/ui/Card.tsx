import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

type Props = ViewProps & {
  elevated?: boolean;
  padded?: boolean;
};

export function Card({ elevated = false, padded = true, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        styles.card,
        elevated && shadows.card,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: {
    padding: spacing.lg,
  },
});

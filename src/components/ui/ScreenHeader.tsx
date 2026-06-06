import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RallyMark } from '../RallyMark';
import { colors, spacing, typography } from '../../constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Small Rally mark beside the title — use on main tab roots */
  showLogo?: boolean;
  /** Thin accent stripe under the header (tab identity color) */
  accentColor?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  subtitle,
  showLogo = false,
  accentColor,
  right,
  style,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          {showLogo ? <RallyMark size="sm" style={styles.logo} /> : null}
          <View style={styles.titleCol}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      </View>
      {accentColor ? <View style={[styles.accent, { backgroundColor: accentColor }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.surface,
  },
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  logo: {
    marginTop: 2,
  },
  titleCol: {
    flex: 1,
  },
  right: {
    marginTop: 4,
  },
  title: {
    ...typography.title,
    fontSize: 22,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  accent: {
    height: 3,
    borderRadius: 2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    opacity: 0.85,
  },
});

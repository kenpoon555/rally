import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../constants/theme';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { MARKET_COPY } from '../constants/betaCopy';
import { RallyMark } from './RallyMark';
import { colors as themeColors, spacing as themeSpacing, typography as themeTypography } from '../constants/theme';
import { KeyboardSafeView, keyboardAwareScrollProps } from './ui/KeyboardSafeView';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthScreenLayout({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardSafeView style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        {...keyboardAwareScrollProps}
      >
        <View style={styles.brandBlock}>
          <RallyMark size="lg" style={styles.logoMark} />
          <Text style={styles.brandName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          <Text style={styles.betaLine}>{MARKET_COPY.headline}</Text>
          <View style={styles.sportRow}>
            <Text style={styles.sportChip}>Badminton</Text>
            <Text style={styles.sportChip}>Pickleball</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{title}</Text>
          <Text style={styles.formSubtitle}>{subtitle}</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoMark: {
    marginBottom: spacing.md,
  },
  brandName: {
    ...typography.display,
    color: colors.text,
  },
  tagline: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  betaLine: {
    ...typography.caption,
    marginTop: themeSpacing.md,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sportRow: {
    flexDirection: 'row',
    gap: themeSpacing.sm,
    marginTop: themeSpacing.sm,
  },
  sportChip: {
    ...themeTypography.label,
    color: themeColors.primaryDark,
    backgroundColor: themeColors.primaryLight,
    paddingHorizontal: themeSpacing.sm,
    paddingVertical: themeSpacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  formTitle: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
});

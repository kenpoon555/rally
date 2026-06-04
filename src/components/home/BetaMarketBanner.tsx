import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BETA_COPY, buildBetaContactMailto } from '../../constants/betaCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';

export const BetaMarketBanner: React.FC = () => {
  const openContact = () => {
    void Linking.openURL(buildBetaContactMailto());
  };

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>{BETA_COPY.marketLabel}</Text>
      <Text style={styles.headline}>{BETA_COPY.headline}</Text>
      <Text style={styles.body}>{BETA_COPY.body}</Text>
      <TouchableOpacity style={styles.cta} onPress={openContact} accessibilityRole="button">
        <Text style={styles.ctaText}>{BETA_COPY.contactCta}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    ...typography.label,
    color: colors.primaryDark,
  },
  headline: {
    marginTop: spacing.xs,
    ...typography.bodyMedium,
    color: colors.text,
  },
  body: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cta: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

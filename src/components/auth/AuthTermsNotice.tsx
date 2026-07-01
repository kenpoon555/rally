import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COMMUNITY_STANDARDS_TEXT, LOGIN_LEGAL_FOOTER, TERMS_SUMMARY } from '../../constants/legal';
import { colors, spacing, typography } from '../../constants/theme';

type Props = {
  variant: 'login' | 'signup';
};

export function AuthTermsNotice({ variant }: Props) {
  if (variant === 'login') {
    return (
      <Text style={styles.footer} accessibilityRole="text">
        {LOGIN_LEGAL_FOOTER}
      </Text>
    );
  }

  return (
    <View style={styles.signupBox}>
      <Text style={styles.signupHeading}>Terms & community standards</Text>
      <Text style={styles.signupBody}>{TERMS_SUMMARY}</Text>
      <Text style={styles.signupBody}>{COMMUNITY_STANDARDS_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  signupBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  signupHeading: {
    ...typography.bodyMedium,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  signupBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});

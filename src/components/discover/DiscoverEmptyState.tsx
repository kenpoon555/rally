import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { SportIconForSurface } from '../SportIconForSurface';
import { RegularGroup } from '../../types/regularGroup';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { BETA_COPY } from '../../constants/betaCopy';
import {
  discoverEmptyHostStepHint,
  discoverGamesEmptyTitle,
} from '../../config/surfaceVisibility';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface DiscoverEmptyStateProps {
  sport: string;
  sportLabel: string;
  regularGroup: RegularGroup | null;
  onHostGame: () => void;
  onOpenRally?: () => void;
  /** Center in remaining list space when used as FlatList empty component. */
  fill?: boolean;
}

export const DiscoverEmptyState: React.FC<DiscoverEmptyStateProps> = ({
  sport,
  sportLabel,
  regularGroup,
  onHostGame,
  onOpenRally,
  fill = false,
}) => (
  <View style={[styles.wrap, fill && styles.wrapFill]}>
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <SportIconForSurface sport={sport} surface="discoverEmptyState" style={styles.sportIcon} />
      </View>

      <Text style={styles.title}>{discoverGamesEmptyTitle(sport)}</Text>
      <Text style={styles.message}>{PRODUCT_COPY.discoverEmptyBody}</Text>

      <View style={styles.steps}>
        <View style={styles.step}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{PRODUCT_COPY.discoverEmptyStepHost}</Text>
            <Text style={styles.stepHint}>{discoverEmptyHostStepHint(sport)}</Text>
          </View>
        </View>
        <View style={styles.step}>
          <View style={[styles.stepBadge, styles.stepBadgeMuted]}>
            <Text style={[styles.stepNumber, styles.stepNumberMuted]}>2</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>Invite your crew</Text>
            <Text style={styles.stepHint}>{PRODUCT_COPY.discoverEmptyStepInvite}</Text>
          </View>
        </View>
      </View>

      <Button title="Host a game" onPress={onHostGame} fullWidth />

      <Text style={styles.inviteHint}>{PRODUCT_COPY.discoverEmptyInviteHint}</Text>

      {regularGroup && onOpenRally ? (
        <TouchableOpacity style={styles.rallyLink} onPress={onOpenRally} activeOpacity={0.8}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <View style={styles.rallyLinkBody}>
            <Text style={styles.rallyLinkTitle}>{PRODUCT_COPY.discoverEmptyOpenRally}</Text>
            <Text style={styles.rallyLinkName} numberOfLines={1}>
              {regularGroup.name}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.footnote}>{PRODUCT_COPY.discoverEmptyTrySport}</Text>
      <Text style={styles.betaLine}>{BETA_COPY.headline}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  wrapFill: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 360,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconRow: {
    alignItems: 'center',
  },
  sportIcon: {
    backgroundColor: colors.primaryLight,
  },
  title: {
    ...typography.headline,
    fontSize: 20,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  steps: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeMuted: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNumber: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textInverse,
  },
  stepNumberMuted: {
    color: colors.textSecondary,
  },
  stepBody: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  stepHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  rallyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(11, 122, 94, 0.12)',
  },
  rallyLinkBody: {
    flex: 1,
    minWidth: 0,
  },
  rallyLinkTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  rallyLinkName: {
    ...typography.bodyMedium,
    color: colors.text,
    marginTop: 2,
  },
  inviteHint: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: -spacing.xs,
  },
  footnote: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textTertiary,
    lineHeight: 18,
  },
  betaLine: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textTertiary,
    lineHeight: 18,
  },
});

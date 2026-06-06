import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { SportBadge } from '../SportBadge';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  nearbyGames: Activity[];
  onBrowsePlay: () => void;
  onOpenGame: (activityId: string) => void;
};

export const PlayTeaserCard: React.FC<Props> = ({ nearbyGames, onBrowsePlay, onOpenGame }) => {
  if (nearbyGames.length === 0) {
    return (
      <TouchableOpacity style={styles.ctaCard} onPress={onBrowsePlay} activeOpacity={0.9}>
        <View style={styles.ctaIcon}>
          <Ionicons name="compass" size={22} color={colors.primaryDark} />
        </View>
        <View style={styles.ctaMain}>
          <Text style={styles.ctaTitle}>Find open games on Play</Text>
          <Text style={styles.ctaMeta}>Browse nearby sessions and fill open spots</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>Open near you</Text>
        <TouchableOpacity onPress={onBrowsePlay}>
          <Text style={styles.seeAll}>See all on Play</Text>
        </TouchableOpacity>
      </View>
      {nearbyGames.slice(0, 2).map((game) => (
        <TouchableOpacity
          key={game.id}
          style={styles.gameRow}
          onPress={() => onOpenGame(game.id)}
        >
          <SportBadge sport={game.sport_type} />
          <View style={styles.gameMain}>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {game.location?.name ?? 'Open game'}
            </Text>
            <Text style={styles.gameMeta}>{PRODUCT_COPY.publicGameShort}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  seeAll: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    gap: spacing.sm,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaMain: {
    flex: 1,
  },
  ctaTitle: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
  },
  ctaMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  gameMain: {
    flex: 1,
    minWidth: 0,
  },
  gameTitle: {
    ...typography.bodyMedium,
  },
  gameMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

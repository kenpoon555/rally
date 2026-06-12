import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  isRallyGame: boolean;
  inviteOnly?: boolean;
};

export function GameCardTypePill({ isRallyGame, inviteOnly }: Props) {
  const icon = isRallyGame ? 'people' : 'globe-outline';
  const label = isRallyGame ? PRODUCT_COPY.rallyGame : PRODUCT_COPY.publicGameShort;

  return (
    <View style={styles.row}>
      <View style={[styles.pill, isRallyGame ? styles.pillRally : styles.pillPickup]}>
        <Ionicons
          name={icon}
          size={13}
          color={isRallyGame ? colors.primaryDark : colors.textSecondary}
        />
        <Text style={[styles.pillText, isRallyGame && styles.pillTextRally]}>{label}</Text>
      </View>
      {inviteOnly ? (
        <View style={styles.inviteOnlyPill}>
          <Ionicons name="lock-closed-outline" size={11} color={colors.textSecondary} />
          <Text style={styles.inviteOnlyText}>Invite-only</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillPickup: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pillRally: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextRally: {
    color: colors.primaryDark,
  },
  inviteOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  inviteOnlyText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

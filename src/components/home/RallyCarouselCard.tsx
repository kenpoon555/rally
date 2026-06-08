import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SportIcon } from '../SportIcon';
import { RegularGroup } from '../../types/regularGroup';
import { colors, radius, spacing, typography } from '../../constants/theme';

const ACCENT_COLORS = [colors.info, colors.primary, colors.accent];
const CARD_WIDTH = 220;

type Props = {
  group: RegularGroup;
  memberCount?: number;
  accentIndex?: number;
  onPress: () => void;
};

export const RallyCarouselCard: React.FC<Props> = ({
  group,
  memberCount,
  accentIndex = 0,
  onPress,
}) => {
  const accent = ACCENT_COLORS[accentIndex % ACCENT_COLORS.length];

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <SportIcon sport={group.sport_type} size="md" variant="plain" style={styles.icon} />
      <Text style={styles.name} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={styles.sport} numberOfLines={1}>
        {group.sport_type}
      </Text>
      <Text style={styles.detail} numberOfLines={1}>
        {memberCount != null
          ? `${memberCount} member${memberCount === 1 ? '' : 's'}`
          : 'Your Rally'}
        {group.is_partner_rally ? ' · Partner' : ''}
      </Text>
    </TouchableOpacity>
  );
};

export const RALLY_CAROUSEL_CARD_WIDTH = CARD_WIDTH;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    padding: spacing.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    minHeight: 36,
  },
  sport: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detail: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});

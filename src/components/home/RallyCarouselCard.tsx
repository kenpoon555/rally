import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <SportIcon sport={group.sport_type} size="md" style={styles.icon} />
      <Text style={styles.name} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={styles.sport} numberOfLines={1}>
        {group.sport_type}
      </Text>
      <Text style={styles.detail} numberOfLines={1}>
        {memberCount != null
          ? `${memberCount} member${memberCount === 1 ? '' : 's'}`
          : 'Your crew'}
        {group.is_partner_rally ? ' · Partner' : ''}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.link}>Open Rally</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </View>
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
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    minHeight: 44,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.md,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SportIcon } from '../SportIcon';
import { MemberAvatarStack } from '../ui/MemberAvatarStack';
import { RegularGroup } from '../../types/regularGroup';
import { colors, radius, spacing, typography } from '../../constants/theme';

const ACCENT_COLORS = [colors.accent, colors.primary, colors.accentSoft];
const CARD_WIDTH = 220;

export type RallyMemberPreview = {
  total: number;
  names: string[];
};

type Props = {
  group: RegularGroup;
  members?: RallyMemberPreview;
  accentIndex?: number;
  onPress: () => void;
};

export const RallyCarouselCard: React.FC<Props> = ({
  group,
  members,
  accentIndex = 0,
  onPress,
}) => {
  const accent = ACCENT_COLORS[accentIndex % ACCENT_COLORS.length];
  const memberNames = members?.names ?? [];
  const memberTotal = members?.total ?? memberNames.length;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <SportIcon sport={group.sport_type} size="md" variant="ghost" style={styles.icon} />
      <Text style={styles.name} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={styles.sport} numberOfLines={1}>
        {group.sport_type}
      </Text>

      <View style={styles.footer}>
        {memberTotal > 0 ? (
          <MemberAvatarStack
            names={memberNames}
            totalCount={memberTotal}
            maxVisible={4}
            overlapping
          />
        ) : (
          <Text style={styles.detail}>Your Rally</Text>
        )}
        {group.is_partner_rally ? (
          <View style={styles.partnerChip}>
            <Text style={styles.partnerText}>Partner</Text>
          </View>
        ) : null}
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
    minHeight: 148,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  detail: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  partnerChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  partnerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

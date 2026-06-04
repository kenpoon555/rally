import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SportIcon } from './SportIcon';
import { getSportMetadata, SportType } from '../constants/sports';
import { colors, radius, spacing, typography } from '../constants/theme';

type SportChipTheme = {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
};

const DEFAULT_THEME: SportChipTheme = {
  bg: colors.primaryLight,
  border: '#B8DDD4',
  text: colors.primaryDark,
  iconBg: '#D4EDE4',
};

const SPORT_THEMES: Partial<Record<SportType, SportChipTheme>> = {
  [SportType.PICKLEBALL]: {
    bg: colors.accentSoft,
    border: '#F5C9B0',
    text: '#9A3412',
    iconBg: '#FFE4D4',
  },
  [SportType.BADMINTON]: {
    bg: colors.primaryLight,
    border: '#A8D4C8',
    text: colors.primaryDark,
    iconBg: '#C8E8DE',
  },
  [SportType.TENNIS]: {
    bg: colors.successSoft,
    border: '#B8E6C8',
    text: '#166534',
    iconBg: '#D4F5E0',
  },
  [SportType.BASKETBALL]: {
    bg: colors.infoSoft,
    border: '#BFDBFE',
    text: '#1E40AF',
    iconBg: '#DBEAFE',
  },
  [SportType.VOLLEYBALL]: {
    bg: '#FEF9C3',
    border: '#FDE68A',
    text: '#854D0E',
    iconBg: '#FEF08A',
  },
};

function getSportTheme(sport: string): SportChipTheme {
  const meta = getSportMetadata(sport);
  if (meta && SPORT_THEMES[meta.name]) {
    return SPORT_THEMES[meta.name]!;
  }
  return DEFAULT_THEME;
}

function getChipLabel(sport: string): string {
  const meta = getSportMetadata(sport);
  return meta?.shortLabel ?? sport;
}

export type SportBadgeProps = {
  sport: string;
  /** pill = icon + label (Discover cards); filter = tappable chip on Play tab */
  variant?: 'pill' | 'filter';
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export const SportBadge: React.FC<SportBadgeProps> = ({
  sport,
  variant = 'pill',
  selected = false,
  onPress,
  style,
}) => {
  const theme = getSportTheme(sport);
  const label = getChipLabel(sport);
  const isFilter = variant === 'filter';

  const containerStyle = [
    styles.pill,
    {
      backgroundColor: isFilter && selected ? colors.primary : theme.bg,
      borderColor: isFilter && selected ? colors.primary : theme.border,
    },
    isFilter && styles.filterChip,
    style,
  ];

  const textColor = isFilter && selected ? colors.textInverse : theme.text;

  const content = (
    <>
      <SportIcon
        sport={sport}
        size="sm"
        style={{
          backgroundColor: isFilter && selected ? 'rgba(255,255,255,0.25)' : theme.iconBg,
        }}
      />
      <Text
        style={[
          isFilter ? styles.filterLabel : styles.pillLabel,
          { color: textColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label} filter`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: 5,
    paddingRight: spacing.sm + 2,
    paddingLeft: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  filterChip: {
    paddingVertical: 6,
    paddingRight: spacing.md,
    marginRight: spacing.sm,
  },
  pillLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
});

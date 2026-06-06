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
  [SportType.BASKETBALL]: {
    bg: colors.infoSoft,
    border: '#BFDBFE',
    text: '#1E40AF',
    iconBg: '#DBEAFE',
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
  [SportType.VOLLEYBALL]: {
    bg: '#FEF9C3',
    border: '#FDE68A',
    text: '#854D0E',
    iconBg: '#FEF08A',
  },
  [SportType.SOCCER]: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    iconBg: '#D1FAE5',
  },
  [SportType.SQUASH]: {
    bg: '#FFF7ED',
    border: '#FED7AA',
    text: '#9A3412',
    iconBg: '#FFEDD5',
  },
  [SportType.RACQUETBALL]: {
    bg: '#FDF4FF',
    border: '#E9D5FF',
    text: '#6B21A8',
    iconBg: '#F3E8FF',
  },
  [SportType.TABLE_TENNIS]: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1D4ED8',
    iconBg: '#DBEAFE',
  },
  [SportType.ULTIMATE]: {
    bg: '#F0FDFA',
    border: '#99F6E4',
    text: '#0F766E',
    iconBg: '#CCFBF1',
  },
  [SportType.RUNNING]: {
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#991B1B',
    iconBg: '#FEE2E2',
  },
  [SportType.HIKING]: {
    bg: '#F7FEE7',
    border: '#D9F99D',
    text: '#3F6212',
    iconBg: '#ECFCCB',
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
    paddingVertical: 8,
    paddingRight: spacing.md + 2,
    paddingLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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

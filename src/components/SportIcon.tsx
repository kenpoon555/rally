import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import { SportType, getSportMetadata } from '../constants/sports';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const SPORT_ICON_NAMES: Record<SportType, IconName> = {
  [SportType.PICKLEBALL]: 'tennis',
  [SportType.BASKETBALL]: 'basketball',
  [SportType.TENNIS]: 'tennis-ball',
  [SportType.BADMINTON]: 'badminton',
  [SportType.VOLLEYBALL]: 'volleyball',
  [SportType.SOCCER]: 'soccer',
  [SportType.SQUASH]: 'tennis-racket',
  [SportType.RACQUETBALL]: 'tennis-racket',
  [SportType.TABLE_TENNIS]: 'table-tennis',
  [SportType.ULTIMATE]: 'disc',
  [SportType.RUNNING]: 'run',
  [SportType.HIKING]: 'hiking',
};

type Size = 'sm' | 'md' | 'lg';

const BOX: Record<Size, number> = { sm: 32, md: 36, lg: 44 };
const GLYPH: Record<Size, number> = { sm: 18, md: 20, lg: 24 };

type Props = {
  sport: string;
  size?: Size;
  style?: ViewStyle;
};

export function getSportIconName(sport: string): IconName {
  const meta = getSportMetadata(sport);
  if (meta && SPORT_ICON_NAMES[meta.name]) {
    return SPORT_ICON_NAMES[meta.name];
  }
  const match = Object.values(SportType).find((s) => s === sport);
  if (match && SPORT_ICON_NAMES[match]) {
    return SPORT_ICON_NAMES[match];
  }
  return 'account-group';
}

export function SportIcon({ sport, size = 'md', style }: Props) {
  const box = BOX[size];
  const iconName = getSportIconName(sport);

  return (
    <View
      style={[
        styles.box,
        { width: box, height: box, borderRadius: radius.sm },
        style,
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={GLYPH[size]} color={colors.primaryDark} />
    </View>
  );
}

/** Fallback letter when vector icon is unavailable (e.g. unknown sport string). */
export function SportIconFallback({ sport, size = 'md', style }: Props) {
  const box = BOX[size];
  const initial = (sport.trim()[0] || '?').toUpperCase();

  return (
    <View
      style={[
        styles.box,
        { width: box, height: box, borderRadius: radius.sm },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: GLYPH[size] - 4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
});

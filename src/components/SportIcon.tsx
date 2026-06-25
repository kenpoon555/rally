import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../constants/theme';
import { SportType, getSportMetadata } from '../constants/sports';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const SPORT_ICON_NAMES: Record<SportType, IconName> = {
  [SportType.PICKLEBALL]: 'tennis',
  [SportType.BASKETBALL]: 'basketball',
  [SportType.TENNIS]: 'tennis-ball',
  [SportType.BADMINTON]: 'badminton',
  [SportType.VOLLEYBALL]: 'volleyball',
  [SportType.SOCCER]: 'soccer',
  [SportType.SQUASH]: 'racquetball',
  [SportType.RACQUETBALL]: 'racquetball',
  [SportType.TABLE_TENNIS]: 'table-tennis',
  [SportType.ULTIMATE]: 'disc',
  [SportType.RUNNING]: 'run',
  [SportType.HIKING]: 'hiking',
  [SportType.WORKOUT]: 'dumbbell',
};

type Size = 'sm' | 'md' | 'lg';

const BOX: Record<Size, number> = { sm: 32, md: 36, lg: 44 };
const GLYPH: Record<Size, number> = { sm: 18, md: 20, lg: 24 };

type Variant = 'tile' | 'plain' | 'ring' | 'filter' | 'ghost';

type Props = {
  sport: string;
  size?: Size;
  style?: ViewStyle;
  /** Glyph only — Today game cards, no border or fill. */
  variant?: Variant;
  /** Highlight border when `variant="filter"` (Play sport row). */
  selected?: boolean;
};

/** Plain list-card icon sizing (no background tile). */
const PLAIN_COLUMN: Record<Size, number> = { sm: 36, md: 42, lg: 48 };
const PLAIN_GLYPH: Record<Size, number> = { sm: 28, md: 34, lg: 40 };

/** Yellow ring sizing — detail / inbox rows with fill. */
const RING_BOX: Record<Size, number> = { sm: 32, md: 42, lg: 52 };
const RING_GLYPH: Record<Size, number> = { sm: 18, md: 26, lg: 30 };

/** Play tab sport filter — bordered circle, no fill. */
const FILTER_BOX = 56;
const FILTER_GLYPH = 34;

/** Rally carousel — no border/fill, larger glyph in circular footprint. */
const GHOST_BOX: Record<Size, number> = { sm: 36, md: 42, lg: 48 };
const GHOST_GLYPH: Record<Size, number> = { sm: 28, md: 32, lg: 36 };

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

export function SportIcon({ sport, size = 'md', style, variant = 'tile', selected = false }: Props) {
  const iconName = getSportIconName(sport);

  if (variant === 'filter') {
    return (
      <View
        style={[
          styles.filterRing,
          {
            width: FILTER_BOX,
            height: FILTER_BOX,
            borderRadius: FILTER_BOX / 2,
            borderWidth: selected ? 3 : 2,
            borderColor: selected ? colors.primary : colors.border,
          },
          style,
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={FILTER_GLYPH} color={colors.text} />
      </View>
    );
  }

  if (variant === 'ghost') {
    const box = GHOST_BOX[size];
    const glyph = GHOST_GLYPH[size];
    return (
      <View
        style={[
          { width: box, height: box, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={glyph} color={colors.text} />
      </View>
    );
  }

  if (variant === 'ring') {
    const box = RING_BOX[size];
    const glyph = RING_GLYPH[size];
    return (
      <View
        style={[
          styles.ring,
          {
            width: box,
            height: box,
            borderRadius: box / 2,
            borderWidth: selected ? 3 : 2,
            borderColor: selected ? colors.primary : colors.accent,
          },
          style,
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={glyph} color={colors.onAccent} />
      </View>
    );
  }

  if (variant === 'plain') {
    const column = PLAIN_COLUMN[size];
    const glyph = PLAIN_GLYPH[size];
    return (
      <View
        style={[
          { width: column, height: column, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={glyph} color={colors.text} />
      </View>
    );
  }

  const box = BOX[size];
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
  filterRing: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

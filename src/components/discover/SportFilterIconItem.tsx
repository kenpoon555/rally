import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { getSportMetadata } from '../../constants/sports';
import { colors, spacing } from '../../constants/theme';
import { SportIconForSurface } from '../SportIconForSurface';

function filterLabel(sport: string): string {
  const meta = getSportMetadata(sport);
  return meta?.shortLabel ?? sport;
}

export type SportFilterIconItemProps = {
  sport: string;
  selected: boolean;
  onPress: () => void;
};

/** Discover / Play tab sport filter — bordered circle, larger glyph. */
export const SportFilterIconItem: React.FC<SportFilterIconItemProps> = ({
  sport,
  selected,
  onPress,
}) => {
  const label = filterLabel(sport);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} filter`}
    >
      <SportIconForSurface
        sport={sport}
        surface="discoverSportFilter"
        selected={selected}
        style={styles.icon}
      />
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    minWidth: 72,
    maxWidth: 96,
  },
  itemPressed: {
    opacity: 0.82,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  labelSelected: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
});

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getSportMetadata } from '../../constants/sports';
import { colors, spacing } from '../../constants/theme';
import { getSportIconName } from '../SportIcon';

const ICON_RING = 52;
const ICON_GLYPH = 26;

function filterLabel(sport: string): string {
  const meta = getSportMetadata(sport);
  return meta?.shortLabel ?? sport;
}

export type SportFilterIconItemProps = {
  sport: string;
  selected: boolean;
  onPress: () => void;
};

/** Discover / Play tab sport filter — icon ring stacked above label. */
export const SportFilterIconItem: React.FC<SportFilterIconItemProps> = ({
  sport,
  selected,
  onPress,
}) => {
  const label = filterLabel(sport);
  const iconName = getSportIconName(sport);
  const iconColor = selected ? colors.primary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} filter`}
    >
      <View style={[styles.iconRing, selected && styles.iconRingSelected]}>
        <MaterialCommunityIcons name={iconName} size={ICON_GLYPH} color={iconColor} />
      </View>
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
  iconRing: {
    width: ICON_RING,
    height: ICON_RING,
    borderRadius: ICON_RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.xs,
  },
  iconRingSelected: {
    borderColor: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  labelSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
});

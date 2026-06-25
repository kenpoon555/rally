import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { SportFilterIconItem } from './SportFilterIconItem';

export interface DiscoverSportFilterSport {
  id: string;
  name: string;
}

export interface DiscoverSportFiltersProps {
  sports: DiscoverSportFilterSport[];
  selectedSport: string;
  onSelect: (sport: string) => void;
  onMorePress?: () => void;
  /** Highlight More when the active filter is not in the quick row. */
  moreSelected?: boolean;
  moreLabel?: string;
}

const ICON_RING = 56;
const ICON_GLYPH = 34;

type MoreItemProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const MoreFilterItem: React.FC<MoreItemProps> = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    accessibilityRole="button"
    accessibilityLabel={`${label}, all sports`}
  >
    <View style={[styles.iconRing, selected && styles.iconRingSelected]}>
      <MaterialCommunityIcons name="dots-horizontal" size={ICON_GLYPH} color={colors.text} />
    </View>
    <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

/** Play tab sport row — icon stacked above label (designer Discover style). */
export const DiscoverSportFilters: React.FC<DiscoverSportFiltersProps> = ({
  sports,
  selectedSport,
  onSelect,
  onMorePress,
  moreSelected = false,
  moreLabel = 'More',
}) => {
  if (sports.length === 0 && !onMorePress) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {sports.map((sport) => (
        <SportFilterIconItem
          key={sport.id}
          sport={sport.name}
          selected={selectedSport === sport.name}
          onPress={() => onSelect(sport.name)}
        />
      ))}
      {onMorePress ? (
        <MoreFilterItem label={moreLabel} selected={moreSelected} onPress={onMorePress} />
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.xl,
  },
  item: {
    alignItems: 'center',
    minWidth: 64,
    maxWidth: 88,
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
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  iconRingSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
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

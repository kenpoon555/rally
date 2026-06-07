import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSportMetadata } from '../../constants/sports';
import { colors, spacing } from '../../constants/theme';
import { getSportIconName } from '../SportIcon';

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

const ICON_RING = 52;
const ICON_GLYPH = 26;

function filterLabel(sport: string): string {
  const meta = getSportMetadata(sport);
  return meta?.shortLabel ?? sport;
}

type FilterItemProps = {
  sport: string;
  selected: boolean;
  onPress: () => void;
};

const PlaySportFilterItem: React.FC<FilterItemProps> = ({ sport, selected, onPress }) => {
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
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

type MoreItemProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const MoreFilterItem: React.FC<MoreItemProps> = ({ label, selected, onPress }) => {
  const iconColor = selected ? colors.primary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}, all sports`}
    >
      <View style={[styles.iconRing, selected && styles.iconRingSelected]}>
        <MaterialCommunityIcons name="dots-horizontal" size={ICON_GLYPH} color={iconColor} />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

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
        <PlaySportFilterItem
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

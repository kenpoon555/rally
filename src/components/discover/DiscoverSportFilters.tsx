import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SportBadge } from '../SportBadge';
import { spacing } from '../../constants/theme';

export interface DiscoverSportFilterSport {
  id: string;
  name: string;
}

export interface DiscoverSportFiltersProps {
  sports: DiscoverSportFilterSport[];
  selectedSport: string;
  onSelect: (sport: string) => void;
}

export const DiscoverSportFilters: React.FC<DiscoverSportFiltersProps> = ({
  sports,
  selectedSport,
  onSelect,
}) => {
  if (sports.length <= 1) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {sports.map((sport) => (
        <SportBadge
          key={sport.id}
          sport={sport.name}
          variant="filter"
          selected={selectedSport === sport.name}
          onPress={() => onSelect(sport.name)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
});

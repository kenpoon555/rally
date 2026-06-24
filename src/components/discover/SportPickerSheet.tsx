import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SportFilterIconItem } from './SportFilterIconItem';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type SportPickerItem = {
  id: string;
  name: string;
};

type Props = {
  visible: boolean;
  sports: SportPickerItem[];
  selectedSport: string;
  onSelect: (sport: string) => void;
  onClose: () => void;
  /** MRU sport names from profile — shown in a Recent row above the full grid. */
  recentSportNames?: string[];
};

const RECENT_MAX = 5;

export const SportPickerSheet: React.FC<Props> = ({
  visible,
  sports,
  selectedSport,
  onSelect,
  onClose,
  recentSportNames = [],
}) => {
  const insets = useSafeAreaInsets();
  const sportsByName = useMemo(() => new Map(sports.map((sport) => [sport.name, sport])), [sports]);
  const recentSports = useMemo(() => {
    const seen = new Set<string>();
    const items: SportPickerItem[] = [];
    for (const name of recentSportNames) {
      if (!name || seen.has(name)) {
        continue;
      }
      const item = sportsByName.get(name);
      if (item) {
        seen.add(name);
        items.push(item);
      }
      if (items.length >= RECENT_MAX) {
        break;
      }
    }
    return items;
  }, [recentSportNames, sportsByName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>All sports</Text>
          <Text style={styles.subtitle}>Pick a sport to filter games and players nearby.</Text>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {recentSports.length > 0 ? (
              <View style={styles.recentSection}>
                <Text style={styles.sectionLabel}>Recent</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentRow}
                >
                  {recentSports.map((sport) => (
                    <View key={`recent-${sport.id}`} style={styles.recentCell}>
                      <SportFilterIconItem
                        sport={sport.name}
                        selected={selectedSport === sport.name}
                        onPress={() => {
                          onSelect(sport.name);
                          onClose();
                        }}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <Text style={[styles.sectionLabel, recentSports.length > 0 && styles.sectionLabelSpaced]}>
              All sports
            </Text>
            <View style={styles.grid}>
              {sports.map((sport) => (
                <View key={sport.id} style={styles.gridCell}>
                  <SportFilterIconItem
                    sport={sport.name}
                    selected={selectedSport === sport.name}
                    onPress={() => {
                      onSelect(sport.name);
                      onClose();
                    }}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '72%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    fontSize: 20,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionLabelSpaced: {
    marginTop: spacing.lg,
  },
  recentSection: {
    marginBottom: spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  recentCell: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: spacing.lg,
    columnGap: spacing.sm,
  },
  gridCell: {
    width: '31%',
    alignItems: 'center',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  doneText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});

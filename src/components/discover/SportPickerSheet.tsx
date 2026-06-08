import React from 'react';
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
};

export const SportPickerSheet: React.FC<Props> = ({
  visible,
  sports,
  selectedSport,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

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
          <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: spacing.lg,
    columnGap: spacing.sm,
    paddingBottom: spacing.md,
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

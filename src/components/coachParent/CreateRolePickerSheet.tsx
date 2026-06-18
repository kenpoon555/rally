import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type CreateOption = 'game' | 'rally' | 'class';

type Props = {
  visible: boolean;
  showClassOption: boolean;
  onClose: () => void;
  onSelect: (option: CreateOption) => void;
};

export const CreateRolePickerSheet: React.FC<Props> = ({
  visible,
  showClassOption,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Create</Text>
          <Pressable style={styles.row} onPress={() => onSelect('game')}>
            <Text style={styles.rowLabel}>Casual Game</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => onSelect('rally')}>
            <Text style={styles.rowLabel}>Rally Group</Text>
          </Pressable>
          {showClassOption ? (
            <Pressable style={styles.row} onPress={() => onSelect('class')}>
              <Text style={styles.rowLabel}>Class / Clinic</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cancel: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

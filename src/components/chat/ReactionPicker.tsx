import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { REACTION_EMOJIS, ReactionEmoji } from '../../types/chat';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  visible: boolean;
  myReactions: ReactionEmoji[];
  onSelect: (emoji: ReactionEmoji) => void;
  onClose: () => void;
};

export const ReactionPicker: React.FC<Props> = ({ visible, myReactions, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <View style={styles.picker}>
        {REACTION_EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[styles.emojiBtn, myReactions.includes(emoji) && styles.emojiBtnActive]}
            onPress={() => {
              onSelect(emoji);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  emoji: {
    fontSize: 24,
  },
});

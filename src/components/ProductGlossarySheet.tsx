import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PRODUCT_COPY } from '../constants/productCopy';
import { colors, spacing, typography } from '../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ProductGlossarySheet: React.FC<Props> = ({ visible, onClose }) => {
  const items = [
    { title: 'Join game', body: PRODUCT_COPY.glossary.join },
    { title: "I'm in", body: PRODUCT_COPY.glossary.imIn },
    { title: 'Lock roster', body: PRODUCT_COPY.glossary.lockRoster },
    { title: PRODUCT_COPY.publicGame, body: PRODUCT_COPY.glossary.publicGame },
    { title: PRODUCT_COPY.rallyGame, body: PRODUCT_COPY.glossary.rallyGame },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>How Rally works</Text>
          <ScrollView>
            {items.map((item) => (
              <View key={item.title} style={styles.row}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowBody}>{item.body}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.md },
  row: { marginBottom: spacing.lg },
  rowTitle: { ...typography.bodyMedium, color: colors.text },
  rowBody: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  closeBtn: {
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  closeText: { color: colors.textInverse, fontWeight: '700' },
});

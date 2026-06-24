import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

function Bubble({ align }: { align: 'left' | 'right' }) {
  return (
    <View
      style={[
        styles.bubble,
        align === 'left' ? styles.bubbleLeft : styles.bubbleRight,
      ]}
    />
  );
}

export function ChatThreadSkeleton() {
  return (
    <View style={styles.container} accessibilityLabel="Loading messages">
      <Bubble align="left" />
      <Bubble align="right" />
      <Bubble align="left" />
      <Bubble align="right" />
      <Bubble align="left" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  bubble: {
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
    opacity: 0.55,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    width: '62%',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    width: '48%',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../constants/theme';

export const PartnerRallyBadge: React.FC = () => (
  <View style={styles.badge}>
    <Text style={styles.text}>Partner Rally</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  text: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

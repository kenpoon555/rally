import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  actionCount: number;
  onPress: () => void;
};

/** One-line nudge — game cards live on Play, not in chat. */
export const RallyPlayTabHint: React.FC<Props> = ({ actionCount, onPress }) => (
  <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.iconWrap}>
      {actionCount > 0 ? (
        <Text style={styles.badge}>!</Text>
      ) : (
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
      )}
    </View>
    <Text style={styles.text}>
      {actionCount > 0 ? PRODUCT_COPY.rallyPlayTabActionHint : PRODUCT_COPY.rallyPlayTabHint}
    </Text>
    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(11, 122, 94, 0.12)',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  text: {
    flex: 1,
    ...typography.caption,
    color: colors.primaryDark,
    lineHeight: 18,
  },
});

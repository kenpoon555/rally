import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SportIcon } from '../SportIcon';
import { RegularGroup } from '../../types/regularGroup';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  group: RegularGroup;
  onPress: () => void;
};

export const RallyRowCard: React.FC<Props> = ({ group, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <SportIcon sport={group.sport_type} size="sm" />
    <View style={styles.main}>
      <Text style={styles.name} numberOfLines={1}>
        {group.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {group.sport_type} · {PRODUCT_COPY.rally}
        {group.is_partner_rally ? ' · Partner' : ''}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

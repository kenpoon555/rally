import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export type ProfileTab = 'me' | 'connect' | 'settings';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'me', label: 'Me' },
  { id: 'connect', label: 'Connect' },
  { id: 'settings', label: 'Settings' },
];

type Props = {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

export const ProfileTabBar: React.FC<Props> = ({ active, onChange }) => (
  <View style={styles.wrap}>
    {TABS.map((tab) => {
      const selected = active === tab.id;
      return (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onChange(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          {selected ? <View style={styles.indicator} /> : <View style={styles.indicatorSpacer} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 15,
    color: colors.textTertiary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  indicator: {
    marginTop: spacing.sm,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  indicatorSpacer: {
    marginTop: spacing.sm,
    height: 3,
  },
});

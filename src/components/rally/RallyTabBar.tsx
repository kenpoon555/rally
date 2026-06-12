import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export type RallyHubTab = 'chat' | 'play' | 'members';

const TABS: { id: RallyHubTab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'play', label: 'Play' },
  { id: 'members', label: 'Members' },
];

type Props = {
  active: RallyHubTab;
  onChange: (tab: RallyHubTab) => void;
  playActionCount?: number;
};

export const RallyTabBar: React.FC<Props> = ({ active, onChange, playActionCount = 0 }) => (
  <View style={styles.wrap}>
    {TABS.map((tab) => {
      const selected = active === tab.id;
      const showPlayBadge = tab.id === 'play' && playActionCount > 0 && !selected;
      return (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onChange(tab.id)}
          activeOpacity={0.7}
        >
          <View style={styles.labelRow}>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
            {showPlayBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>!</Text>
              </View>
            ) : null}
          </View>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onAccent,
    lineHeight: 14,
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

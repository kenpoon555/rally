import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export type SegmentToggleOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: SegmentToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Frosted pill segmented control — Games | Players on Play tab. */
export function SegmentToggle<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: 0,
    marginBottom: spacing.sm,
  },
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    ...Platform.select({
      ios: {
        shadowColor: '#3A2A1A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    ...Platform.select({
      ios: {
        shadowColor: '#141916',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  labelSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

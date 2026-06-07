import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getWeekStripDays,
  isSameCalendarDay,
  weekdayLetter,
} from '../../utils/todayDateUtils';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
};

export const TodayWeekStrip: React.FC<Props> = ({ selectedDay, onSelectDay }) => {
  const days = getWeekStripDays(selectedDay);
  const today = new Date();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const selected = isSameCalendarDay(day, selectedDay);
        const isToday = isSameCalendarDay(day, today);
        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onSelectDay(day)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={day.toLocaleDateString('en-US', { weekday: 'long' })}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{weekdayLetter(day)}</Text>
            {isToday && !selected ? <View style={styles.todayDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textInverse,
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '../constants/theme';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  visible: boolean;
  title?: string;
};

/**
 * Android-safe datetime picker. Avoids re-opening the system dialog in a loop
 * by only mounting DateTimePicker while the user explicitly opens it.
 */
export const ScheduleDateTimePicker: React.FC<Props> = ({ value, onChange, visible, title }) => {
  const [androidDialogOpen, setAndroidDialogOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAndroidDialogOpen(false);
    }
  }, [visible]);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setAndroidDialogOpen(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    if (date) {
      onChange(date);
    }
  };

  if (!visible) {
    return null;
  }

  const formatted = value.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (Platform.OS === 'android') {
    return (
      <View style={styles.block}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.valueText}>{formatted}</Text>
        <TouchableOpacity style={styles.pickBtn} onPress={() => setAndroidDialogOpen(true)}>
          <Text style={styles.pickBtnText}>Change date & time</Text>
        </TouchableOpacity>
        {androidDialogOpen ? (
          <DateTimePicker
            value={value}
            mode="datetime"
            minimumDate={new Date()}
            display="default"
            onChange={handleChange}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.block}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <DateTimePicker
        value={value}
        mode="datetime"
        minimumDate={new Date()}
        display="spinner"
        onChange={handleChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  valueText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pickBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});

import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '../constants/theme';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  visible: boolean;
  title?: string;
  onDismiss?: () => void;
  /** When true, open the Android picker as soon as `visible` becomes true. */
  autoOpen?: boolean;
};

function isDismissed(event: DateTimePickerEvent | undefined): boolean {
  return event?.type === 'dismissed';
}

/**
 * Cross-platform datetime picker. Android uses sequential date → time dialogs
 * because `mode="datetime"` is iOS-only and crashes on unmount in the community picker.
 */
export const ScheduleDateTimePicker: React.FC<Props> = ({
  value,
  onChange,
  visible,
  title,
  onDismiss,
  autoOpen = false,
}) => {
  const [androidStep, setAndroidStep] = useState<'idle' | 'date' | 'time'>('idle');
  const [draftDate, setDraftDate] = useState(value);

  useEffect(() => {
    if (!visible) {
      setAndroidStep('idle');
    }
  }, [visible]);

  useEffect(() => {
    setDraftDate(value);
  }, [value]);

  const openAndroidPicker = () => {
    setDraftDate(new Date(value));
    setAndroidStep('date');
  };

  useEffect(() => {
    if (visible && autoOpen && Platform.OS === 'android' && androidStep === 'idle') {
      openAndroidPicker();
    }
  }, [visible, autoOpen, androidStep]);

  const handleAndroidDate = (event: DateTimePickerEvent, date?: Date) => {
    if (isDismissed(event)) {
      setAndroidStep('idle');
      onDismiss?.();
      return;
    }
    if (date) {
      const next = new Date(date);
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      setDraftDate(next);
      setAndroidStep('time');
    }
  };

  const handleAndroidTime = (event: DateTimePickerEvent, date?: Date) => {
    setAndroidStep('idle');
    if (isDismissed(event)) {
      onDismiss?.();
      return;
    }
    if (date) {
      const combined = new Date(draftDate);
      combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
      onChange(combined);
    }
  };

  const handleIosChange = (event: DateTimePickerEvent, date?: Date) => {
    if (isDismissed(event)) {
      onDismiss?.();
      return;
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
        {androidStep === 'idle' ? (
          <>
            <Text style={styles.valueText}>{formatted}</Text>
            <TouchableOpacity style={styles.pickBtn} onPress={openAndroidPicker}>
              <Text style={styles.pickBtnText}>Change date & time</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {androidStep === 'date' ? (
          <DateTimePicker
            value={draftDate}
            mode="date"
            minimumDate={new Date()}
            display="default"
            onChange={handleAndroidDate}
          />
        ) : null}
        {androidStep === 'time' ? (
          <DateTimePicker
            value={draftDate}
            mode="time"
            display="default"
            onChange={handleAndroidTime}
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
        onChange={handleIosChange}
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

import React, { useCallback, useEffect, useState } from 'react';
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
  /** iOS spinner interval; Android snaps on confirm. */
  minuteInterval?: number;
};

function isDismissed(event: DateTimePickerEvent | undefined): boolean {
  return event?.type === 'dismissed';
}

export function snapDateToMinuteInterval(date: Date, interval: number): Date {
  if (interval <= 1) {
    return new Date(date);
  }
  const next = new Date(date);
  const minutes = next.getMinutes();
  const snapped = Math.round(minutes / interval) * interval;
  if (snapped >= 60) {
    next.setHours(next.getHours() + 1);
    next.setMinutes(0, 0, 0);
  } else {
    next.setMinutes(snapped, 0, 0);
  }
  return next;
}

function applyMinuteInterval(date: Date, minuteInterval?: number): Date {
  if (!minuteInterval || minuteInterval <= 1) {
    return date;
  }
  return snapDateToMinuteInterval(date, minuteInterval);
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
  minuteInterval,
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

  const openAndroidPicker = useCallback(() => {
    setDraftDate(new Date(value));
    setAndroidStep('date');
  }, [value]);

  useEffect(() => {
    if (visible && autoOpen && Platform.OS === 'android' && androidStep === 'idle') {
      openAndroidPicker();
    }
  }, [visible, autoOpen, androidStep, openAndroidPicker]);

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
      onChange(applyMinuteInterval(combined, minuteInterval));
    }
  };

  const handleIosChange = (event: DateTimePickerEvent, date?: Date) => {
    if (isDismissed(event)) {
      onDismiss?.();
      return;
    }
    if (date) {
      onChange(applyMinuteInterval(date, minuteInterval));
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
            minuteInterval={minuteInterval}
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
        minuteInterval={minuteInterval}
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

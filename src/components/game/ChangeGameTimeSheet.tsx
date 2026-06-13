import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { ScheduleDateTimePicker } from '../ScheduleDateTimePicker';
import { hostUpdateGameStartTime } from '../../services/activityService';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { KeyboardSafeView } from '../ui';

type Props = {
  visible: boolean;
  activity: Activity;
  onClose: () => void;
  onUpdated: () => void;
};

export function ChangeGameTimeSheet({ visible, activity, onClose, onUpdated }: Props) {
  const [draftStartTime, setDraftStartTime] = useState(
    () => new Date(activity.start_time ?? Date.now())
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && activity.start_time) {
      setDraftStartTime(new Date(activity.start_time));
    }
  }, [visible, activity.start_time]);

  const saveTime = async (date: Date) => {
    setSaving(true);
    try {
      await hostUpdateGameStartTime(activity.id, date);
      onUpdated();
      onClose();
      Alert.alert('Time updated', PRODUCT_COPY.gameScheduleChangePosted);
    } catch (error: unknown) {
      Alert.alert(
        'Could not update time',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardSafeView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{PRODUCT_COPY.changeGameTime}</Text>
            <Text style={styles.subtitle}>{PRODUCT_COPY.editGameScheduleHint}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <ScheduleDateTimePicker
            visible
            autoOpen
            value={draftStartTime}
            title={PRODUCT_COPY.changeGameTime}
            onChange={(date) => {
              setDraftStartTime(date);
              if (Platform.OS === 'android') {
                void saveTime(date);
              }
            }}
            onDismiss={onClose}
          />
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={() => void saveTime(draftStartTime)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.saveBtnText}>Save new time</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});

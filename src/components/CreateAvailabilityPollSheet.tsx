import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScheduleDateTimePicker } from './ScheduleDateTimePicker';
import { createAvailabilityPoll } from '../services/availabilityPollService';
import { Button } from './ui';
import { colors, radius, spacing, typography } from '../constants/theme';

type SlotDraft = {
  id: string;
  label: string;
  startsAt: Date;
};

type Props = {
  visible: boolean;
  groupId: string;
  conversationId: string;
  onClose: () => void;
  onCreated: () => void;
};

const defaultSlot = (offsetHours: number): SlotDraft => {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours, 0, 0, 0);
  return {
    id: `${Date.now()}-${offsetHours}`,
    label: '',
    startsAt: d,
  };
};

export const CreateAvailabilityPollSheet: React.FC<Props> = ({
  visible,
  groupId,
  conversationId,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('When can we play?');
  const [slots, setSlots] = useState<SlotDraft[]>(() => [defaultSlot(24), defaultSlot(48)]);
  const [saving, setSaving] = useState(false);
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);

  const canAddSlot = slots.length < 6;
  const canRemoveSlot = slots.length > 2;

  const resetForm = () => {
    setTitle('When can we play?');
    setSlots([defaultSlot(24), defaultSlot(48)]);
    setPickerSlotId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addSlot = () => {
    if (!canAddSlot) {
      return;
    }
    setSlots((prev) => [...prev, defaultSlot(24 * (prev.length + 1))]);
  };

  const removeSlot = (id: string) => {
    if (!canRemoveSlot) {
      return;
    }
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, patch: Partial<SlotDraft>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    [slots]
  );

  const handleCreate = async () => {
    if (sortedSlots.length < 2) {
      Alert.alert('Add time options', 'Include at least two times to vote on.');
      return;
    }
    setSaving(true);
    try {
      await createAvailabilityPoll({
        groupId,
        conversationId,
        title: title.trim() || 'When can we play?',
        options: sortedSlots.map((slot) => ({
          label:
            slot.label.trim() ||
            slot.startsAt.toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }),
          starts_at: slot.startsAt.toISOString(),
        })),
      });
      resetForm();
      onCreated();
      onClose();
    } catch (err: unknown) {
      Alert.alert('Poll not created', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const activePickerSlot = pickerSlotId
    ? slots.find((s) => s.id === pickerSlotId) ?? null
    : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New poll</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="When can we play?"
          />

          <Text style={styles.label}>Time options (2–6)</Text>
          {slots.map((slot, index) => (
            <View key={slot.id} style={styles.slotCard}>
              <Text style={styles.slotHeading}>Option {index + 1}</Text>
              <TextInput
                style={styles.input}
                value={slot.label}
                onChangeText={(text) => updateSlot(slot.id, { label: text })}
                placeholder="Optional label"
              />
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setPickerSlotId(slot.id)}
              >
                <Text style={styles.timeButtonText}>
                  {slot.startsAt.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
              {canRemoveSlot ? (
                <TouchableOpacity onPress={() => removeSlot(slot.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {canAddSlot ? (
            <Button title="Add another time" variant="secondary" size="sm" onPress={addSlot} />
          ) : null}

          <Button
            title={saving ? 'Creating…' : 'Create poll'}
            onPress={handleCreate}
            loading={saving}
            disabled={saving}
            style={styles.createBtn}
          />
        </ScrollView>

        {activePickerSlot && Platform.OS === 'ios' ? (
          <View style={styles.pickerSheet}>
            <View style={styles.pickerToolbar}>
              <Button title="Done" size="sm" onPress={() => setPickerSlotId(null)} />
            </View>
            <DateTimePicker
              value={activePickerSlot.startsAt}
              mode="datetime"
              display="spinner"
              onChange={(_, date) => {
                if (date) {
                  updateSlot(activePickerSlot.id, { startsAt: date });
                }
              }}
            />
          </View>
        ) : null}

        {activePickerSlot && Platform.OS === 'android' ? (
          <ScheduleDateTimePicker
            visible
            autoOpen
            value={activePickerSlot.startsAt}
            onChange={(date) => {
              updateSlot(activePickerSlot.id, { startsAt: date });
              setPickerSlotId(null);
            }}
            onDismiss={() => setPickerSlotId(null)}
          />
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: {
    ...typography.body,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.text,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  slotCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotHeading: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timeButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  timeButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  remove: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
  },
  createBtn: {
    marginTop: spacing.lg,
  },
  pickerSheet: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickerToolbar: {
    alignItems: 'flex-end',
    padding: spacing.sm,
  },
});

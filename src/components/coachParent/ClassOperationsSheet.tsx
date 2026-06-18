import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  visible: boolean;
  classTitle: string;
  loading?: boolean;
  onClose: () => void;
  onDefer: (notifyParents: boolean) => void;
  onCancel: (notifyParents: boolean) => void;
};

export const ClassOperationsSheet: React.FC<Props> = ({
  visible,
  classTitle,
  loading = false,
  onClose,
  onDefer,
  onCancel,
}) => {
  const [notifyParents, setNotifyParents] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Session changes</Text>
          <Text style={styles.subtitle}>{classTitle}</Text>
          <Text style={styles.hint}>
            Roster stays intact. Parents of enrolled students can be notified in Inbox → Classes.
          </Text>

          <View style={styles.notifyRow}>
            <Text style={styles.notifyLabel}>Notify parents</Text>
            <Switch
              testID="class-ops-notify-parents"
              value={notifyParents}
              onValueChange={setNotifyParents}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryRow}
            testID="class-ops-defer"
            accessibilityRole="button"
            accessibilityLabel="Defer to next week"
            disabled={loading}
            activeOpacity={0.7}
            onPress={() => onDefer(notifyParents)}
          >
            <Text style={styles.primaryLabel}>Defer to next week</Text>
            <Text style={styles.rowHint}>Keep roster · update session time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerRow}
            testID="class-ops-cancel"
            accessibilityRole="button"
            accessibilityLabel="Cancel this session"
            disabled={loading}
            activeOpacity={0.7}
            onPress={() => onCancel(notifyParents)}
          >
            <Text style={styles.dangerLabel}>Cancel this session</Text>
            <Text style={styles.rowHint}>Mark cancelled for coach + parents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  notifyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  primaryRow: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dangerRow: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.warning,
  },
  rowHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cancel: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

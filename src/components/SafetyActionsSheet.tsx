import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  blockUser,
  submitUserReport,
  recordActivityNoShow,
} from '../services/safetyService';
import {
  REPORT_REASON_LABELS,
  ReportContextType,
  ReportReason,
} from '../types/safety';
import { colors } from '../constants/theme';
import { KeyboardSafeBottomSheet, keyboardAwareScrollProps } from './ui';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentUserId: string;
  targetUserId: string;
  targetUsername: string;
  contextType?: ReportContextType;
  contextId?: string;
  showNoShow?: boolean;
  onBlocked?: () => void;
  onReported?: () => void;
};

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

const SafetyActionsSheet: React.FC<Props> = ({
  visible,
  onClose,
  currentUserId,
  targetUserId,
  targetUsername,
  contextType = 'profile',
  contextId,
  showNoShow = false,
  onBlocked,
  onReported,
}) => {
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode('menu');
    setDetail('');
    setReason('harassment');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBlock = () => {
    Alert.alert(
      `Block ${targetUsername}?`,
      'They will not appear in your feed and you cannot message each other.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await blockUser(currentUserId, targetUserId);
              Alert.alert('Blocked', `${targetUsername} has been blocked.`);
              onBlocked?.();
              handleClose();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not block.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleReportSubmit = async () => {
    setBusy(true);
    try {
      await submitUserReport({
        reporter_id: currentUserId,
        reported_id: targetUserId,
        reason,
        detail,
        context_type: contextType,
        context_id: contextId,
      });
      Alert.alert('Report submitted', 'Thanks — our team will review this report.');
      onReported?.();
      handleClose();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit report.');
    } finally {
      setBusy(false);
    }
  };

  const handleNoShow = () => {
    if (!contextId || contextType !== 'activity') {
      return;
    }
    Alert.alert(
      `No-show: ${targetUsername}?`,
      'This records that they did not show up for this game. It may affect their reliability over time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record',
          onPress: async () => {
            setBusy(true);
            try {
              await recordActivityNoShow({
                activity_id: contextId,
                reporter_id: currentUserId,
                reported_user_id: targetUserId,
              });
              Alert.alert('Recorded', 'No-show recorded for this game.');
              handleClose();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not record.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardSafeBottomSheet style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{targetUsername}</Text>
          <Text style={styles.subtitle}>Safety</Text>

          {mode === 'menu' ? (
            <>
              <TouchableOpacity style={styles.action} onPress={() => setMode('report')} disabled={busy}>
                <Text style={styles.actionText}>Report user</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionDanger} onPress={handleBlock} disabled={busy}>
                <Text style={styles.actionDangerText}>Block user</Text>
              </TouchableOpacity>
              {showNoShow && contextId ? (
                <TouchableOpacity style={styles.action} onPress={handleNoShow} disabled={busy}>
                  <Text style={styles.actionText}>Record no-show for this game</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <ScrollView style={styles.reportScroll} {...keyboardAwareScrollProps}>
              <Text style={styles.label}>Reason</Text>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonChip, reason === r && styles.reasonChipOn]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.reasonText, reason === r && styles.reasonTextOn]}>
                    {REPORT_REASON_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={styles.input}
                placeholder="Optional details"
                value={detail}
                onChangeText={setDetail}
                multiline
              />
              <TouchableOpacity
                style={[styles.submit, busy && styles.disabled]}
                onPress={handleReportSubmit}
                disabled={busy}
              >
                <Text style={styles.submitText}>Submit report</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('menu')}>
                <Text style={styles.back}>Back</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.cancel} onPress={handleClose}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </KeyboardSafeBottomSheet>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  action: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  actionText: { fontSize: 16, color: colors.primary },
  actionDanger: { paddingVertical: 14 },
  actionDangerText: { fontSize: 16, color: '#d32f2f', fontWeight: '600' },
  reportScroll: { maxHeight: 360 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  reasonChip: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  reasonChipOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  reasonText: { fontSize: 14, color: '#333' },
  reasonTextOn: { color: colors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minHeight: 72,
    marginVertical: 12,
    textAlignVertical: 'top',
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  back: { color: colors.primary, textAlign: 'center', marginTop: 12 },
  cancel: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: '#666', fontSize: 16 },
});

export default SafetyActionsSheet;

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  listAdminReportQueue,
  setUserSuspended,
  triageReport,
} from '../../services/adminService';
import {
  AdminReportQueueItem,
  AdminTriageAction,
  REPORT_REASON_LABELS,
  ReportContextType,
} from '../../types/safety';

type MainStackParamList = {
  Admin: undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, 'Admin'>;

function formatReportTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function contextLabel(type?: ReportContextType | null): string {
  if (type === 'activity') {
    return 'Game';
  }
  if (type === 'chat') {
    return 'Chat';
  }
  if (type === 'profile') {
    return 'Profile';
  }
  return 'Other';
}

const AdminScreen: React.FC<Props> = () => {
  const [reports, setReports] = useState<AdminReportQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await listAdminReportQueue());
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load reports.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runTriage = (report: AdminReportQueueItem, action: AdminTriageAction, confirm?: string) => {
    const execute = async () => {
      setBusyReportId(report.id);
      try {
        await triageReport(report.id, action);
        await load();
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Action failed.');
      } finally {
        setBusyReportId(null);
      }
    };

    if (!confirm) {
      void execute();
      return;
    }

    Alert.alert(confirm, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: action === 'suspend' ? 'destructive' : 'default',
        onPress: () => void execute(),
      },
    ]);
  };

  const handleSuspendFromCard = (report: AdminReportQueueItem) => {
    runTriage(
      report,
      'suspend',
      `Suspend @${report.reported_username} and close all ${report.reported_pending_count} pending report(s)?`
    );
  };

  const handleRestoreFromCard = (report: AdminReportQueueItem) => {
    runTriage(report, 'restore', `Restore @${report.reported_username}?`);
  };

  const handleManualSuspend = (suspend: boolean) => {
    const id = suspendUserId.trim();
    if (!id) {
      Alert.alert('User ID required', 'Paste a profile UUID, or tap a report card action.');
      return;
    }
    Alert.alert(suspend ? 'Suspend user?' : 'Restore user?', id, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: suspend ? 'Suspend' : 'Restore',
        style: suspend ? 'destructive' : 'default',
        onPress: async () => {
          setManualBusy(true);
          try {
            await setUserSuspended(id, suspend);
            Alert.alert('Done', suspend ? 'User suspended.' : 'User restored.');
            await load();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed.');
          } finally {
            setManualBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.subtitle}>
        Review reports with usernames. Suspend closes all pending reports for that user.
      </Text>

      <Text style={styles.sectionTitle}>Pending reports ({reports.length})</Text>
      {loading && reports.length === 0 ? (
        <ActivityIndicator color="#007AFF" style={styles.loader} />
      ) : reports.length === 0 ? (
        <Text style={styles.empty}>No pending reports.</Text>
      ) : (
        reports.map((report) => {
          const busy = busyReportId === report.id;
          return (
            <View key={report.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {REPORT_REASON_LABELS[report.reason] || report.reason}
                </Text>
                {report.reported_is_suspended ? (
                  <View style={styles.suspendedBadge}>
                    <Text style={styles.suspendedBadgeText}>Suspended</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.meta}>
                Reported: @{report.reported_username}
                {report.reported_pending_count > 1
                  ? ` · ${report.reported_pending_count} pending`
                  : ''}
              </Text>
              <Text style={styles.meta}>Reporter: @{report.reporter_username}</Text>
              <Text style={styles.meta}>{formatReportTime(report.created_at)}</Text>
              <Text style={styles.meta}>
                {contextLabel(report.context_type)}
                {report.context_id ? ` · ${report.context_id.slice(0, 8)}…` : ''}
              </Text>
              {report.detail ? <Text style={styles.detail}>{report.detail}</Text> : null}

              <View style={styles.actionRow}>
                {!report.reported_is_suspended ? (
                  <TouchableOpacity
                    style={[styles.dangerBtn, busy && styles.btnDisabled]}
                    onPress={() => handleSuspendFromCard(report)}
                    disabled={busy}
                  >
                    <Text style={styles.dangerBtnText}>
                      {busy ? 'Working…' : 'Suspend & close'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, busy && styles.btnDisabled]}
                    onPress={() => handleRestoreFromCard(report)}
                    disabled={busy}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {busy ? 'Working…' : 'Restore user'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.linkRow}>
                <TouchableOpacity
                  onPress={() => runTriage(report, 'reviewed', 'Mark reviewed without suspending?')}
                  disabled={busy}
                >
                  <Text style={styles.link}>Reviewed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => runTriage(report, 'dismiss', 'Dismiss this report?')}
                  disabled={busy}
                >
                  <Text style={styles.linkMuted}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual suspend / restore</Text>
        <Text style={styles.hint}>Fallback when you only have a UUID from Supabase.</Text>
        <TextInput
          style={styles.input}
          value={suspendUserId}
          onChangeText={setSuspendUserId}
          placeholder="Profile UUID"
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.dangerBtn, manualBusy && styles.btnDisabled]}
            onPress={() => handleManualSuspend(true)}
            disabled={manualBusy}
          >
            <Text style={styles.dangerBtnText}>Suspend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, manualBusy && styles.btnDisabled]}
            onPress={() => handleManualSuspend(false)}
            disabled={manualBusy}
          >
            <Text style={styles.secondaryBtnText}>Restore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 4, marginBottom: 16, lineHeight: 20 },
  section: { marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  hint: { fontSize: 12, color: '#888', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  actionRow: { marginTop: 12 },
  linkRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  dangerBtn: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dangerBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secondaryBtnText: { color: '#007AFF', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  loader: { marginVertical: 24 },
  empty: { color: '#666', marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { fontWeight: '700', fontSize: 15, flex: 1 },
  suspendedBadge: {
    backgroundColor: '#fdecea',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  suspendedBadgeText: { color: '#b42318', fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 13, color: '#555', marginTop: 4 },
  detail: { fontSize: 14, marginTop: 8, color: '#333', lineHeight: 20 },
  link: { color: '#007AFF', fontWeight: '600' },
  linkMuted: { color: '#666', fontWeight: '600' },
});

export default AdminScreen;

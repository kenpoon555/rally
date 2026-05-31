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
import { listPendingReports, setUserSuspended, updateReportStatus } from '../../services/adminService';
import { UserReport, REPORT_REASON_LABELS } from '../../types/safety';

type MainStackParamList = {
  Admin: undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, 'Admin'>;

const AdminScreen: React.FC<Props> = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendUserId, setSuspendUserId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await listPendingReports());
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

  const handleDismiss = (report: UserReport) => {
    Alert.alert('Dismiss report?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        onPress: async () => {
          try {
            await updateReportStatus(report.id, 'dismissed');
            await load();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed.');
          }
        },
      },
    ]);
  };

  const handleReviewed = (report: UserReport) => {
    Alert.alert('Mark reviewed?', 'Use this after you have taken action.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reviewed',
        onPress: async () => {
          try {
            await updateReportStatus(report.id, 'reviewed');
            await load();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed.');
          }
        },
      },
    ]);
  };

  const handleSuspend = (suspend: boolean) => {
    const id = suspendUserId.trim();
    if (!id) {
      Alert.alert('User ID required', 'Paste the reported user UUID from Supabase.');
      return;
    }
    Alert.alert(suspend ? 'Suspend user?' : 'Restore user?', id, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: suspend ? 'Suspend' : 'Restore',
        style: suspend ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await setUserSuspended(id, suspend);
            Alert.alert('Done', suspend ? 'User suspended.' : 'User restored.');
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed.');
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
      <Text style={styles.subtitle}>Pending user reports and suspension tools.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suspend / restore by user ID</Text>
        <TextInput
          style={styles.input}
          value={suspendUserId}
          onChangeText={setSuspendUserId}
          placeholder="Profile UUID"
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => handleSuspend(true)}>
            <Text style={styles.dangerBtnText}>Suspend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleSuspend(false)}>
            <Text style={styles.secondaryBtnText}>Restore</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Pending reports ({reports.length})</Text>
      {loading && reports.length === 0 ? (
        <ActivityIndicator color="#007AFF" style={styles.loader} />
      ) : reports.length === 0 ? (
        <Text style={styles.empty}>No pending reports.</Text>
      ) : (
        reports.map((report) => (
          <View key={report.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {REPORT_REASON_LABELS[report.reason] || report.reason}
            </Text>
            <Text style={styles.meta}>Reported user: {report.reported_id}</Text>
            <Text style={styles.meta}>Reporter: {report.reporter_id}</Text>
            {report.detail ? <Text style={styles.detail}>{report.detail}</Text> : null}
            <Text style={styles.meta}>
              {report.context_type || 'profile'}
              {report.context_id ? ` · ${report.context_id}` : ''}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => handleReviewed(report)}>
                <Text style={styles.link}>Reviewed</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDismiss(report)}>
                <Text style={styles.linkMuted}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSuspendUserId(report.reported_id);
                }}
              >
                <Text style={styles.linkDanger}>Use ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 4, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  dangerBtn: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dangerBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtnText: { color: '#007AFF', fontWeight: '600' },
  loader: { marginVertical: 24 },
  empty: { color: '#666' },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 12, color: '#666', marginTop: 4 },
  detail: { fontSize: 13, marginTop: 6 },
  link: { color: '#007AFF', fontWeight: '600', marginRight: 12 },
  linkMuted: { color: '#666', marginRight: 12 },
  linkDanger: { color: '#d32f2f', fontWeight: '600' },
});

export default AdminScreen;

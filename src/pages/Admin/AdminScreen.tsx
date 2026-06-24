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
  getAdminPlatformMetrics,
  listAdminReportQueue,
  setUserSuspended,
  triageReport,
  type AdminPlatformMetrics,
} from '../../services/adminService';
import { listAdminProductFeedback, ProductFeedbackRow } from '../../services/feedbackService';
import {
  approveCaptainApplication,
  listPendingCaptainApplications,
} from '../../services/captainService';
import { PendingCaptainApplicationRow } from '../../types/captain';
import {
  listPendingConciergeRequests,
  updateConciergeRequest,
  searchConciergeMatchGames,
  ConciergeRequestRow,
  ConciergeMatchGameRow,
} from '../../services/conciergeService';
import {
  listPublicGamesForIntroAdmin,
  setIntroSessionAdmin,
  AdminPublicGameRow,
} from '../../services/introOpsService';
import {
  listCaptainFeedbackAdmin,
  CaptainFeedbackRow,
} from '../../services/captainFeedbackService';
import {
  AdminReportQueueItem,
  AdminTriageAction,
  REPORT_REASON_LABELS,
  ReportContextType,
} from '../../types/safety';
import { colors } from '../../constants/theme';
import { KeyboardSafeView, keyboardAwareScrollProps } from '../../components/ui';

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

type AdminTab = 'metrics' | 'moderation';

const METRIC_ROWS: { key: keyof AdminPlatformMetrics; label: string; hint?: string }[] = [
  { key: 'dau_today', label: 'DAU (today)', hint: 'Distinct users with any product event today (UTC)' },
  { key: 'dau_7d', label: 'WAU (7d)', hint: 'Distinct users with events in last 7 days' },
  { key: 'active_games', label: 'Active games', hint: 'status=active, not cancelled' },
  { key: 'games_created_7d', label: 'Games created (7d)' },
  { key: 'joins_approved_7d', label: 'Joins approved (7d)' },
  { key: 'messages_sent_7d', label: 'Chat messages (7d)', hint: 'user_daily_usage chat_message_sent' },
  { key: 'chat_active_users_7d', label: 'Chat-active users (7d)' },
  { key: 'conversations_opened_7d', label: 'Conversations opened (7d)' },
  { key: 'rallies_total', label: 'Active Rallies' },
  { key: 'pending_reports', label: 'Pending reports' },
  { key: 'feedback_7d', label: 'User feedback (7d)' },
  { key: 'users_suspended', label: 'Suspended users' },
];

const AdminScreen: React.FC<Props> = () => {
  const [tab, setTab] = useState<AdminTab>('metrics');
  const [reports, setReports] = useState<AdminReportQueueItem[]>([]);
  const [feedback, setFeedback] = useState<ProductFeedbackRow[]>([]);
  const [metrics, setMetrics] = useState<AdminPlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState('');
  const [manualBusy, setManualBusy] = useState(false);
  const [captainApps, setCaptainApps] = useState<PendingCaptainApplicationRow[]>([]);
  const [busyCaptainId, setBusyCaptainId] = useState<string | null>(null);
  const [conciergeRequests, setConciergeRequests] = useState<ConciergeRequestRow[]>([]);
  const [captainFeedback, setCaptainFeedback] = useState<CaptainFeedbackRow[]>([]);
  const [busyConciergeId, setBusyConciergeId] = useState<string | null>(null);
  const [introGames, setIntroGames] = useState<AdminPublicGameRow[]>([]);
  const [busyIntroId, setBusyIntroId] = useState<string | null>(null);
  const [expandedConciergeId, setExpandedConciergeId] = useState<string | null>(null);
  const [conciergeMatchGames, setConciergeMatchGames] = useState<
    Record<string, ConciergeMatchGameRow[]>
  >({});
  const [loadingConciergeGamesId, setLoadingConciergeGamesId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        reportRows,
        feedbackRows,
        metricRows,
        captainRows,
        conciergeRows,
        captainFeedbackRows,
        introGameRows,
      ] = await Promise.all([
        listAdminReportQueue(),
        listAdminProductFeedback(30),
        getAdminPlatformMetrics(),
        listPendingCaptainApplications().catch(() => [] as PendingCaptainApplicationRow[]),
        listPendingConciergeRequests().catch(() => [] as ConciergeRequestRow[]),
        listCaptainFeedbackAdmin().catch(() => [] as CaptainFeedbackRow[]),
        listPublicGamesForIntroAdmin(25).catch(() => [] as AdminPublicGameRow[]),
      ]);
      setReports(reportRows);
      setFeedback(feedbackRows);
      setMetrics(metricRows);
      setCaptainApps(captainRows);
      setConciergeRequests(conciergeRows);
      setCaptainFeedback(captainFeedbackRows);
      setIntroGames(introGameRows);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load admin data.');
      setReports([]);
      setFeedback([]);
      setMetrics(null);
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
    <KeyboardSafeView style={styles.container}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      {...keyboardAwareScrollProps}
    >
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.subtitle}>
        Metrics for product health · Moderation for reports & feedback. See docs/PUNISHMENT_AND_TRUST.md.
      </Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'metrics' && styles.tabBtnActive]}
          onPress={() => setTab('metrics')}
        >
          <Text style={[styles.tabBtnText, tab === 'metrics' && styles.tabBtnTextActive]}>Metrics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'moderation' && styles.tabBtnActive]}
          onPress={() => setTab('moderation')}
        >
          <Text style={[styles.tabBtnText, tab === 'moderation' && styles.tabBtnTextActive]}>
            Moderation
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'metrics' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform snapshot</Text>
          {loading && !metrics ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : metrics ? (
            <>
              <Text style={styles.hint}>
                Updated {formatReportTime(metrics.generated_at)} · events from product_events &
                usage tables
              </Text>
              {METRIC_ROWS.map((row) => (
                <View key={row.key} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{row.label}</Text>
                  <Text style={styles.metricValue}>{String(metrics[row.key] ?? 0)}</Text>
                  {row.hint ? <Text style={styles.metricHint}>{row.hint}</Text> : null}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.empty}>No metrics — apply migration 035 on Supabase.</Text>
          )}
        </View>
      ) : null}

      {tab === 'moderation' ? (
        <>
      <Text style={styles.sectionTitle}>Captain applications ({captainApps.length})</Text>
      {captainApps.length === 0 ? (
        <Text style={styles.empty}>No pending captain applications.</Text>
      ) : (
        captainApps.map((app) => {
          const busy = busyCaptainId === app.id;
          return (
            <View key={app.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                @{app.username} · {app.sport}
              </Text>
              <Text style={styles.meta}>
                {app.city}
                {app.sub_market ? ` · ${app.sub_market}` : ''} · {formatReportTime(app.created_at)}
              </Text>
              {app.typical_game_note ? (
                <Text style={styles.detail}>{app.typical_game_note}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.approveCaptainBtn}
                disabled={busy}
                onPress={() => {
                  Alert.alert('Approve captain?', `@${app.username} for ${app.sport}`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Approve',
                      onPress: () => {
                        setBusyCaptainId(app.id);
                        void (async () => {
                          try {
                            await approveCaptainApplication(app.id, app.regular_group_id);
                            await load();
                          } catch (e: unknown) {
                            Alert.alert(
                              'Error',
                              e instanceof Error ? e.message : 'Approve failed.'
                            );
                          } finally {
                            setBusyCaptainId(null);
                          }
                        })();
                      },
                    },
                  ]);
                }}
              >
                <Text style={styles.approveCaptainText}>
                  {busy ? 'Approving…' : 'Approve captain'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Intro nights ({introGames.filter((g) => g.is_intro_session).length})</Text>
      <Text style={styles.hint}>
        Weekly ops: pick a captain public game → toggle intro → boost on Play + landing.
      </Text>
      {introGames.length === 0 ? (
        <Text style={styles.empty}>No upcoming public games in the next 14 days.</Text>
      ) : (
        introGames.map((game) => {
          const busy = busyIntroId === game.id;
          return (
            <View key={game.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {game.is_intro_session ? '★ ' : ''}
                {game.listing_title || `${game.sport_type} game`}
              </Text>
              <Text style={styles.meta}>
                @{game.host_username} · {formatReportTime(game.start_time)} · {game.open_spots}{' '}
                open
                {game.location_name ? ` · ${game.location_name}` : ''}
              </Text>
              <TouchableOpacity
                disabled={busy}
                onPress={() => {
                  setBusyIntroId(game.id);
                  void (async () => {
                    try {
                      await setIntroSessionAdmin(game.id, !game.is_intro_session);
                      await load();
                    } catch (e: unknown) {
                      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed.');
                    } finally {
                      setBusyIntroId(null);
                    }
                  })();
                }}
              >
                <Text style={styles.link}>
                  {busy ? '…' : game.is_intro_session ? 'Remove intro badge' : 'Mark as intro night'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Concierge requests ({conciergeRequests.length})</Text>
      <Text style={styles.hint}>
        1) Read intake · 2) Pick open game below · 3) DM intro + deep link · 4) Mark matched.
      </Text>
      {conciergeRequests.length === 0 ? (
        <Text style={styles.empty}>No open concierge requests.</Text>
      ) : (
        conciergeRequests.map((req) => {
          const busy = busyConciergeId === req.id;
          const expanded = expandedConciergeId === req.id;
          const matchGames = conciergeMatchGames[req.id] ?? [];
          return (
            <View key={req.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                @{req.username} · {req.sport} · {req.status}
              </Text>
              <Text style={styles.meta}>{formatReportTime(req.created_at)}</Text>
              {req.area_note ? <Text style={styles.detail}>Area: {req.area_note}</Text> : null}
              {req.availability_note ? (
                <Text style={styles.detail}>When: {req.availability_note}</Text>
              ) : null}
              {req.admin_note ? <Text style={styles.meta}>Note: {req.admin_note}</Text> : null}
              <TouchableOpacity
                onPress={() => {
                  const next = expanded ? null : req.id;
                  setExpandedConciergeId(next);
                  if (next && !conciergeMatchGames[req.id]) {
                    setLoadingConciergeGamesId(req.id);
                    void searchConciergeMatchGames(req.sport, 8)
                      .then((rows) => {
                        setConciergeMatchGames((prev) => ({ ...prev, [req.id]: rows }));
                      })
                      .catch(() => {
                        setConciergeMatchGames((prev) => ({ ...prev, [req.id]: [] }));
                      })
                      .finally(() => setLoadingConciergeGamesId(null));
                  }
                }}
              >
                <Text style={styles.link}>
                  {expanded ? 'Hide match games' : 'Show open games to match'}
                </Text>
              </TouchableOpacity>
              {expanded ? (
                loadingConciergeGamesId === req.id ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : matchGames.length === 0 ? (
                  <Text style={styles.meta}>No open {req.sport} games in the next 14 days.</Text>
                ) : (
                  matchGames.map((game) => (
                    <TouchableOpacity
                      key={game.id}
                      style={styles.matchGameRow}
                      disabled={busy}
                      onPress={() => {
                        Alert.alert(
                          'Match to this game?',
                          `@${game.host_username} · ${formatReportTime(game.start_time)}${
                            game.location_name ? ` · ${game.location_name}` : ''
                          }`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Match',
                              onPress: () => {
                                setBusyConciergeId(req.id);
                                void (async () => {
                                  try {
                                    await updateConciergeRequest(
                                      req.id,
                                      'matched',
                                      `Matched to @${game.host_username}`,
                                      game.id
                                    );
                                    setExpandedConciergeId(null);
                                    await load();
                                  } catch (e: unknown) {
                                    Alert.alert(
                                      'Error',
                                      e instanceof Error ? e.message : 'Update failed.'
                                    );
                                  } finally {
                                    setBusyConciergeId(null);
                                  }
                                })();
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.detail}>
                        @{game.host_username} · {formatReportTime(game.start_time)} ·{' '}
                        {game.open_spots} open
                      </Text>
                      {game.location_name ? (
                        <Text style={styles.meta}>{game.location_name}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))
                )
              ) : null}
              <View style={styles.linkRow}>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => {
                    setBusyConciergeId(req.id);
                    void (async () => {
                      try {
                        await updateConciergeRequest(req.id, 'matched');
                        await load();
                      } catch (e: unknown) {
                        Alert.alert('Error', e instanceof Error ? e.message : 'Update failed.');
                      } finally {
                        setBusyConciergeId(null);
                      }
                    })();
                  }}
                >
                  <Text style={styles.link}>{busy ? '…' : 'Mark matched (no game)'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => {
                    setBusyConciergeId(req.id);
                    void (async () => {
                      try {
                        await updateConciergeRequest(req.id, 'closed');
                        await load();
                      } catch (e: unknown) {
                        Alert.alert('Error', e instanceof Error ? e.message : 'Update failed.');
                      } finally {
                        setBusyConciergeId(null);
                      }
                    })();
                  }}
                >
                  <Text style={styles.linkMuted}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Captain feedback ({captainFeedback.length})</Text>
      {captainFeedback.length === 0 ? (
        <Text style={styles.empty}>No captain feedback yet.</Text>
      ) : (
        captainFeedback.map((row) => (
          <View key={row.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              @{row.username} · {row.sport} · friction {row.friction_score}/5
            </Text>
            <Text style={styles.meta}>
              {row.feature_area} · {formatReportTime(row.created_at)}
            </Text>
            <Text style={styles.detail}>{row.note}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>User feedback ({feedback.length})</Text>
      {feedback.length === 0 ? (
        <Text style={styles.empty}>No feedback yet.</Text>
      ) : (
        feedback.map((row) => (
          <View key={row.id} style={styles.card}>
            <Text style={styles.cardTitle}>@{row.username}</Text>
            <Text style={styles.meta}>
              {formatReportTime(row.created_at)}
              {row.screen ? ` · ${row.screen}` : ''}
            </Text>
            <Text style={styles.detail}>{row.body}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Pending reports ({reports.length})</Text>
      {loading && reports.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
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
        </>
      ) : null}
    </ScrollView>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
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
  matchGameRow: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
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
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secondaryBtnText: { color: colors.primary, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  loader: { marginVertical: 24 },
  empty: { color: '#666', marginBottom: 8 },
  approveCaptainBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  approveCaptainText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
  link: { color: colors.primary, fontWeight: '600' },
  linkMuted: { color: '#666', fontWeight: '600' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tabBtnText: { fontWeight: '600', color: '#666' },
  tabBtnTextActive: { color: colors.primary },
  metricCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  metricLabel: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  metricValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  metricHint: { width: '100%', fontSize: 11, color: '#888', marginTop: 4 },
});

export default AdminScreen;

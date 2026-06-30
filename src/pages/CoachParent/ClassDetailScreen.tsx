import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getClassRoster,
  getCoachClass,
  userIsCoach,
} from '../../services/coachParentService';
import {
  ensureClassInvite,
  listClassRosterFromDb,
  markEnrollmentAttendance,
  shareClassEnrollmentInvite,
} from '../../services/studentEnrollmentService';
import {
  applySessionStateToListing,
  cancelCoachClassSession,
  deferCoachClassSession,
  listCoachSentAnnouncements,
  listParentAnnouncementsForClass,
  sendClassAnnouncement,
  sessionStatusLabel,
} from '../../services/classCoachOperationsService';
import { ClassOperationsSheet } from '../../components/coachParent/ClassOperationsSheet';
import { ClassAnnouncementInboxItem, ClassDetailTab, ClassRosterStudent, CoachClassListing } from '../../types/coachParent';
import { colors, PRIMARY_COLOR, spacing } from '../../constants/theme';
import { formatActivityTime } from '../../utils/activityHelpers';
import { COACH_MINOR_ROSTER, PARENT_PILOT_ENROLLMENT } from '../../constants/parentStudentFlags';
import { COACH_CLASS_OPERATIONS } from '../../constants/coachOpsFlags';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClassDetail'>;

const TABS: { id: ClassDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'roster', label: 'Roster' },
  { id: 'chat', label: 'Chat' },
];

const STATUS_LABEL: Record<ClassRosterStudent['status'], string> = {
  confirmed: 'Confirmed',
  not_responded: 'Not responded',
  cant_make_it: "Can't make it",
};

const ClassDetailScreen: React.FC<Props> = ({ route }) => {
  const { user } = useAuth();
  const { classId, initialTab = 'overview' } = route.params;
  const [tab, setTab] = useState<ClassDetailTab>(initialTab);
  const [listing, setListing] = useState<CoachClassListing | null>(null);
  const [roster, setRoster] = useState<ClassRosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [opsVisible, setOpsVisible] = useState(false);
  const [opsLoading, setOpsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<ClassAnnouncementInboxItem[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [sending, setSending] = useState(false);
  const isCoach = userIsCoach(user);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, rosterRows] = await Promise.all([
        getCoachClass(classId),
        PARENT_PILOT_ENROLLMENT && isCoach
          ? listClassRosterFromDb(user?.id ?? '', classId)
          : getClassRoster(classId),
      ]);
      setListing(cls);
      if (PARENT_PILOT_ENROLLMENT && isCoach && rosterRows.length === 0) {
        setRoster(await getClassRoster(classId));
      } else {
        setRoster(rosterRows);
      }
    } finally {
      setLoading(false);
    }
  }, [classId, isCoach, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const loadAnnouncements = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setLoadingAnnouncements(true);
    try {
      const rows = isCoach
        ? await listCoachSentAnnouncements(classId, user.id)
        : await listParentAnnouncementsForClass(user.id, classId);
      setAnnouncements(rows);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [classId, isCoach, user?.id]);

  useEffect(() => {
    if (tab === 'chat') {
      void loadAnnouncements();
    }
  }, [tab, loadAnnouncements]);

  const handleSendAnnouncement = async () => {
    if (!user?.id || !composeText.trim()) {
      return;
    }
    setSending(true);
    try {
      await sendClassAnnouncement(classId, user.id, composeText.trim());
      setComposeText('');
      await loadAnnouncements();
    } catch (err) {
      Alert.alert('Could not send', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSending(false);
    }
  };

  const groupedRoster = useMemo(() => {
    const groups: Record<ClassRosterStudent['status'], ClassRosterStudent[]> = {
      confirmed: [],
      not_responded: [],
      cant_make_it: [],
    };
    for (const student of roster) {
      groups[student.status].push(student);
    }
    return groups;
  }, [roster]);

  const handleShareInvite = async () => {
    if (!listing || !user?.id) {
      return;
    }
    setSharing(true);
    try {
      const invite = await ensureClassInvite(
        user.id,
        listing.id,
        listing.title,
        listing.sport_type
      );
      await shareClassEnrollmentInvite(invite);
    } catch (err) {
      Alert.alert(
        'Share failed',
        err instanceof Error ? err.message : 'Could not create parent invite.'
      );
    } finally {
      setSharing(false);
    }
  };

  const handleAttendance = async (student: ClassRosterStudent, status: 'present' | 'absent') => {
    if (!user?.id || !student.enrollment_id) {
      return;
    }
    try {
      await markEnrollmentAttendance(user.id, student.enrollment_id, status);
      setRoster((rows) =>
        rows.map((row) =>
          row.id === student.id ? { ...row, attendance_status: status } : row
        )
      );
    } catch (err) {
      Alert.alert(
        'Attendance failed',
        err instanceof Error ? err.message : 'Could not save attendance.'
      );
    }
  };

  const runOperation = async (kind: 'defer' | 'cancel', notifyParents: boolean) => {
    if (!listing) {
      return;
    }
    setOpsLoading(true);
    try {
      const state =
        kind === 'defer'
          ? await deferCoachClassSession(listing, notifyParents)
          : await cancelCoachClassSession(listing, notifyParents);
      setListing(applySessionStateToListing(listing, state));
      setOpsVisible(false);
      Alert.alert(
        kind === 'defer' ? 'Session deferred' : 'Session cancelled',
        notifyParents
          ? 'Parents of enrolled students were notified in Inbox → Classes.'
          : 'Session updated. Parents were not notified.'
      );
    } catch (err) {
      Alert.alert(
        'Could not update session',
        err instanceof Error ? err.message : 'Try again.'
      );
    } finally {
      setOpsLoading(false);
    }
  };

  const renderRosterGroup = (label: string, students: ClassRosterStudent[]) => {
    if (students.length === 0) {
      return null;
    }
    const groupKey = label.toLowerCase().replace(/[^a-z]+/g, '-');
    return (
      <View style={styles.group} testID={`roster-group-${groupKey}`}>
        <Text style={styles.groupLabel}>{label}</Text>
        {students.map((student) => (
          <View key={student.id} style={styles.rosterRow} testID={`roster-row-${student.display_name}`}>
            <Text style={styles.rosterName}>{student.display_name}</Text>
            <Text style={styles.rosterStatus}>{STATUS_LABEL[student.status]}</Text>
            {COACH_MINOR_ROSTER && isCoach && student.enrollment_id ? (
              <View style={styles.attendanceRow}>
                <TouchableOpacity
                  testID={`attendance-present-${student.display_name}`}
                  style={[
                    styles.attendanceBtn,
                    student.attendance_status === 'present' && styles.attendanceBtnActive,
                  ]}
                  onPress={() => void handleAttendance(student, 'present')}
                >
                  <Text style={styles.attendanceBtnText}>Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`attendance-absent-${student.display_name}`}
                  style={[
                    styles.attendanceBtn,
                    student.attendance_status === 'absent' && styles.attendanceBtnActive,
                  ]}
                  onPress={() => void handleAttendance(student, 'absent')}
                >
                  <Text style={styles.attendanceBtnText}>Absent</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

  const sessionBanner =
    listing?.session_status && listing.session_status !== 'scheduled' ? (
      <View
        style={[
          styles.statusBanner,
          listing.session_status === 'cancelled' && styles.statusBannerCancelled,
        ]}
        testID={`class-session-status-${listing.session_status}`}
      >
        <Text style={styles.statusBannerText}>
          {sessionStatusLabel(listing.session_status)}
          {listing.session_status === 'deferred' && listing.effective_start_time
            ? ` · ${formatActivityTime(listing.effective_start_time, listing.duration_minutes)}`
            : ''}
        </Text>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((row) => (
          <TouchableOpacity
            key={row.id}
            style={[styles.tab, tab === row.id && styles.tabActive]}
            onPress={() => setTab(row.id)}
          >
            <Text style={[styles.tabText, tab === row.id && styles.tabTextActive]}>
              {row.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={PRIMARY_COLOR} style={styles.loader} />
      ) : tab === 'chat' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          {sessionBanner ? <View style={styles.chatBannerWrap}>{sessionBanner}</View> : null}
          {loadingAnnouncements ? (
            <ActivityIndicator color={PRIMARY_COLOR} style={styles.loader} />
          ) : (
            <FlatList
              data={announcements}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
              ListEmptyComponent={
                <Text style={styles.chatEmpty} testID="class-chat-empty">
                  No announcements yet.
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.announcementRow}>
                  {item.operation && item.operation !== 'notify' ? (
                    <Text style={styles.operationBadge}>
                      {item.operation === 'defer' ? 'Session deferred' : 'Session cancelled'}
                    </Text>
                  ) : null}
                  <Text style={styles.announcementText}>{item.preview}</Text>
                  <Text style={styles.announcementTime}>
                    {new Date(item.sent_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            />
          )}
          {isCoach && COACH_CLASS_OPERATIONS ? (
            <View style={styles.composeRow}>
              <TextInput
                style={styles.composeInput}
                value={composeText}
                onChangeText={setComposeText}
                placeholder="Message all parents…"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
                testID="class-chat-compose"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (sending || !composeText.trim()) && styles.sendBtnDisabled]}
                onPress={() => void handleSendAnnouncement()}
                disabled={sending || !composeText.trim()}
                testID="class-chat-send"
              >
                <Text style={styles.sendBtnText}>{sending ? '…' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {sessionBanner}
          {tab === 'overview' && listing ? (
            <>
              <Text style={styles.line}>{listing.title}</Text>
              <Text style={styles.line}>{listing.sport_type}</Text>
              <Text style={styles.line}>{listing.location_name}</Text>
              <Text style={styles.line} testID="class-session-time">
                {formatActivityTime(listing.start_time, listing.duration_minutes)}
              </Text>
              {listing.fee_note ? <Text style={styles.note}>{listing.fee_note}</Text> : null}
              {COACH_CLASS_OPERATIONS && isCoach ? (
                <TouchableOpacity
                  style={styles.opsBtn}
                  testID="coach-manage-session"
                  onPress={() => setOpsVisible(true)}
                >
                  <Text style={styles.opsBtnText}>Manage session</Text>
                </TouchableOpacity>
              ) : null}
              {PARENT_PILOT_ENROLLMENT && isCoach ? (
                <TouchableOpacity
                  style={styles.shareBtn}
                  testID="coach-share-parent-invite"
                  disabled={sharing}
                  onPress={() => void handleShareInvite()}
                >
                  <Text style={styles.shareBtnText}>
                    {sharing ? 'Preparing invite…' : 'Share parent enrollment invite'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
          {tab === 'schedule' && listing ? (
            <Text style={styles.line}>
              Weekly · {formatActivityTime(listing.start_time, listing.duration_minutes)}
            </Text>
          ) : null}
          {tab === 'roster' ? (
            roster.length === 0 ? (
              <View style={styles.emptyRoster}>
                <Text style={styles.line} testID="coach-roster-empty">
                  No students enrolled yet.
                </Text>
                {isCoach && PARENT_PILOT_ENROLLMENT ? (
                  <TouchableOpacity
                    style={styles.shareBtn}
                    testID="coach-roster-share-invite"
                    disabled={sharing}
                    onPress={() => void handleShareInvite()}
                  >
                    <Text style={styles.shareBtnText}>Share parent invite</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <>
                {renderRosterGroup('Confirmed', groupedRoster.confirmed)}
                {renderRosterGroup('Not responded', groupedRoster.not_responded)}
                {renderRosterGroup("Can't make it", groupedRoster.cant_make_it)}
              </>
            )
          ) : null}
        </ScrollView>
      )}
      {listing && COACH_CLASS_OPERATIONS && isCoach ? (
        <ClassOperationsSheet
          visible={opsVisible}
          classTitle={listing.title}
          loading={opsLoading}
          onClose={() => setOpsVisible(false)}
          onDefer={(notify) => void runOperation('defer', notify)}
          onCancel={(notify) => void runOperation('cancel', notify)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.primaryDark },
  content: { padding: spacing.lg },
  line: { fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  note: { color: colors.textSecondary, marginTop: spacing.sm },
  statusBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusBannerCancelled: {
    backgroundColor: colors.warningSoft ?? '#FFF4E5',
  },
  statusBannerText: {
    fontWeight: '700',
    color: colors.text,
  },
  group: { marginBottom: spacing.lg },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  rosterRow: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rosterName: { fontWeight: '700', color: colors.text },
  rosterStatus: { color: colors.primaryDark, marginTop: 4, fontWeight: '600' },
  attendanceRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  attendanceBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attendanceBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  attendanceBtnText: { fontWeight: '600', color: colors.text },
  loader: { marginTop: spacing.xl },
  opsBtn: {
    marginTop: spacing.lg,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  opsBtnText: { color: colors.text, fontWeight: '700' },
  shareBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { color: colors.surface, fontWeight: '700' },
  emptyRoster: { paddingVertical: spacing.md },
  chatContainer: { flex: 1 },
  chatBannerWrap: { padding: spacing.lg, paddingBottom: 0 },
  chatList: { padding: spacing.lg, flexGrow: 1 },
  chatEmpty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  announcementRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  operationBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  announcementText: { fontSize: 15, color: colors.text, marginBottom: 4 },
  announcementTime: { fontSize: 12, color: colors.textSecondary },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  composeInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: colors.surface, fontWeight: '700', fontSize: 15 },
});

export default ClassDetailScreen;

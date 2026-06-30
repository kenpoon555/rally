import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../../constants/routes';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, spacing, typography } from '../../constants/theme';
import { updateParentEnrollmentResponse } from '../../services/coachParentService';
import { ParentClassEnrollment } from '../../types/coachParent';
import { formatActivityTime } from '../../utils/activityHelpers';

type Props = {
  enrollments: ParentClassEnrollment[];
  parentUserId?: string;
  onRefresh?: () => void | Promise<void>;
};

function sessionBlocksResponse(row: ParentClassEnrollment): boolean {
  return row.session_status === 'cancelled' || row.session_status === 'deferred';
}

function responseLabel(
  row: ParentClassEnrollment,
  status: ParentClassEnrollment['response_status']
): string {
  if (row.session_status === 'cancelled') {
    return 'Session cancelled';
  }
  if (row.session_status === 'deferred') {
    return 'Session deferred';
  }
  if (status === 'confirmed') {
    return 'Confirmed';
  }
  if (status === 'cant_make_it') {
    return PRODUCT_COPY.cantMakeIt;
  }
  return 'Not responded';
}

export const TodayMyClassesCard: React.FC<Props> = ({
  enrollments,
  parentUserId,
  onRefresh,
}) => {
  const navigation = useNavigation();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<
    Record<string, ParentClassEnrollment['response_status']>
  >({});

  const statusFor = useCallback(
    (row: ParentClassEnrollment) => localStatus[row.id] ?? row.response_status,
    [localStatus]
  );

  const respond = useCallback(
    async (row: ParentClassEnrollment, status: ParentClassEnrollment['response_status']) => {
      if (!parentUserId || sessionBlocksResponse(row)) {
        return;
      }
      const previous = statusFor(row);
      setLocalStatus((current) => ({ ...current, [row.id]: status }));
      setBusyId(row.id);
      try {
        await updateParentEnrollmentResponse(parentUserId, row.id, status);
        await onRefresh?.();
      } catch {
        setLocalStatus((current) => {
          const next = { ...current };
          if (previous === row.response_status) {
            delete next[row.id];
          } else {
            next[row.id] = previous;
          }
          return next;
        });
        Alert.alert('Could not update', 'Try again in a moment.');
      } finally {
        setBusyId(null);
      }
    },
    [onRefresh, parentUserId, statusFor]
  );

  const openClassDetail = useCallback(
    (row: ParentClassEnrollment, initialTab: 'overview' | 'chat' = 'overview') => {
      navigation.navigate(ROUTES.COACH_PARENT.CLASS_DETAIL, {
        classId: row.class_id,
        initialTab,
      });
    },
    [navigation]
  );

  const rows = useMemo(() => enrollments, [enrollments]);

  if (rows.length === 0) {
    return (
      <View style={styles.card} testID="today-my-classes-empty">
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.empty}>No upcoming classes for your children.</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(ROUTES.COACH_PARENT.FAMILY_PROFILES)
          }
        >
          <Text style={styles.link}>Manage classes for your child →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="today-my-classes-card">
      <Text style={styles.title}>My Classes</Text>
      {rows.map((row) => {
        const status = statusFor(row);
        const busy = busyId === row.id;
        const deadSession = sessionBlocksResponse(row);
        const showBothActions = !deadSession && status === 'not_responded';
        const showConfirmOnly = !deadSession && status === 'cant_make_it';
        const showCantMakeItOnly = !deadSession && status === 'confirmed';

        return (
          <View key={row.id} style={styles.row} testID={`today-class-row-${row.id}`}>
            <TouchableOpacity
              onPress={() => openClassDetail(row)}
              accessibilityRole="button"
            >
              <Text style={styles.childName}>{row.student_name}</Text>
              <Text style={styles.classLine}>
                {row.class_title} ·{' '}
                {formatActivityTime(row.effective_start_time ?? row.start_time, 90)}
              </Text>
              <Text style={styles.status} testID={`today-class-status-${row.id}`}>
                {responseLabel(row, status)}
              </Text>
            </TouchableOpacity>

            {showBothActions ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.primaryBtn, busy && styles.btnDisabled]}
                  disabled={busy || !parentUserId}
                  testID={`today-class-confirm-${row.id}`}
                  onPress={() => void respond(row, 'confirmed')}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{PRODUCT_COPY.confirmAttendance}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryBtn, busy && styles.btnDisabled]}
                  disabled={busy || !parentUserId}
                  testID={`today-class-cant-make-it-${row.id}`}
                  onPress={() => void respond(row, 'cant_make_it')}
                >
                  <Text style={styles.secondaryBtnText}>{PRODUCT_COPY.cantMakeIt}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {showConfirmOnly ? (
              <TouchableOpacity
                style={[styles.primaryBtn, styles.singleAction, busy && styles.btnDisabled]}
                disabled={busy || !parentUserId}
                testID={`today-class-confirm-${row.id}`}
                onPress={() => void respond(row, 'confirmed')}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>{PRODUCT_COPY.confirmAttendance}</Text>
                )}
              </TouchableOpacity>
            ) : null}

            {showCantMakeItOnly ? (
              <TouchableOpacity
                style={[styles.secondaryBtn, styles.singleAction, busy && styles.btnDisabled]}
                disabled={busy || !parentUserId}
                testID={`today-class-cant-make-it-${row.id}`}
                onPress={() => void respond(row, 'cant_make_it')}
              >
                <Text style={styles.secondaryBtnText}>{PRODUCT_COPY.cantMakeIt}</Text>
              </TouchableOpacity>
            ) : null}

            {!deadSession ? (
              <TouchableOpacity
                style={styles.messageCoachBtn}
                testID={`today-class-message-coach-${row.id}`}
                onPress={() => openClassDetail(row, 'chat')}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.messageCoachText}>{PRODUCT_COPY.messageCoach}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  childName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  classLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  status: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  primaryBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  secondaryBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  singleAction: {
    alignSelf: 'stretch',
  },
  messageCoachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  messageCoachText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

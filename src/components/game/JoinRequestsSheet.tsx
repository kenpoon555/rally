import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JoinRequest } from '../../types/activity';
import { Avatar, KeyboardSafeView } from '../ui';
import { PlayerTrustLine } from '../PlayerTrustLine';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  requests: JoinRequest[];
  loading?: boolean;
  gameLabel?: string;
  onClose: () => void;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onOpenProfile?: (user: { id: string; username: string; profile_photo_url?: string }) => void;
};

export function JoinRequestsSheet({
  visible,
  requests,
  loading = false,
  gameLabel,
  onClose,
  onApprove,
  onReject,
  onOpenProfile,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await onApprove(requestId);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await onReject(requestId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardSafeView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Join requests</Text>
            {gameLabel ? <Text style={styles.subtitle}>{gameLabel}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyBody}>New requests will show up here and on Who&apos;s going.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            <Text style={styles.listHint}>
              {requests.length === 1
                ? '1 player wants in — approve to add them to the roster.'
                : `${requests.length} players want in — approve to add them to the roster.`}
            </Text>
            {requests.map((request) => {
              const username = request.user?.username ?? 'Player';
              const busy = busyId === request.id;
              return (
                <View key={request.id} style={styles.card}>
                  <TouchableOpacity
                    style={styles.playerRow}
                    disabled={!request.user || busy}
                    onPress={() => request.user && onOpenProfile?.(request.user)}
                  >
                    <Avatar name={username} size="md" />
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{username}</Text>
                      {request.user ? <PlayerTrustLine userId={request.user.id} /> : null}
                      <Text style={styles.requestedAt}>
                        Requested{' '}
                        {new Date(request.requested_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.declineBtn, busy && styles.btnDisabled]}
                      onPress={() => void handleReject(request.id)}
                      disabled={busy}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, busy && styles.btnDisabled]}
                      onPress={() => void handleApprove(request.id)}
                      disabled={busy}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                      ) : (
                        <Text style={styles.approveText}>Approve</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  listHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  playerName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  requestedAt: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

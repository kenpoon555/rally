import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SportIconForSurface } from '../SportIconForSurface';
import { RallyFriendInvite } from '../../types/rallyInvite';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  invite: RallyFriendInvite;
  busy?: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export const RallyInviteCard: React.FC<Props> = ({ invite, busy, onAccept, onDecline }) => (
  <View style={styles.card}>
    <SportIconForSurface sport={invite.sport_type} surface="rallyInviteCard" />
    <View style={styles.body}>
      <Text style={styles.eyebrow}>Rally invite</Text>
      <Text style={styles.title} numberOfLines={2}>
        {invite.group_name}
      </Text>
      <Text style={styles.meta}>
        @{invite.inviter_username} invited you · {invite.sport_type}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline} disabled={busy}>
          <Text style={styles.declineText}>Not now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} disabled={busy}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.acceptText}>Join Rally</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 2,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 17,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

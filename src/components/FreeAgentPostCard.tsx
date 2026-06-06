import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FreeAgentPost, SuggestedFreeAgent } from '../types/freeAgent';
import {
  formatAvailabilityLabel,
  formatSkillLabel,
} from '../services/freeAgentService';
import { colors, radius, spacing, typography } from '../constants/theme';
import { SportBadge } from './SportBadge';

type Props = {
  post: FreeAgentPost | SuggestedFreeAgent;
  onInvite?: () => void;
  inviting?: boolean;
  showInvite?: boolean;
};

export const FreeAgentPostCard: React.FC<Props> = ({
  post,
  onInvite,
  inviting = false,
  showInvite = false,
}) => {
  const preset = post.availability?.preset ?? 'flexible';
  const invitePending = 'invite_pending' in post && post.invite_pending;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <SportBadge sport={post.sport} />
        {post.is_captain ? (
          <View style={styles.captainBadge}>
            <Text style={styles.captainBadgeText}>Captain</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>@{post.username} is available</Text>
      <Text style={styles.meta}>
        {formatSkillLabel(post.skill_level)} · {formatAvailabilityLabel(preset)}
      </Text>
      {post.note || post.availability?.note ? (
        <Text style={styles.note}>{post.note || post.availability?.note}</Text>
      ) : null}
      <Text style={styles.expires}>
        Listed until {new Date(post.expires_at).toLocaleDateString()}
      </Text>
      {showInvite && onInvite ? (
        <TouchableOpacity
          style={[styles.inviteBtn, (invitePending || inviting) && styles.inviteBtnMuted]}
          onPress={onInvite}
          disabled={invitePending || inviting}
        >
          <Text style={styles.inviteBtnText}>
            {invitePending ? 'Invite sent' : inviting ? 'Inviting…' : 'Invite to game'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  captainBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  captainBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  note: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  expires: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  inviteBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  inviteBtnMuted: {
    backgroundColor: colors.border,
  },
  inviteBtnText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});

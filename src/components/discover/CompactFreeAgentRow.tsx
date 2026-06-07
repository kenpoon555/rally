import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FreeAgentPost } from '../../types/freeAgent';
import { formatAvailabilityLabel } from '../../services/freeAgentService';
import { Avatar } from '../ui/Avatar';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

type Props = {
  post: FreeAgentPost;
  onInvite?: () => void;
  inviting?: boolean;
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) {
    return 'Just now';
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function availabilityHint(preset: FreeAgentPost['availability']['preset']): string {
  switch (preset) {
    case 'weeknights':
      return 'Free weeknights';
    case 'weekends':
      return 'Free weekends';
    default:
      return 'Free to play';
  }
}

export const CompactFreeAgentRow: React.FC<Props> = ({ post, onInvite, inviting = false }) => {
  const preset = post.availability?.preset ?? 'flexible';
  const area = post.city || 'LA';

  return (
    <View style={styles.card}>
      <Avatar name={post.username} size="md" style={styles.avatar} />
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          @{post.username} · {post.sport}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {availabilityHint(preset)} · {area} · {formatRelativeTime(post.created_at)}
        </Text>
        {post.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {post.note}
          </Text>
        ) : (
          <Text style={styles.note} numberOfLines={1}>
            {formatAvailabilityLabel(preset)}
          </Text>
        )}
      </View>
      {onInvite ? (
        <TouchableOpacity
          style={[styles.inviteBtn, inviting && styles.inviteBtnBusy]}
          onPress={onInvite}
          disabled={inviting}
        >
          <Text style={styles.inviteText}>{inviting ? '…' : 'Invite'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  avatar: {
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  note: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },
  inviteBtnBusy: {
    opacity: 0.6,
  },
  inviteText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});

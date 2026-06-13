import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GameParticipantAvatar } from '../../utils/activityHelpers';
import { colors, spacing, typography } from '../../constants/theme';
import { MemberAvatarItem, MemberAvatarStack } from '../ui/MemberAvatarStack';

type Props = {
  /** @deprecated Use rosterItems */
  names?: string[];
  rosterItems?: GameParticipantAvatar[];
  totalCount?: number;
  /** @deprecated Use pendingItems */
  pendingNames?: string[];
  pendingItems?: GameParticipantAvatar[];
  pendingCount?: number;
  maxVisible?: number;
  readySummary?: string;
  compact?: boolean;
  onPress?: () => void;
  onPendingPress?: () => void;
  onPlayerPress?: (player: GameParticipantAvatar) => void;
  style?: ViewStyle;
};

function toMemberItems(players: GameParticipantAvatar[]): MemberAvatarItem[] {
  return players.map((player) => ({
    key: player.key,
    username: player.username,
    userId: player.userId,
    isPending: player.isPending,
  }));
}

/** Horizontal "Who's going" row — shared across game card variants. */
export function GameCardWhoGoing({
  names,
  rosterItems,
  totalCount,
  pendingNames = [],
  pendingItems = [],
  pendingCount = 0,
  maxVisible = 5,
  readySummary,
  compact = false,
  onPress,
  onPendingPress,
  onPlayerPress,
  style,
}: Props) {
  const roster =
    rosterItems ??
    (names ?? []).map((username, index) => ({
      key: `name-${username}-${index}`,
      username,
    }));
  const pending =
    pendingItems.length > 0
      ? pendingItems
      : pendingNames.map((username, index) => ({
          key: `pending-${username}-${index}`,
          username,
          isPending: true,
        }));

  const total = totalCount ?? roster.length;
  const hasPending = pendingCount > 0;
  if (total === 0 && !hasPending) {
    return null;
  }

  const stackSize = compact ? 'sm' : 'md';
  const pendingHint =
    hasPending && onPendingPress
      ? `${pendingCount} want to join · tap ! to review`
      : hasPending
        ? `${pendingCount} waiting for approval`
        : undefined;

  const handleItemPress = onPlayerPress
    ? (item: MemberAvatarItem) => {
        const match =
          roster.find((player) => player.key === item.key) ??
          pending.find((player) => player.key === item.key);
        if (match) {
          onPlayerPress(match);
        }
      }
    : undefined;

  const body = (
    <View style={[styles.block, compact && styles.blockCompact, style]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, compact && styles.labelCompact]}>Who&apos;s going</Text>
        <View style={styles.headerRight}>
          {hasPending && onPendingPress ? (
            <Pressable
              style={styles.alertBadge}
              onPress={(event) => {
                event.stopPropagation?.();
                onPendingPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${pendingCount} join requests to review`}
              hitSlop={8}
            >
              <Text style={styles.alertBadgeText}>!</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.count, compact && styles.countCompact]}>{total}</Text>
          {onPress ? (
            <Ionicons
              name="chevron-forward"
              size={compact ? 14 : 16}
              color={colors.textTertiary}
            />
          ) : null}
        </View>
      </View>
      <MemberAvatarStack
        rosterItems={toMemberItems(roster)}
        pendingItems={toMemberItems(pending)}
        totalCount={total}
        maxVisible={maxVisible}
        size={stackSize}
        variant="ring"
        overlapping={false}
        onItemPress={handleItemPress}
      />
      {pendingHint ? (
        <Text style={[styles.pendingHint, compact && styles.readySummaryCompact]}>{pendingHint}</Text>
      ) : null}
      {readySummary ? (
        <Text style={[styles.readySummary, compact && styles.readySummaryCompact]}>
          {readySummary}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {body}
      </Pressable>
    );
  }

  return body;
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  blockCompact: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.text,
    textTransform: 'uppercase',
  },
  labelCompact: {
    fontSize: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  alertBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 15,
    marginTop: -1,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  countCompact: {
    fontSize: 13,
  },
  pendingHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    lineHeight: 16,
  },
  readySummary: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  readySummaryCompact: {
    fontSize: 11,
  },
});

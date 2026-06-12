import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AVATAR_PALETTE, colors, spacing } from '../../constants/theme';

const SIZES = {
  sm: { size: 28, fontSize: 11, overflowPad: 6 },
  md: { size: 40, fontSize: 14, overflowPad: 8 },
} as const;

type StackSize = keyof typeof SIZES;

export type MemberAvatarItem = {
  key: string;
  username: string;
  userId?: string;
  isPending?: boolean;
};

type Props = {
  /** @deprecated Prefer `rosterItems`. */
  names?: string[];
  rosterItems?: MemberAvatarItem[];
  /** @deprecated Prefer `pendingItems`. */
  pendingNames?: string[];
  pendingItems?: MemberAvatarItem[];
  totalCount?: number;
  maxVisible?: number;
  size?: StackSize;
  variant?: 'default' | 'ring';
  overlapping?: boolean;
  onItemPress?: (item: MemberAvatarItem) => void;
  style?: ViewStyle;
};

function initial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.replace(/^@/, '').slice(0, 1).toUpperCase();
}

function avatarColor(name: string): string {
  const key = initial(name);
  return AVATAR_PALETTE[key.charCodeAt(0) % AVATAR_PALETTE.length];
}

function resolveRosterItems(props: Props): MemberAvatarItem[] {
  if (props.rosterItems?.length) {
    return props.rosterItems;
  }
  return (props.names ?? []).map((username, index) => ({
    key: `roster-${username}-${index}`,
    username,
  }));
}

function resolvePendingItems(props: Props): MemberAvatarItem[] {
  if (props.pendingItems?.length) {
    return props.pendingItems;
  }
  return (props.pendingNames ?? [])
    .filter(Boolean)
    .map((username, index) => ({
      key: `pending-${username}-${index}`,
      username,
      isPending: true,
    }));
}

function AvatarBubble({
  item,
  metrics,
  ringBorder,
  pending,
  overlapping,
  isFirst,
  onPress,
}: {
  item: MemberAvatarItem;
  metrics: (typeof SIZES)[StackSize];
  ringBorder: boolean;
  pending: boolean;
  overlapping: boolean;
  isFirst: boolean;
  onPress?: (item: MemberAvatarItem) => void;
}) {
  const borderColor = pending ? colors.accent : ringBorder ? colors.primary : colors.surface;
  const canPress = Boolean(onPress && item.userId);

  const bubble = (
    <View
      style={[
        styles.avatar,
        pending && styles.pendingAvatar,
        {
          width: metrics.size,
          height: metrics.size,
          borderRadius: metrics.size / 2,
          marginLeft: overlapping && !isFirst ? -metrics.size * 0.28 : 0,
          backgroundColor: avatarColor(item.username),
          borderColor,
          opacity: pending ? 0.95 : 1,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: metrics.fontSize }]}>{initial(item.username)}</Text>
    </View>
  );

  if (!canPress) {
    return bubble;
  }

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.username}'s profile`}
      style={({ pressed }) => pressed && styles.avatarPressed}
    >
      {bubble}
    </Pressable>
  );
}

/** Initials avatars in a row — spread (default) or overlapping stack. */
export function MemberAvatarStack(props: Props) {
  const {
    totalCount,
    maxVisible = 4,
    size = 'sm',
    variant = 'default',
    overlapping = false,
    onItemPress,
    style,
  } = props;

  const roster = resolveRosterItems(props);
  const pending = resolvePendingItems(props);
  const total = totalCount ?? roster.length;

  if (total === 0 && pending.length === 0) {
    return null;
  }

  const metrics = SIZES[size];
  const ringBorder = variant === 'ring';
  const overflowBorderColor = ringBorder ? colors.primary : colors.surface;

  const visibleRoster = roster.slice(0, maxVisible);
  const overflow = Math.max(total - visibleRoster.length, 0);
  const pendingSlots = Math.max(0, maxVisible - visibleRoster.length - (overflow > 0 ? 1 : 0));
  const visiblePending = pending.slice(0, Math.max(pendingSlots, pending.length > 0 ? 1 : 0));
  const pendingOverflow = Math.max(pending.length - visiblePending.length, 0);

  const gapStyle = overlapping ? undefined : styles.rowSpread;

  const content = (
    <>
      {visibleRoster.map((item, index) => (
        <AvatarBubble
          key={item.key}
          item={item}
          metrics={metrics}
          ringBorder={ringBorder}
          pending={false}
          overlapping={overlapping}
          isFirst={index === 0}
          onPress={onItemPress}
        />
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              minWidth: metrics.size,
              height: metrics.size,
              borderRadius: metrics.size / 2,
              paddingHorizontal: metrics.overflowPad,
              marginLeft: overlapping && visibleRoster.length > 0 ? -metrics.size * 0.28 : 0,
              borderColor: overflowBorderColor,
              backgroundColor: ringBorder ? colors.surface : colors.primaryLight,
            },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: metrics.fontSize - 1 }]}>+{overflow}</Text>
        </View>
      ) : null}
      {visiblePending.map((item, index) => (
        <AvatarBubble
          key={item.key}
          item={item}
          metrics={metrics}
          ringBorder={ringBorder}
          pending
          overlapping={overlapping}
          isFirst={visibleRoster.length === 0 && overflow === 0 && index === 0}
          onPress={onItemPress}
        />
      ))}
      {pendingOverflow > 0 ? (
        <View
          style={[
            styles.overflow,
            styles.pendingOverflow,
            {
              minWidth: metrics.size,
              height: metrics.size,
              borderRadius: metrics.size / 2,
              paddingHorizontal: metrics.overflowPad,
              marginLeft: overlapping ? -metrics.size * 0.28 : 0,
            },
          ]}
        >
          <Text style={[styles.pendingOverflowText, { fontSize: metrics.fontSize - 1 }]}>
            +{pendingOverflow}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (overlapping) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={[styles.row, styles.rowSpread, gapStyle]}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpread: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarPressed: {
    opacity: 0.85,
  },
  avatarText: {
    fontWeight: '800',
    color: colors.textInverse,
  },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  overflowText: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  pendingAvatar: {
    borderColor: colors.accent,
  },
  pendingOverflow: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pendingOverflowText: {
    fontWeight: '800',
    color: colors.text,
  },
});

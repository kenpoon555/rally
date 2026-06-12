import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AVATAR_PALETTE, colors } from '../../constants/theme';
import type { ParticipantReadyState } from '../../utils/activityHelpers';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  name: string;
  size?: Size;
  /** Yellow accent circle — inbox rows, matches SportIcon ring. */
  tone?: 'default' | 'accent';
  /** @deprecated use readyState */
  ready?: boolean;
  readyState?: ParticipantReadyState;
  style?: ViewStyle;
};

const sizes: Record<Size, { box: number; font: number; ring: number; badge: number }> = {
  sm: { box: 32, font: 13, ring: 2, badge: 14 },
  md: { box: 40, font: 15, ring: 2, badge: 16 },
  lg: { box: 52, font: 18, ring: 3, badge: 18 },
};

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}

function resolveReadyState(ready?: boolean, readyState?: ParticipantReadyState): ParticipantReadyState {
  if (readyState && readyState !== 'none') {
    return readyState;
  }
  if (readyState === 'none') {
    return 'none';
  }
  return ready ? 'ready' : 'none';
}

export function Avatar({
  name,
  size = 'md',
  tone = 'default',
  ready = false,
  readyState,
  style,
}: Props) {
  const s = sizes[size];
  const initials = initialsFromName(name);
  const bg =
    tone === 'accent'
      ? colors.accent
      : AVATAR_PALETTE[initials.charCodeAt(0) % AVATAR_PALETTE.length];
  const textColor = tone === 'accent' ? colors.onAccent : colors.textInverse;
  const state = resolveReadyState(ready, readyState);

  return (
    <View style={[styles.outer, style]}>
      <View
        style={[
          styles.wrap,
          {
            width: s.box,
            height: s.box,
            borderRadius: s.box / 2,
            backgroundColor: bg,
            borderWidth: state === 'ready' ? s.ring : 0,
            borderColor: colors.success,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize: s.font, color: textColor }]}>{initials}</Text>
      </View>
      {state === 'ready' ? (
        <View style={[styles.badge, styles.badgeReady, { width: s.badge, height: s.badge, borderRadius: s.badge / 2 }]}>
          <MaterialCommunityIcons name="check" size={s.badge - 4} color={colors.textInverse} />
        </View>
      ) : null}
      {state === 'waiting' ? (
        <View style={[styles.badge, styles.badgeWaiting, { width: s.badge - 2, height: s.badge - 2, borderRadius: (s.badge - 2) / 2 }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    color: colors.textInverse,
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeReady: {
    backgroundColor: colors.success,
  },
  badgeWaiting: {
    backgroundColor: colors.warning,
  },
});

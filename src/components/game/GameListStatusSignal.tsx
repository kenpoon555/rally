import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

const OPEN_DOT = 12;
const LOCK_RING = 36;

type Props = {
  locked?: boolean;
  style?: ViewStyle;
};

/** Play list card leading signal — green dot (open) or soft yellow lock (finalized · welcoming). */
export function GameListStatusSignal({ locked = false, style }: Props) {
  if (locked) {
    return (
      <View style={[styles.lockRing, style]}>
        <Ionicons name="lock-closed" size={16} color={colors.text} />
      </View>
    );
  }

  return <View style={[styles.openDot, style]} />;
}

export const GAME_LIST_SIGNAL_COLUMN = LOCK_RING;

const styles = StyleSheet.create({
  openDot: {
    width: OPEN_DOT,
    height: OPEN_DOT,
    borderRadius: OPEN_DOT / 2,
    backgroundColor: colors.primary,
  },
  lockRing: {
    width: LOCK_RING,
    height: LOCK_RING,
    borderRadius: LOCK_RING / 2,
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

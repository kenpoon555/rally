import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../constants/theme';

const ICON_SOURCE = require('../../assets/branding/icon-1024.png');

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, number> = {
  sm: 40,
  md: 72,
  lg: 96,
};

type Props = {
  size?: Size;
  style?: ViewStyle;
};

/** In-app Rally brand mark (same asset as home-screen icon). */
export function RallyMark({ size = 'md', style }: Props) {
  const box = SIZES[size];
  const imageSize = Math.round(box * 0.88);

  return (
    <View style={[styles.wrap, { width: box, height: box, borderRadius: radius.lg }, style]}>
      <Image
        source={ICON_SOURCE}
        style={{ width: imageSize, height: imageSize, borderRadius: radius.md }}
        resizeMode="cover"
        accessibilityLabel="Rally"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

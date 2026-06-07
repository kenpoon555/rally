import React from 'react';
import { Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';

const MARK_SOURCE = require('../../assets/branding/rally-mark-1024.png');

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, number> = {
  sm: 40,
  md: 72,
  lg: 96,
};

type Props = {
  size?: Size;
  style?: StyleProp<ViewStyle>;
};

/** In-app Rally brand mark — transparent PNG, no background chip. */
export function RallyMark({ size = 'md', style }: Props) {
  const box = SIZES[size];
  const imageStyle: StyleProp<ImageStyle> = [{ width: box, height: box }, style as ImageStyle];

  return (
    <Image
      source={MARK_SOURCE}
      style={imageStyle}
      resizeMode="contain"
      accessibilityLabel="Rally"
    />
  );
}

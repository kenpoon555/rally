import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

const ILLUSTRATION = require('../../../assets/branding/welcome-together-illustration.png');

/** Crop aspect from `concept_neon_welcome.png` illustration-only export. */
const ILLUSTRATION_ASPECT = 370 / 308;
const ILLUSTRATION_WIDTH_RATIO = 0.72;
const MAX_ILLUSTRATION_WIDTH = 340;

/**
 * Onboarding hero — yellow player circles only.
 * Source: top of `concept_neon_welcome.png`, background removed.
 * Width scales with screen; height follows aspect ratio.
 */
export function WelcomeTogetherIllustration() {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(screenWidth * ILLUSTRATION_WIDTH_RATIO, MAX_ILLUSTRATION_WIDTH);
  const height = width / ILLUSTRATION_ASPECT;

  return (
    <View
      style={[styles.wrap, { width, height }]}
      accessibilityLabel="People connecting to play together"
    >
      <Image
        source={ILLUSTRATION}
        style={styles.art}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  art: {
    width: '100%',
    height: '100%',
  },
});

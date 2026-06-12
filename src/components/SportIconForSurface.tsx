import React from 'react';
import { ViewStyle } from 'react-native';
import {
  getSportIconPreset,
  SportIconPreset,
  SportIconSurfaceKey,
} from '../config/sportIconPresets';
import { SportIcon } from './SportIcon';

type Props = {
  sport: string;
  /** Named surface from `sportIconPresets.ts`. Prefer over raw variant/size. */
  surface: SportIconSurfaceKey;
  selected?: boolean;
  style?: ViewStyle;
};

type PresetProps = {
  sport: string;
  preset: SportIconPreset;
  selected?: boolean;
  style?: ViewStyle;
};

/** Render sport icon using a canonical surface or explicit preset — never inline variant on screens. */
export function SportIconForSurface({ sport, surface, selected, style }: Props) {
  const preset = getSportIconPreset(surface);
  return (
    <SportIcon
      sport={sport}
      size={preset.size}
      variant={preset.variant}
      selected={selected}
      style={style}
    />
  );
}

export function SportIconFromPreset({ sport, preset, selected, style }: PresetProps) {
  return (
    <SportIcon
      sport={sport}
      size={preset.size}
      variant={preset.variant}
      selected={selected}
      style={style}
    />
  );
}

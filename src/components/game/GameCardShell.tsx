import React from 'react';
import { Activity } from '../../types/activity';
import {
  GameCardPresetKey,
  gameListVariantFromPreset,
  getGameCardPreset,
  listRowFlagsFromPreset,
  sportIconPresetForGameCardList,
} from '../../config/gameCardLayouts';
import { GameListCard, GameListCardProps } from './GameListCard';

type ListShellProps = {
  presetKey: GameCardPresetKey;
  activity: Activity;
} & Omit<
  GameListCardProps,
  'activity' | 'showWhoGoing' | 'showStatusSignal' | 'sportIconPreset' | 'variant'
> & {
  variant?: GameListCardProps['variant'];
};

/**
 * Config-driven list-row game card. Use preset keys from `gameCardLayouts.ts`.
 */
export const GameCardShell: React.FC<ListShellProps> = ({
  presetKey,
  activity,
  variant,
  ...rest
}) => {
  const preset = getGameCardPreset(presetKey);
  const flags = listRowFlagsFromPreset(preset);

  if (preset.layout !== 'listRow' && preset.layout !== 'homeNextUp') {
    if (__DEV__) {
      console.warn(
        `[GameCardShell] preset "${presetKey}" uses layout "${preset.layout}" — list shell only supports listRow/homeNextUp.`
      );
    }
  }

  return (
    <GameListCard
      activity={activity}
      variant={variant ?? gameListVariantFromPreset(presetKey, activity)}
      showWhoGoing={flags.showWhoGoing}
      showStatusSignal={flags.showStatusSignal}
      sportIconPreset={sportIconPresetForGameCardList(presetKey)}
      {...rest}
    />
  );
};

import {
  getSportIconPreset,
  resolveSportIconPreset,
  SPORT_ICON_SURFACES,
} from '../src/config/sportIconPresets';
import {
  GAME_CARD_PRESETS,
  sportIconPresetForGameCardList,
} from '../src/config/gameCardLayouts';

describe('sportIconPresets', () => {
  it('maps today list to plain md', () => {
    expect(getSportIconPreset('todayGameList')).toEqual({
      variant: 'plain',
      size: 'md',
    });
  });

  it('maps rally session to plain sm', () => {
    expect(getSportIconPreset('rallySessionCard')).toEqual({
      variant: 'plain',
      size: 'sm',
    });
  });

  it('uses plain variant on all surfaces', () => {
    for (const preset of Object.values(SPORT_ICON_SURFACES)) {
      expect(preset.variant).toBe('plain');
    }
  });

  it('returns null for status signal sentinel', () => {
    expect(resolveSportIconPreset('statusSignal')).toBeNull();
  });

  it('links game card presets to icon surfaces', () => {
    expect(sportIconPresetForGameCardList('homeNextUp')).toEqual(
      SPORT_ICON_SURFACES.todayGameList
    );
    expect(sportIconPresetForGameCardList('discoverOpen')).toBeNull();
    expect(GAME_CARD_PRESETS.rallySession.sportIconSurface).toBe('rallySessionCard');
    expect(GAME_CARD_PRESETS.detailPickup.sportIconSurface).toBe('detailHero');
  });
});

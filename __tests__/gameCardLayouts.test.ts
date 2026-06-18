import {
  GAME_CARD_PRESETS,
  detailPresetForActivity,
  discoverPresetKey,
  gameKindFromActivity,
  gameListVariantFromPreset,
  shareModeForViewer,
} from '../src/config/gameCardLayouts';

describe('gameCardLayouts', () => {
  it('maps rally activities to rally kind', () => {
    expect(gameKindFromActivity({ regular_group_id: 'group-1' })).toBe('rally');
    expect(gameKindFromActivity({ regular_group_id: null })).toBe('pickup');
  });

  it('selects detail presets by game kind', () => {
    expect(detailPresetForActivity({ regular_group_id: null }).joinMode).toBe('request');
    expect(detailPresetForActivity({ regular_group_id: 'g1' }).joinMode).toBe('instant');
  });

  it('host gets host share mode on shareable presets', () => {
    expect(
      shareModeForViewer(GAME_CARD_PRESETS.detailPickup, { isHost: true })
    ).toBe('host');
    expect(
      shareModeForViewer(GAME_CARD_PRESETS.detailPickup, { isHost: false })
    ).toBe('public');
  });

  it('keeps rally session preset inline actions enabled', () => {
    expect(GAME_CARD_PRESETS.rallySession.showInlineActions).toBe(true);
    expect(GAME_CARD_PRESETS.rallySession.sessionVariant).toBe('rally');
  });

  it('defines classDiscover preset for Play Classes segment', () => {
    expect(GAME_CARD_PRESETS.classDiscover.layout).toBe('listRow');
    expect(GAME_CARD_PRESETS.classDiscover.joinMode).toBe('request');
  });

  it('maps discover sections to preset keys', () => {
    expect(discoverPresetKey('open')).toBe('discoverOpen');
    expect(discoverPresetKey('locked')).toBe('discoverLockedWelcoming');
  });

  it('derives list variants from preset keys', () => {
    const openActivity = { missing_players: 2, match_status: 'open' } as any;
    expect(gameListVariantFromPreset('discoverOpen', openActivity)).toBe('open');
    expect(gameListVariantFromPreset('discoverLockedWelcoming', openActivity)).toBe(
      'locked_welcoming'
    );
    expect(gameListVariantFromPreset('myGamesRow', openActivity)).toBe('my_game');
  });
});

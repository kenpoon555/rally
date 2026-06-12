import {
  GAME_CARD_PRESETS,
  detailPresetForActivity,
  gameKindFromActivity,
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
});

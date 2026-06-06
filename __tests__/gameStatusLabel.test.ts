import {
  getGameStatusLabel,
  isExpiredUnlockedGame,
  isPostGameActivity,
} from '../src/utils/activityHelpers';

describe('getGameStatusLabel', () => {
  const futureStart = new Date(Date.now() + 86400000).toISOString();
  const pastStart = new Date(Date.now() - 86400000).toISOString();

  it('returns Expired when play window ended even after auto-finalize', () => {
    expect(
      getGameStatusLabel({
        status: 'completed',
        match_status: 'finalized',
        start_time: pastStart,
        duration: 60,
      })
    ).toBe('Expired');
  });

  it('returns Expired for completed unlocked past games', () => {
    const activity = {
      status: 'completed' as const,
      match_status: 'open' as const,
      start_time: pastStart,
      duration: 60,
    };
    expect(getGameStatusLabel(activity)).toBe('Expired');
    expect(isExpiredUnlockedGame(activity)).toBe(true);
    expect(isPostGameActivity(activity)).toBe(true);
  });

  it('returns Finalized for upcoming locked games', () => {
    expect(
      getGameStatusLabel({
        status: 'active',
        match_status: 'finalized',
        start_time: futureStart,
        duration: 60,
      })
    ).toBe('Finalized');
  });

  it('returns Open for active unlocked games', () => {
    expect(
      getGameStatusLabel({
        status: 'active',
        match_status: 'open',
        start_time: futureStart,
        duration: 60,
      })
    ).toBe('Open');
  });
});

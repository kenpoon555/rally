import { canOpenActivityChat } from '../src/services/activityService';
import { Activity } from '../src/types/activity';

const baseActivity = {
  id: 'a1',
  user_id: 'host',
  sport_type: 'Pickleball',
  start_time: new Date().toISOString(),
  duration: 60,
  visibility: 'nearby',
  player_count: 1,
  status: 'active',
  scheduling_mode: 'fixed',
  match_status: 'open',
  created_at: '',
  updated_at: '',
} as Activity;

describe('canOpenActivityChat', () => {
  it('allows chat when finalized', () => {
    expect(canOpenActivityChat({ ...baseActivity, match_status: 'finalized' })).toBe(true);
  });

  it('allows chat for fixed game with 2+ players', () => {
    expect(canOpenActivityChat({ ...baseActivity, player_count: 2 })).toBe(true);
  });

  it('allows host lobby chat before anyone joins', () => {
    expect(canOpenActivityChat(baseActivity, 'host')).toBe(true);
  });

  it('denies chat for solo fixed open game (non-host)', () => {
    expect(canOpenActivityChat(baseActivity)).toBe(false);
  });
});

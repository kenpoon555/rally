import { shouldShowInDiscoverFeed } from '../src/utils/activityHelpers';
import { Activity } from '../src/types/activity';

const baseActivity = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: 'a1',
    user_id: 'host',
    sport_type: 'Pickleball',
    status: 'active',
    match_status: 'open',
    start_time: new Date(Date.now() + 3600000).toISOString(),
    duration: 60,
    join_requests: [],
    ...overrides,
  }) as Activity;

describe('shouldShowInDiscoverFeed', () => {
  it('hides host own games', () => {
    expect(shouldShowInDiscoverFeed(baseActivity(), 'host')).toBe(false);
  });

  it('hides games where viewer is approved', () => {
    const activity = baseActivity({
      join_requests: [{ id: 'j1', user_id: 'player', status: 'approved' } as Activity['join_requests'][0]],
    });
    expect(shouldShowInDiscoverFeed(activity, 'player')).toBe(false);
  });

  it('shows open games for viewers not yet approved', () => {
    const activity = baseActivity({
      join_requests: [{ id: 'j1', user_id: 'player', status: 'pending' } as Activity['join_requests'][0]],
    });
    expect(shouldShowInDiscoverFeed(activity, 'player')).toBe(true);
  });

  it('hides finalized games', () => {
    expect(shouldShowInDiscoverFeed(baseActivity({ match_status: 'finalized' }), 'stranger')).toBe(
      false
    );
  });

  it('hides invite-only games', () => {
    expect(
      shouldShowInDiscoverFeed(baseActivity({ visibility: 'invite_only' }), 'stranger')
    ).toBe(false);
  });
});

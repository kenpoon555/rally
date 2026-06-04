import { needsConfirmPlaying, shouldShowGameRsvp } from '../src/utils/activityHelpers';

describe('shouldShowGameRsvp', () => {
  it('is disabled (RSVP removed from product)', () => {
    expect(
      shouldShowGameRsvp({
        regular_group_id: 'g1',
        series_id: null,
        match_status: 'open',
        status: 'active',
      })
    ).toBe(false);
  });
});

describe('needsConfirmPlaying', () => {
  it('returns true when approved but not ready on crew game', () => {
    expect(
      needsConfirmPlaying(
        {
          regular_group_id: 'g1',
          status: 'active',
          match_status: 'open',
          user_id: 'host',
          join_requests: [
            { user_id: 'u2', status: 'approved', ready_at: null },
          ],
        } as never,
        'u2'
      )
    ).toBe(true);
  });
});

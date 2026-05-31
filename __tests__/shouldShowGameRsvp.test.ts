import { shouldShowGameRsvp } from '../src/utils/activityHelpers';

describe('shouldShowGameRsvp', () => {
  it('always hides RSVP (removed from product)', () => {
    expect(
      shouldShowGameRsvp({
        regular_group_id: 'group-1',
        series_id: 'series-1',
        match_status: 'open',
      })
    ).toBe(false);
    expect(
      shouldShowGameRsvp({
        regular_group_id: null,
        series_id: null,
        match_status: 'open',
      })
    ).toBe(false);
  });
});

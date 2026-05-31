import {
  defaultExpiresAt,
  gameEndMs,
  isActivityListingActive,
  isReviewWindowOpen,
  parseActivityTimestamp,
  REVIEW_DELAY_MS,
} from '../src/utils/activityExpiry';

describe('activityExpiry', () => {
  it('parses PostgREST timestamptz with space separator', () => {
    const ms = parseActivityTimestamp('2026-05-31 03:34:00+00');
    expect(Number.isFinite(ms)).toBe(true);
    expect(new Date(ms).toISOString()).toBe('2026-05-31T03:34:00.000Z');
  });

  it('parses ISO timestamptz', () => {
    const iso = '2026-06-01T18:00:00.000Z';
    expect(parseActivityTimestamp(iso)).toBe(new Date(iso).getTime());
  });

  it('marks listing active when PostgREST expiry is in the future', () => {
    const future = new Date(Date.now() + 3600000);
    const expiresAt = future.toISOString().replace('T', ' ').replace('.000Z', '+00');
    expect(
      isActivityListingActive({
        status: 'active',
        start_time: expiresAt,
        expires_at: expiresAt,
      })
    ).toBe(true);
  });
  it('defaults fixed game expiry to start_time', () => {
    const start = '2026-06-01T18:00:00.000Z';
    expect(
      defaultExpiresAt({ scheduling_mode: 'fixed', start_time: start })
    ).toBe(start);
  });

  it('defaults flex expiry to window_end', () => {
    const start = '2026-06-01T12:00:00.000Z';
    const end = '2026-06-01T18:00:00.000Z';
    expect(
      defaultExpiresAt({ scheduling_mode: 'flex', start_time: start, window_end: end })
    ).toBe(end);
  });

  it('marks past expiry as inactive', () => {
    expect(
      isActivityListingActive({
        status: 'active',
        start_time: '2020-01-01T12:00:00.000Z',
        expires_at: '2020-01-01T12:00:00.000Z',
      })
    ).toBe(false);
  });

  it('marks future expiry as active', () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    expect(
      isActivityListingActive({
        status: 'active',
        start_time: future,
        expires_at: future,
      })
    ).toBe(true);
  });

  it('computes game end from start + duration minutes', () => {
    const start = '2026-06-01T18:00:00.000Z';
    const end = gameEndMs({ start_time: start, duration: 90 });
    expect(end).toBe(new Date('2026-06-01T19:30:00.000Z').getTime());
  });

  it('opens review window only after game end + delay', () => {
    const start = '2020-01-01T12:00:00.000Z';
    expect(isReviewWindowOpen({ status: 'completed', start_time: start, duration: 60 })).toBe(
      true
    );
    const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(
      isReviewWindowOpen({ status: 'completed', start_time: futureStart, duration: 60 })
    ).toBe(false);
    expect(REVIEW_DELAY_MS).toBe(2 * 60 * 60 * 1000);
  });
});

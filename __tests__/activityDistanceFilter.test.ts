import { activityWithinRadius } from '../src/services/activityService';
import type { Activity } from '../src/types/activity';

describe('activityWithinRadius', () => {
  const baseUserLat = 37.7749;
  const baseUserLng = -122.4194;

  const activityAt = (lng: number, lat: number): Pick<Activity, 'location'> => ({
    location: {
      id: 'loc-1',
      name: 'Court',
      sport_type: 'tennis',
      location: { type: 'Point', coordinates: [lng, lat] },
      radius: 50,
      created_at: new Date().toISOString(),
    },
  });

  it('includes activities when coordinates are missing (do not drop unresolved joins)', () => {
    expect(activityWithinRadius({}, baseUserLat, baseUserLng, 5000)).toBe(true);
  });

  it('includes activity inside radius', () => {
    const a = activityAt(baseUserLng, baseUserLat);
    expect(activityWithinRadius(a, baseUserLat, baseUserLng, 5000)).toBe(true);
  });

  it('excludes activity outside radius', () => {
    const farLng = baseUserLng + 2;
    const farLat = baseUserLat + 2;
    const a = activityAt(farLng, farLat);
    expect(activityWithinRadius(a, baseUserLat, baseUserLng, 1000)).toBe(false);
  });
});

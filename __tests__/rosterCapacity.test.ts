import {
  activityHasOpenSpots,
  getActivityOpenSpots,
  getActivityTotalSpots,
} from '../src/utils/activityHelpers';
import { Activity } from '../src/types/activity';

describe('roster capacity helpers', () => {
  const activity: Pick<Activity, 'player_count' | 'missing_players'> = {
    player_count: 3,
    missing_players: 5,
  };

  it('computes open and total spots', () => {
    expect(getActivityOpenSpots(activity)).toBe(5);
    expect(getActivityTotalSpots(activity)).toBe(8);
    expect(activityHasOpenSpots(activity)).toBe(true);
  });

  it('treats zero missing as full', () => {
    expect(activityHasOpenSpots({ missing_players: 0 })).toBe(false);
    expect(getActivityTotalSpots({ player_count: 8, missing_players: 0 })).toBe(8);
  });
});

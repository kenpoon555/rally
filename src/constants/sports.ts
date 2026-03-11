export enum SportType {
  BASKETBALL = 'Basketball',
  TENNIS = 'Tennis',
  BADMINTON = 'Badminton',
  RUNNING = 'Running',
  HIKING = 'Hiking',
}

export const SPORT_TYPES = Object.values(SportType);

export const ACTIVITY_DURATIONS = [30, 60, 90] as const;
export type ActivityDuration = typeof ACTIVITY_DURATIONS[number];

export const ACTIVITY_VISIBILITY = ['friends', 'nearby'] as const;
export type ActivityVisibility = typeof ACTIVITY_VISIBILITY[number];

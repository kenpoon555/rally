import {
  SportType,
  LAUNCH_SPORT_TYPES,
  MVP_DEFAULT_SCHEDULING_MODE,
  getDefaultLaunchSportName,
  getSportMetadata,
  getDefaultOpenSpotsForSport,
  getDefaultTotalPlayersForSport,
  openSpotsFromTotalPlayers,
  totalPlayersFromOpenSpots,
  resolveMatchingProfileForActivity,
  getActivityDetailMatchingCopy,
  resolveUserDefaultSport,
} from '../src/constants/sports';

describe('launch sport config', () => {
  it('launches 10 sports including partner-dependent niches', () => {
    expect(LAUNCH_SPORT_TYPES).toEqual([
      SportType.PICKLEBALL,
      SportType.BASKETBALL,
      SportType.BADMINTON,
      SportType.TENNIS,
      SportType.VOLLEYBALL,
      SportType.SOCCER,
      SportType.SQUASH,
      SportType.RACQUETBALL,
      SportType.TABLE_TENNIS,
      SportType.ULTIMATE,
    ]);
    expect(getDefaultLaunchSportName()).toBe(SportType.PICKLEBALL);
  });

  it('defaults to fixed scheduling for pickleball', () => {
    expect(MVP_DEFAULT_SCHEDULING_MODE).toBe('fixed');
    const meta = getSportMetadata(SportType.PICKLEBALL);
    expect(meta?.defaultSchedulingMode).toBe('fixed');
    expect(meta?.matchingProfile).toBe('fastFixed');
    expect(meta?.launchEnabled).toBe(true);
  });

  it('uses defaultTotalPlayers for typical roster sizes', () => {
    expect(getDefaultTotalPlayersForSport(SportType.VOLLEYBALL)).toBe(12);
    expect(getDefaultOpenSpotsForSport(SportType.VOLLEYBALL)).toBe(11);
    expect(getDefaultTotalPlayersForSport(SportType.BASKETBALL)).toBe(8);
    expect(getDefaultOpenSpotsForSport(SportType.BASKETBALL)).toBe(7);
    expect(getDefaultTotalPlayersForSport(SportType.ULTIMATE)).toBe(14);
  });

  it('converts open spots and total players', () => {
    expect(openSpotsFromTotalPlayers(8)).toBe(7);
    expect(totalPlayersFromOpenSpots(7)).toBe(8);
  });

  it('marks partner-dependent niche sports', () => {
    expect(getSportMetadata(SportType.SQUASH)?.partnerDependent).toBe(true);
    expect(getSportMetadata(SportType.VOLLEYBALL)?.partnerDependent).toBeFalsy();
  });

  it('does not launch running or hiking yet', () => {
    expect(getSportMetadata(SportType.RUNNING)?.launchEnabled).toBe(false);
    expect(getSportMetadata(SportType.HIKING)?.launchEnabled).toBe(false);
  });
});

describe('resolveUserDefaultSport', () => {
  it('uses profile preference when launch-enabled', () => {
    expect(resolveUserDefaultSport('Basketball')).toBe(SportType.BASKETBALL);
    expect(resolveUserDefaultSport('Tennis')).toBe(SportType.TENNIS);
    expect(resolveUserDefaultSport('Squash')).toBe(SportType.SQUASH);
  });

  it('falls back to pickleball when unset or not launch-enabled', () => {
    expect(resolveUserDefaultSport(null)).toBe(SportType.PICKLEBALL);
    expect(resolveUserDefaultSport('Running')).toBe(SportType.PICKLEBALL);
  });
});

describe('sport matching copy helpers', () => {
  it('uses SPORT_METADATA.matchingProfile when sport is known', () => {
    expect(resolveMatchingProfileForActivity(SportType.PICKLEBALL, 'flex')).toBe('fastFixed');
    expect(resolveMatchingProfileForActivity(SportType.TENNIS, 'fixed')).toBe('fastFixed');
    expect(resolveMatchingProfileForActivity(SportType.ULTIMATE, 'fixed')).toBe('groupDiscuss');
    expect(resolveMatchingProfileForActivity(SportType.BASKETBALL, 'flex')).toBe('fastFixed');
  });

  it('falls back for unknown sport_type from scheduling mode', () => {
    expect(resolveMatchingProfileForActivity('UnknownSport', 'flex')).toBe('partnerFlex');
    expect(resolveMatchingProfileForActivity('UnknownSport', 'fixed')).toBe('fastFixed');
  });

  it('returns fastFixed copy for pickleball', () => {
    const copy = getActivityDetailMatchingCopy(SportType.PICKLEBALL, 'fixed');
    expect(copy.statusSchedulingDescriptor).toContain('Fixed');
  });

  it('returns groupDiscuss copy for ultimate', () => {
    const copy = getActivityDetailMatchingCopy(SportType.ULTIMATE, 'fixed');
    expect(copy.statusSchedulingDescriptor).toContain('Group');
  });
});

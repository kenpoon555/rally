import {
  SportType,
  LAUNCH_SPORT_TYPES,
  MVP_DEFAULT_SCHEDULING_MODE,
  getDefaultLaunchSportName,
  getSportMetadata,
  resolveMatchingProfileForActivity,
  getActivityDetailMatchingCopy,
  resolveUserDefaultSport,
} from '../src/constants/sports';

describe('launch sport config', () => {
  it('launches pickleball, basketball, and badminton', () => {
    expect(LAUNCH_SPORT_TYPES).toEqual([
      SportType.PICKLEBALL,
      SportType.BASKETBALL,
      SportType.BADMINTON,
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

  it('launches badminton with fastFixed profile', () => {
    const meta = getSportMetadata(SportType.BADMINTON);
    expect(meta?.launchEnabled).toBe(true);
    expect(meta?.defaultSchedulingMode).toBe('fixed');
    expect(meta?.matchingProfile).toBe('fastFixed');
  });

  it('does not launch tennis', () => {
    expect(getSportMetadata(SportType.TENNIS)?.launchEnabled).toBe(false);
  });

  it('launches basketball with fastFixed profile', () => {
    const meta = getSportMetadata(SportType.BASKETBALL);
    expect(meta?.launchEnabled).toBe(true);
    expect(meta?.defaultSchedulingMode).toBe('fixed');
    expect(meta?.matchingProfile).toBe('fastFixed');
  });
});

describe('resolveUserDefaultSport', () => {
  it('uses profile preference when launch-enabled', () => {
    expect(resolveUserDefaultSport('Basketball')).toBe(SportType.BASKETBALL);
    expect(resolveUserDefaultSport('Badminton')).toBe(SportType.BADMINTON);
  });

  it('falls back to pickleball when unset or invalid', () => {
    expect(resolveUserDefaultSport(null)).toBe(SportType.PICKLEBALL);
    expect(resolveUserDefaultSport('Tennis')).toBe(SportType.PICKLEBALL);
  });
});

describe('sport matching copy helpers', () => {
  it('uses SPORT_METADATA.matchingProfile when sport is known', () => {
    expect(resolveMatchingProfileForActivity(SportType.PICKLEBALL, 'flex')).toBe('fastFixed');
    expect(resolveMatchingProfileForActivity(SportType.TENNIS, 'fixed')).toBe('partnerFlex');
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

  it('returns partnerFlex copy for tennis flex', () => {
    const copy = getActivityDetailMatchingCopy(SportType.TENNIS, 'flex');
    expect(copy.statusSchedulingDescriptor).toContain('Flexible');
    expect(copy.collectingDeadlineLabel).toBe('Preferences close');
  });
});

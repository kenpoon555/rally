import {
  FREE_AGENT_BOARD_SPORTS,
  discoverGamesEmptyTitle,
  freeAgentEmptyCopy,
  isMeetupDiscoverSport,
  playDiscoverSportFilter,
  shouldShowPlayClassesSegment,
  shouldShowInboxClassesFilter,
  sportSupportsFreeAgentBoard,
} from '../src/config/surfaceVisibility';

describe('surfaceVisibility', () => {
  it('playDiscoverSportFilter always returns selected sport', () => {
    expect(playDiscoverSportFilter('Running')).toBe('Running');
    expect(playDiscoverSportFilter('Badminton')).toBe('Badminton');
  });

  it('sportSupportsFreeAgentBoard matches board sports only', () => {
    expect(sportSupportsFreeAgentBoard('Badminton')).toBe(true);
    expect(sportSupportsFreeAgentBoard('Running')).toBe(false);
    expect(FREE_AGENT_BOARD_SPORTS).toEqual(['Badminton', 'Pickleball']);
  });

  it('freeAgentEmptyCopy is sport-specific for non-board sports', () => {
    const running = freeAgentEmptyCopy('Running');
    expect(running.title).toMatch(/running/i);
    expect(running.body).toMatch(/host a game/i);

    const badminton = freeAgentEmptyCopy('Badminton');
    expect(badminton.title).toBe('No players nearby yet');
  });

  it('discoverGamesEmptyTitle uses meetup wording for Running', () => {
    expect(discoverGamesEmptyTitle('Running')).toBe('No Running meetups nearby');
    expect(discoverGamesEmptyTitle('Basketball')).toBe('No Basketball games nearby');
  });

  it('isMeetupDiscoverSport identifies meetup sports', () => {
    expect(isMeetupDiscoverSport('Running')).toBe(true);
    expect(isMeetupDiscoverSport('Basketball')).toBe(false);
  });

  it('shouldShowPlayClassesSegment gates on role not flag alone', () => {
    const flagOn = { classesDiscoverEnabled: true, userId: 'u1' };

    expect(
      shouldShowPlayClassesSegment({
        ...flagOn,
        isCoach: false,
        hasClassContext: false,
      })
    ).toBe(false);

    expect(
      shouldShowPlayClassesSegment({
        ...flagOn,
        isCoach: true,
        hasClassContext: false,
      })
    ).toBe(true);

    expect(
      shouldShowPlayClassesSegment({
        ...flagOn,
        isCoach: false,
        hasClassContext: true,
      })
    ).toBe(true);

    expect(
      shouldShowPlayClassesSegment({
        classesDiscoverEnabled: false,
        userId: 'u1',
        isCoach: true,
        hasClassContext: true,
      })
    ).toBe(false);
  });

  it('shouldShowInboxClassesFilter gates on role not flag alone', () => {
    const flagOn = { classInboxEnabled: true, userId: 'u1' };

    expect(
      shouldShowInboxClassesFilter({
        ...flagOn,
        isCoach: false,
        hasClassContext: false,
      })
    ).toBe(false);

    expect(
      shouldShowInboxClassesFilter({
        ...flagOn,
        isCoach: true,
        hasClassContext: false,
      })
    ).toBe(true);
  });
});

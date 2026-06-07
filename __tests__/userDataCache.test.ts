import {
  fetchCachedMyGames,
  fetchCachedMyRegularGroups,
  getCachedMyGamesSnapshot,
  invalidateUserDataCache,
} from '../src/services/userDataCache';

jest.mock('../src/services/activityService', () => ({
  getMyGames: jest.fn(),
}));

jest.mock('../src/services/regularGroupService', () => ({
  getMyRegularGroups: jest.fn(),
}));

import { getMyGames } from '../src/services/activityService';
import { getMyRegularGroups } from '../src/services/regularGroupService';

const mockedGetMyGames = getMyGames as jest.MockedFunction<typeof getMyGames>;
const mockedGetMyRegularGroups = getMyRegularGroups as jest.MockedFunction<
  typeof getMyRegularGroups
>;

describe('userDataCache', () => {
  beforeEach(() => {
    invalidateUserDataCache();
    jest.clearAllMocks();
    mockedGetMyGames.mockResolvedValue({ active: [], past: [] });
    mockedGetMyRegularGroups.mockResolvedValue([]);
  });

  it('dedupes concurrent fetches for the same user', async () => {
    const userId = 'user-1';
    const [first, second] = await Promise.all([
      fetchCachedMyGames(userId),
      fetchCachedMyGames(userId),
    ]);

    expect(first).toEqual({ active: [], past: [] });
    expect(second).toEqual({ active: [], past: [] });
    expect(mockedGetMyGames).toHaveBeenCalledTimes(1);
  });

  it('returns cached games without refetching within the stale window', async () => {
    const userId = 'user-2';
    await fetchCachedMyGames(userId, true);
    await fetchCachedMyGames(userId, false);

    expect(mockedGetMyGames).toHaveBeenCalledTimes(1);
    expect(getCachedMyGamesSnapshot(userId)).toEqual({ active: [], past: [] });
  });

  it('shares rallies cache across callers', async () => {
    const userId = 'user-3';
    await fetchCachedMyRegularGroups(userId, true);
    await fetchCachedMyRegularGroups(userId, false);

    expect(mockedGetMyRegularGroups).toHaveBeenCalledTimes(1);
  });
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMyGames } from './useActivities';
import { RegularGroup } from '../types/regularGroup';
import { MyGameEntry } from '../services/activityService';
import {
  fetchCachedMyRegularGroups,
  getCachedMyRegularGroupsSnapshot,
} from '../services/userDataCache';

export type UserPlayMode = 'regular' | 'explorer';

export interface UserPlayModeResult {
  /** Regular = has an active game or belongs to a Regulars group; Explorer otherwise. */
  mode: UserPlayMode;
  loading: boolean;
  activeGames: MyGameEntry[];
  regularGroups: RegularGroup[];
  /** Soonest upcoming active game, used for the "Next up" card. */
  nextGame: MyGameEntry | null;
  /** Refetch games + rallies; pass true to bypass the 30s shared cache. */
  refetch: (force?: boolean) => void;
}

/**
 * Classifies the signed-in user as a Regular or Explorer so surfaces like Chats
 * can adapt without changing the tab structure (Phase 2 of the redesign plan).
 */
export function useUserPlayMode(userId?: string): UserPlayModeResult {
  const { games, loading: gamesLoading, refetch: refetchGames } = useMyGames(userId || '');
  const [regularGroups, setRegularGroups] = useState<RegularGroup[]>(
    () => (userId ? getCachedMyRegularGroupsSnapshot(userId) : null) ?? []
  );
  const [groupsLoading, setGroupsLoading] = useState(
    () => Boolean(userId) && !getCachedMyRegularGroupsSnapshot(userId ?? '')
  );

  const loadGroups = useCallback(
    async (force = false) => {
      if (!userId) {
        setRegularGroups([]);
        setGroupsLoading(false);
        return;
      }

      const hasCached = getCachedMyRegularGroupsSnapshot(userId) != null;
      if (!hasCached || force) {
        setGroupsLoading(true);
      }
      try {
        setRegularGroups(await fetchCachedMyRegularGroups(userId, force));
      } catch {
        setRegularGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void loadGroups(false);
  }, [loadGroups]);

  const nextGame = useMemo(() => {
    const withStart = games.active.filter(
      (entry) => entry.role !== 'waitlisted' && entry.activity.start_time
    );
    if (withStart.length === 0) {
      return games.active[0] ?? null;
    }
    return withStart.reduce((soonest, entry) =>
      new Date(entry.activity.start_time as string).getTime() <
      new Date(soonest.activity.start_time as string).getTime()
        ? entry
        : soonest
    );
  }, [games.active]);

  const mode: UserPlayMode =
    games.active.length > 0 || regularGroups.length > 0 ? 'regular' : 'explorer';

  const refetch = useCallback(
    (force = false) => {
      void refetchGames(force);
      void loadGroups(force);
    },
    [refetchGames, loadGroups]
  );

  /** True after the first games+groups fetch cycle completes (success or error). */
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (!gamesLoading && !groupsLoading) {
      setInitialLoadDone(true);
    }
  }, [gamesLoading, groupsLoading]);

  return {
    mode,
    loading: !initialLoadDone && (gamesLoading || groupsLoading),
    activeGames: games.active,
    regularGroups,
    nextGame,
    refetch,
  };
}

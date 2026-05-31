import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMyGames } from './useActivities';
import { getMyRegularGroups } from '../services/regularGroupService';
import { RegularGroup } from '../types/regularGroup';
import { MyGameEntry } from '../services/activityService';

export type UserPlayMode = 'regular' | 'explorer';

export interface UserPlayModeResult {
  /** Regular = has an active game or belongs to a Regulars group; Explorer otherwise. */
  mode: UserPlayMode;
  loading: boolean;
  activeGames: MyGameEntry[];
  regularGroups: RegularGroup[];
  /** Soonest upcoming active game, used for the "Next up" card. */
  nextGame: MyGameEntry | null;
  refetch: () => void;
}

/**
 * Classifies the signed-in user as a Regular or Explorer so surfaces like Chats
 * can adapt without changing the tab structure (Phase 2 of the redesign plan).
 */
export function useUserPlayMode(userId?: string): UserPlayModeResult {
  const { games, loading: gamesLoading, refetch: refetchGames } = useMyGames(userId || '');
  const [regularGroups, setRegularGroups] = useState<RegularGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!userId) {
      setRegularGroups([]);
      return;
    }
    setGroupsLoading(true);
    try {
      setRegularGroups(await getMyRegularGroups(userId));
    } catch {
      setRegularGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const nextGame = useMemo(() => {
    const withStart = games.active.filter((entry) => entry.activity.start_time);
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

  const refetch = useCallback(() => {
    refetchGames();
    void loadGroups();
  }, [refetchGames, loadGroups]);

  return {
    mode,
    loading: gamesLoading || groupsLoading,
    activeGames: games.active,
    regularGroups,
    nextGame,
    refetch,
  };
}

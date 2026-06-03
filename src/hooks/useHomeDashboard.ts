import { useCallback, useEffect, useState } from 'react';
import {
  MyGameEntry,
  getNearbyActivities,
  activityWithinRadius,
} from '../services/activityService';
import { Activity } from '../types/activity';
import { CONFIG } from '../constants/config';
import {
  getHostLockReadiness,
  getApprovedParticipants,
  needsConfirmPlaying,
  countReadyParticipants,
  type HostLockReadiness,
} from '../utils/activityHelpers';

export type HostRosterToLock = {
  entry: MyGameEntry;
  readiness: HostLockReadiness;
  readyCount: number;
  rosterCount: number;
};

export type HomeDashboardData = {
  rosterToLock: HostRosterToLock | null;
  needsCommitmentGames: MyGameEntry[];
  nearbyPublicGames: Activity[];
  hostSummary: {
    hosting: number;
    needsLock: number;
    readyToLock: number;
    upcoming: number;
  };
};

export function useHomeDashboard(
  activeGames: MyGameEntry[],
  userId: string | undefined,
  location: { latitude: number; longitude: number } | null
): HomeDashboardData & { loadingNearby: boolean; refreshNearby: () => void } {
  const [nearbyPublicGames, setNearbyPublicGames] = useState<Activity[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const hostGamesNeedingLock = activeGames.filter(
    (e) =>
      e.role === 'host' &&
      e.activity.match_status !== 'finalized' &&
      e.activity.status === 'active'
  );

  const rosterToLock: HostRosterToLock | null = (() => {
    const entry =
      hostGamesNeedingLock.find(
        (e) => getHostLockReadiness(e.activity) === 'ready'
      ) ?? hostGamesNeedingLock[0];
    if (!entry) {
      return null;
    }
    const approved = getApprovedParticipants(entry.activity);
    const { readyCount, rosterCount } = countReadyParticipants(entry.activity, approved);
    return {
      entry,
      readiness: getHostLockReadiness(entry.activity, approved),
      readyCount,
      rosterCount,
    };
  })();

  const needsCommitmentGames = activeGames.filter(
    (e) => userId && e.activity.regular_group_id && needsConfirmPlaying(e.activity, userId)
  );

  const hostSummary = {
    hosting: activeGames.filter((e) => e.role === 'host').length,
    needsLock: hostGamesNeedingLock.length,
    readyToLock: hostGamesNeedingLock.filter(
      (e) => getHostLockReadiness(e.activity) === 'ready'
    ).length,
    upcoming: activeGames.length,
  };

  const refreshNearby = useCallback(async () => {
    if (!location || !userId) {
      setNearbyPublicGames([]);
      return;
    }
    setLoadingNearby(true);
    try {
      const radius = CONFIG.DISCOVERY_RADIUS_M;
      const list = await getNearbyActivities(
        location.latitude,
        location.longitude,
        radius
      );
      const publicOnly = list
        .filter((a) => !a.regular_group_id && a.visibility === 'nearby')
        .filter((a) => activityWithinRadius(a, location.latitude, location.longitude, radius))
        .slice(0, 3);
      setNearbyPublicGames(publicOnly);
    } catch {
      setNearbyPublicGames([]);
    } finally {
      setLoadingNearby(false);
    }
  }, [location, userId]);

  useEffect(() => {
    void refreshNearby();
  }, [refreshNearby]);

  return {
    rosterToLock,
    needsCommitmentGames,
    nearbyPublicGames,
    hostSummary,
    loadingNearby,
    refreshNearby,
  };
}

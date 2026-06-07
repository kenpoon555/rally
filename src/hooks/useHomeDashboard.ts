import { useCallback, useEffect, useMemo, useState } from 'react';
import { MyGameEntry } from '../services/activityService';
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
  waitlistedGames: MyGameEntry[];
  needsCommitmentGames: MyGameEntry[];
};

export function useHomeDashboard(
  activeGames: MyGameEntry[],
  userId: string | undefined
): HomeDashboardData {
  const hostGamesNeedingLock = useMemo(
    () =>
      activeGames.filter(
        (e) =>
          e.role === 'host' &&
          e.activity.match_status !== 'finalized' &&
          e.activity.status === 'active'
      ),
    [activeGames]
  );

  const rosterToLock: HostRosterToLock | null = useMemo(() => {
    const entry =
      hostGamesNeedingLock.find((e) => getHostLockReadiness(e.activity) === 'ready') ??
      hostGamesNeedingLock[0];
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
  }, [hostGamesNeedingLock]);

  const waitlistedGames = useMemo(
    () =>
      activeGames.filter(
        (e) =>
          e.role === 'waitlisted' &&
          e.activity.status === 'active' &&
          e.activity.match_status !== 'finalized'
      ),
    [activeGames]
  );

  const needsCommitmentGames = useMemo(
    () =>
      activeGames.filter(
        (e) =>
          e.role !== 'waitlisted' &&
          userId &&
          e.activity.regular_group_id &&
          needsConfirmPlaying(e.activity, userId)
      ),
    [activeGames, userId]
  );

  return {
    rosterToLock,
    waitlistedGames,
    needsCommitmentGames,
  };
}

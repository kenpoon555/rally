import { useMemo } from 'react';
import {
  LAUNCH_SPORT_TYPES,
  SPORT_METADATA,
  SPORT_TYPES,
  type MatchingProfile,
  type SportType,
} from '../constants/sports';

export interface SportsCatalogItem {
  id: string;
  name: string;
  matchingProfile: MatchingProfile;
  launchEnabled: boolean;
}

function toCatalogItem(name: SportType): SportsCatalogItem {
  const meta = SPORT_METADATA[name];
  return {
    id: meta.id,
    name: meta.name,
    matchingProfile: meta.matchingProfile,
    launchEnabled: meta.launchEnabled,
  };
}

/**
 * Sports exposed in Discover / Create / geofence modal: launch-enabled only (Phase 1 wedge).
 * Use `allSports` for full enum + metadata (e.g. displaying legacy activities).
 */
export const useSportsCatalog = () => {
  return useMemo(() => {
    const launchSports = LAUNCH_SPORT_TYPES.map(toCatalogItem);
    const allSports = SPORT_TYPES.map(toCatalogItem);
    return {
      sports: launchSports,
      allSports,
    };
  }, []);
};

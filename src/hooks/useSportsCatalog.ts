import { useMemo } from 'react';
import { SPORT_TYPES } from '../constants/sports';

export interface SportsCatalogItem {
  id: string;
  name: string;
}

export const useSportsCatalog = () => {
  const sports = useMemo<SportsCatalogItem[]>(
    () =>
      SPORT_TYPES.map((name) => ({
        id: name.toLowerCase(),
        name,
      })),
    []
  );

  return { sports };
};

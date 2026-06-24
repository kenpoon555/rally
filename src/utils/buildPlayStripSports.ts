import { sortSportsForPlayTab } from '../constants/sports';

export const PLAY_STRIP_SPORT_MAX = 5;
export const PREFERRED_SPORTS_MRU_MAX = 5;

export type SportCatalogItem = { id: string; name: string };

/** Move sport to front of MRU list (stored in `preferred_sports`). */
export function bumpPreferredSportsMru(
  current: string[] | undefined,
  sport: string,
  max = PREFERRED_SPORTS_MRU_MAX
): string[] {
  const prior = (current ?? []).filter(Boolean);
  return [sport, ...prior.filter((name) => name !== sport)].slice(0, max);
}

/** Ordered sport names: selected → MRU → attended → catalog fallback. */
export function buildPersonalizedSportOrder(params: {
  preferredSports: string[];
  attendedSports: string[];
  catalogOrder: string[];
  selectedSport?: string;
}): string[] {
  const { preferredSports, attendedSports, catalogOrder, selectedSport } = params;
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (name: string) => {
    if (!name || seen.has(name)) {
      return;
    }
    seen.add(name);
    result.push(name);
  };

  if (selectedSport) {
    add(selectedSport);
  }
  for (const name of preferredSports) {
    add(name);
  }
  for (const name of attendedSports) {
    add(name);
  }
  for (const name of catalogOrder) {
    add(name);
  }

  return result;
}

/** Play / Create Game strip — user MRU + attendance, up to `maxVisible` chips; More when catalog overflows. */
export function buildPlayStripSports<T extends SportCatalogItem>(params: {
  catalogSports: T[];
  selectedSport: string;
  preferredSports: string[];
  attendedSports: string[];
  maxVisible?: number;
}): { stripSports: T[]; showMore: boolean } {
  const maxVisible = params.maxVisible ?? PLAY_STRIP_SPORT_MAX;
  const orderedCatalog = sortSportsForPlayTab(params.catalogSports);
  const catalogByName = new Map(orderedCatalog.map((sport) => [sport.name, sport]));
  const catalogOrder = orderedCatalog.map((sport) => sport.name);

  const orderedNames = buildPersonalizedSportOrder({
    preferredSports: params.preferredSports,
    attendedSports: params.attendedSports,
    catalogOrder,
    selectedSport: params.selectedSport,
  });

  const stripSports: T[] = [];
  for (const name of orderedNames) {
    const item = catalogByName.get(name);
    if (item) {
      stripSports.push(item);
    }
    if (stripSports.length >= maxVisible) {
      break;
    }
  }

  const showMore = orderedCatalog.length > stripSports.length;
  return { stripSports, showMore };
}

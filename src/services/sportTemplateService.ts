import { supabase } from './api/supabase';
import { SportTemplate } from '../types/sportTemplate';
import { getDefaultOpenSpotsForSport } from '../constants/sports';

const templateCache = new Map<string, SportTemplate | null>();

export const getSportTemplate = async (sport: string): Promise<SportTemplate | null> => {
  if (templateCache.has(sport)) {
    return templateCache.get(sport) ?? null;
  }
  const { data, error } = await supabase.rpc('get_sport_template', { p_sport: sport });
  if (error) {
    return null;
  }
  const template = (data as SportTemplate | null) ?? null;
  templateCache.set(sport, template);
  return template;
};

export const getDefaultOpenSpotsFromTemplate = async (sport: string): Promise<number> => {
  const template = await getSportTemplate(sport);
  if (template?.default_open_spots != null) {
    return template.default_open_spots;
  }
  return getDefaultOpenSpotsForSport(sport);
};

export const getDefaultDurationFromTemplate = async (sport: string): Promise<number> => {
  const template = await getSportTemplate(sport);
  return template?.default_duration_minutes ?? 60;
};

export const getListingTitleHint = async (sport: string): Promise<string | null> => {
  const template = await getSportTemplate(sport);
  return template?.create_game_hints?.listing_title_hint ?? null;
};

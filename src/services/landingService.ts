import { supabase } from './api/supabase';
import { SportType } from '../constants/sports';
import { BETA_REGION } from '../constants/betaRegion';
import { SportLandingPayload } from '../types/landing';
import { APP_SCHEME } from '../navigation/deepLinking';

const SPORT_SLUGS: Record<string, SportType> = {
  badminton: 'Badminton',
  pickleball: 'Pickleball',
  basketball: 'Basketball',
};

const SPORT_TO_SLUG: Record<string, string> = {
  Badminton: 'badminton',
  Pickleball: 'pickleball',
  Basketball: 'basketball',
};

export const sportFromSlug = (slug: string): SportType | null => {
  return SPORT_SLUGS[slug.toLowerCase()] ?? null;
};

export const sportToSlug = (sport: string): string => {
  return SPORT_TO_SLUG[sport] ?? sport.toLowerCase();
};

export const getSportLandingPayload = async (
  sport: SportType | string
): Promise<SportLandingPayload> => {
  const { data, error } = await supabase.rpc('get_sport_landing_payload', {
    p_city: BETA_REGION.name,
    p_sport: sport,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as SportLandingPayload;
};

export const buildSportLandingDeepLink = (sport: string): string => {
  return `${APP_SCHEME}://la/${sportToSlug(sport)}`;
};

export const buildSportLandingWebUrl = (sport: string): string => {
  const slug = sportToSlug(sport);
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return buildSportLandingDeepLink(sport);
  }
  return `${supabaseUrl}/functions/v1/sport-landing?city=la&sport=${slug}`;
};

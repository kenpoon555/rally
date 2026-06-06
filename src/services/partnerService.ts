import { supabase } from './api/supabase';
import { BETA_REGION } from '../constants/betaRegion';
import { CoachListing, IntroSession, PartnerVenue } from '../types/sportTemplate';

export const listPartnerVenues = async (
  sport?: string | null
): Promise<PartnerVenue[]> => {
  const { data, error } = await supabase.rpc('list_partner_venues', {
    p_sport: sport ?? null,
    p_city: BETA_REGION.name,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as PartnerVenue[] | null) ?? [];
};

export const listCoachListings = async (sport?: string | null): Promise<CoachListing[]> => {
  const { data, error } = await supabase.rpc('list_coach_listings', {
    p_sport: sport ?? null,
    p_city: BETA_REGION.name,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as CoachListing[] | null) ?? [];
};

export const listIntroSessions = async (sport?: string | null): Promise<IntroSession[]> => {
  const { data, error } = await supabase.rpc('list_intro_sessions', {
    p_sport: sport ?? null,
    p_city: BETA_REGION.name,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as IntroSession[] | null) ?? [];
};

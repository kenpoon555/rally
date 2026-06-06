import { supabase } from './api/supabase';
import { VenueDetails } from '../types/gameRecap';

export const getLocationVenueDetails = async (
  locationId: string
): Promise<VenueDetails | null> => {
  const { data, error } = await supabase.rpc('get_location_venue_details', {
    p_location_id: locationId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as VenueDetails | null) ?? null;
};

export const setRegularGroupDefaultLocation = async (
  groupId: string,
  locationId: string | null
): Promise<void> => {
  const { error } = await supabase.rpc('set_regular_group_default_location', {
    p_group_id: groupId,
    p_location_id: locationId,
  });
  if (error) {
    throw new Error(error.message);
  }
};

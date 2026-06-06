export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ActivityLocation {
  id: string;
  name: string;
  sport_type: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  google_place_id?: string;
  radius: number; // meters
  created_at: string;
  /** False when community reports venue closed (2+ closed reports). */
  is_active?: boolean;
  source?: 'seed' | 'user' | 'places' | string;
  last_verified_at?: string | null;
  updated_at?: string | null;
  address?: string | null;
  parking_note?: string | null;
  booking_url?: string | null;
  busy_notes?: string | null;
  hours_text?: string | null;
  partner_tier?: string | null;
  logo_url?: string | null;
  promo_note?: string | null;
}

export interface Geofence {
  id: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  sport_type: string;
}

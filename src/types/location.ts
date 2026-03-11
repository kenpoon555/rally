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

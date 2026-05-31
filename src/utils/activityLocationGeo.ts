import { ActivityLocation } from '../types/location';

/** PostGIS EWKB Point hex (Supabase geography default), e.g. 0101000020E6100000… */
function parseEwkbPointHex(hex: string): [number, number] | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 42) {
    return null;
  }
  try {
    const coordHex = hex.slice(-32);
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Number.parseInt(coordHex.slice(i * 2, i * 2 + 2), 16);
    }
    const view = new DataView(bytes.buffer);
    const lng = view.getFloat64(0, true);
    const lat = view.getFloat64(8, true);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Extract [longitude, latitude] from Supabase/PostGIS geography payloads.
 * Handles GeoJSON, WKT, JSON strings, and legacy { lat, lng } shapes.
 */
export function parseGeographyCoordinates(locationField: unknown): [number, number] | null {
  if (locationField == null) {
    return null;
  }

  if (typeof locationField === 'string') {
    const trimmed = locationField.trim();
    const ewkbPoint = parseEwkbPointHex(trimmed);
    if (ewkbPoint) {
      return ewkbPoint;
    }
    const wktMatch = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (wktMatch) {
      const lng = Number.parseFloat(wktMatch[1]);
      const lat = Number.parseFloat(wktMatch[2]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return [lng, lat];
      }
    }
    try {
      return parseGeographyCoordinates(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (typeof locationField !== 'object') {
    return null;
  }

  const record = locationField as Record<string, unknown>;

  if (record.type === 'Point' && Array.isArray(record.coordinates) && record.coordinates.length >= 2) {
    const lng = Number(record.coordinates[0]);
    const lat = Number(record.coordinates[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  if (record.geometry != null) {
    return parseGeographyCoordinates(record.geometry);
  }

  const lat =
    typeof record.lat === 'number'
      ? record.lat
      : typeof record.latitude === 'number'
        ? record.latitude
        : null;
  const lng =
    typeof record.lng === 'number'
      ? record.lng
      : typeof record.longitude === 'number'
        ? record.longitude
        : null;

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lng, lat];
  }

  return null;
}

export function normalizeActivityLocation(location: ActivityLocation): ActivityLocation {
  const coordinates = parseGeographyCoordinates(location.location);
  if (!coordinates) {
    return location;
  }

  return {
    ...location,
    location: {
      type: 'Point',
      coordinates,
    },
  };
}

export function normalizeActivityLocations(locations: ActivityLocation[]): ActivityLocation[] {
  return locations.map(normalizeActivityLocation);
}

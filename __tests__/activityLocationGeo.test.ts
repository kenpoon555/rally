import {
  normalizeActivityLocation,
  parseGeographyCoordinates,
} from '../src/utils/activityLocationGeo';
import { ActivityLocation } from '../src/types/location';

describe('parseGeographyCoordinates', () => {
  it('parses GeoJSON Point', () => {
    expect(
      parseGeographyCoordinates({
        type: 'Point',
        coordinates: [-122.0322, 37.323],
      })
    ).toEqual([-122.0322, 37.323]);
  });

  it('parses WKT POINT', () => {
    expect(parseGeographyCoordinates('POINT(-122.0322 37.323)')).toEqual([-122.0322, 37.323]);
  });

  it('parses JSON string GeoJSON', () => {
    expect(
      parseGeographyCoordinates('{"type":"Point","coordinates":[-122.1,37.4]}')
    ).toEqual([-122.1, 37.4]);
  });

  it('parses lat/lng object', () => {
    expect(parseGeographyCoordinates({ lat: 37.323, lng: -122.0322 })).toEqual([
      -122.0322, 37.323,
    ]);
  });

  it('returns null for invalid input', () => {
    expect(parseGeographyCoordinates(null)).toBeNull();
    expect(parseGeographyCoordinates({})).toBeNull();
  });
});

describe('normalizeActivityLocation', () => {
  it('normalizes WKT into GeoJSON coordinates', () => {
    const raw = {
      id: '1',
      name: 'Test Court',
      sport_type: 'Pickleball',
      location: 'POINT(-122.0322 37.323)',
      radius: 50,
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as ActivityLocation;

    const normalized = normalizeActivityLocation(raw);
    expect(normalized.location.coordinates).toEqual([-122.0322, 37.323]);
  });
});

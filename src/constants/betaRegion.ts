/** Launch geography — Los Angeles metro. */
export const BETA_REGION = {
  name: 'Los Angeles',
  /** Central LA — dev simulator fallback when GPS is unavailable. */
  center: {
    latitude: 34.0522,
    longitude: -118.2437,
  },
  /** Default map zoom when no courts are loaded yet. */
  mapDelta: 0.08,
} as const;

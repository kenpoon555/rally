/**
 * Dev-only UI toggles. Off by default even in __DEV__ so normal local testing matches user-facing UX.
 * Set EXPO_PUBLIC_SHOW_LOCATION_DEBUG=true in .env to show the location debug panel on Discover.
 * Set EXPO_PUBLIC_SHOW_DISCOVER_PIPELINE=true to show the Discover pipeline diagnostics panel.
 */
export const SHOW_LOCATION_DEBUG_PANEL =
  __DEV__ && process.env.EXPO_PUBLIC_SHOW_LOCATION_DEBUG === 'true';

export const SHOW_DISCOVER_PIPELINE_PANEL =
  __DEV__ && process.env.EXPO_PUBLIC_SHOW_DISCOVER_PIPELINE === 'true';

export const ENABLE_DEBUG_INGEST =
  __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEBUG_INGEST === 'true';

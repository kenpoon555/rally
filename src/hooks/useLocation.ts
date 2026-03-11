import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import { Location } from '../types/location';
import {
  getCurrentLocation,
  requestLocationPermission,
  startLocationMonitoring,
  stopLocationMonitoring,
} from '../services/locationService';
import { sendDebugLog } from '../utils/debugIngest';
import { addLocationLog } from '../utils/devLocationLog';

export type UseLocationOptions = { skipPermissionCheckOnMount?: boolean };

export const useLocation = (autoStart: boolean = false, options?: UseLocationOptions) => {
  const { skipPermissionCheckOnMount = false } = options ?? {};
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  watchIdRef.current = watchId;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const checkPermission = useCallback(async () => {
    sendDebugLog('useLocation.ts:checkPermission', 'Location checkPermission started', { autoStart }, 'H2');
    const granted = await requestLocationPermission();
    if (__DEV__) addLocationLog('permission check result:', granted);
    sendDebugLog('useLocation.ts:hasPermission', 'Location permission result', { granted }, 'H2,H5,H8');
    setHasPermission(granted);
    return granted;
  }, []);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let granted = hasPermission === true;
      if (!granted) {
        granted = await checkPermission();
        if (!granted) {
          if (__DEV__) addLocationLog('fetchLocation skipped: no permission');
          setLoading(false);
          return;
        }
      }
      // On Android, short delay before native getCurrentPosition so we're clearly outside gesture handler (avoids crash).
      if (Platform.OS === 'android') {
        await new Promise((r) => setTimeout(r, 300));
      }
      const currentLocation = await getCurrentLocation();
      if (mountedRef.current) setLocation(currentLocation);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      if (__DEV__) addLocationLog('fetchLocation failed:', message);
      const errorToSet = err instanceof Error ? err : new Error('Failed to get location');
      // Defer state update off the native timeout callback stack to avoid crash when location times out on Android
      if (Platform.OS === 'android') {
        InteractionManager.runAfterInteractions(() => {
          if (mountedRef.current) setError(errorToSet);
        });
      } else if (mountedRef.current) {
        setError(errorToSet);
      }
    } finally {
      if (Platform.OS === 'android') {
        InteractionManager.runAfterInteractions(() => {
          if (mountedRef.current) setLoading(false);
        });
      } else if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, checkPermission]);

  const startWatching = useCallback(() => {
    // #region agent log
    sendDebugLog('useLocation.ts:startWatching', 'Location startWatching called', { watchId: watchIdRef.current }, 'H2,H3,H5');
    // #endregion
    const currentId = watchIdRef.current;
    if (currentId !== null) {
      stopLocationMonitoring(currentId);
    }

    const id = startLocationMonitoring(
      (newLocation) => {
        setLocation(newLocation);
      },
      (err) => {
        setError(err);
      }
    );

    setWatchId(id >= 0 ? id : null);
  }, []);

  const stopWatching = useCallback(() => {
    const currentId = watchIdRef.current;
    if (currentId !== null) {
      stopLocationMonitoring(currentId);
      setWatchId(null);
    }
  }, []);

  // On Android with skipPermissionCheckOnMount we do nothing on mount. Otherwise iOS runs immediately; Android deferred.
  useEffect(() => {
    if (skipPermissionCheckOnMount) return;
    if (Platform.OS === 'android') {
      const t = setTimeout(checkPermission, 2000);
      return () => clearTimeout(t);
    }
    checkPermission();
  }, [skipPermissionCheckOnMount, checkPermission]);

  // Re-check permission when app returns to foreground (e.g. user granted in Settings).
  // Listener stays active for the component lifetime; cleanup on unmount.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPermission();
      }
    });
    return () => sub.remove();
  }, [checkPermission]);

  // When we have permission but no location yet, fetch once so the banner clears (iOS only).
  // On Android we never auto-fetch: getCurrentPosition from effects/timers causes crash. User must pull to refresh.
  const hasAutoFetchedRef = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'android') return;
    if (hasPermission !== true || location !== null || loading || hasAutoFetchedRef.current) {
      return;
    }
    hasAutoFetchedRef.current = true;
    if (__DEV__) addLocationLog('auto-fetching (permission granted, no location yet)');
    fetchLocation();
  }, [hasPermission, location, loading, fetchLocation]);

  // On Android, never start watchPosition — it causes a native crash after granting permission. Use fetchLocation() (one-shot) only.
  useEffect(() => {
    if (autoStart && hasPermission && Platform.OS !== 'android') {
      startWatching();
    }
  }, [autoStart, hasPermission, startWatching]);

  useEffect(() => {
    return () => {
      const currentId = watchIdRef.current;
      if (currentId !== null) {
        stopLocationMonitoring(currentId);
      }
    };
  }, [watchId]);

  return {
    location,
    loading,
    error,
    hasPermission,
    fetchLocation,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
  };
};

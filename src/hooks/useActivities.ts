import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity } from '../types/activity';
import {
  getNearbyActivities,
  getActivityById,
  expireStaleActivities,
  MyGamesResult,
} from '../services/activityService';
import { supabase } from '../services/api/supabase';
import { ensureSupabaseSessionReady } from '../services/api/ensureSupabaseSession';
import { SportType } from '../constants/sports';
import { CONFIG } from '../constants/config';
import { useAuth } from './useAuth';
import {
  REALTIME_MY_GAMES_TABLES,
  useSupabaseRealtimeReload,
} from './useSupabaseRealtimeReload';
import {
  fetchCachedMyGames,
  getCachedMyGamesSnapshot,
} from '../services/userDataCache';

export const useActivities = (
  userLocation?: { latitude: number; longitude: number },
  sportType?: SportType
) => {
  const { loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchGenerationRef = useRef(0);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchActivities = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    setError(null);
    try {
      await ensureSupabaseSessionReady();
      const nearbyActivities = await getNearbyActivities(
        userLocation?.latitude,
        userLocation?.longitude,
        CONFIG.DISCOVERY_RADIUS_M,
        sportType
      );
      if (generation !== fetchGenerationRef.current) {
        return;
      }
      setActivities(nearbyActivities);
      console.warn(
        `[Discover] hook got ${nearbyActivities.length} games (sport=${sportType ?? 'all'})`
      );
    } catch (err) {
      if (generation !== fetchGenerationRef.current) {
        return;
      }
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude, sportType]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void fetchActivities();
  }, [authLoading, fetchActivities]);

  // Subscribe to real-time updates (after auth is ready)
  useEffect(() => {
    if (authLoading) {
      return;
    }
    const subscription = supabase
      .channel('activities-discover')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
        },
        () => {
          if (realtimeDebounceRef.current) {
            clearTimeout(realtimeDebounceRef.current);
          }
          realtimeDebounceRef.current = setTimeout(() => {
            realtimeDebounceRef.current = null;
            void fetchActivities();
          }, 400);
        }
      )
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      subscription.unsubscribe();
    };
  }, [authLoading, fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
};

export const useMyGames = (userId: string) => {
  const [games, setGames] = useState<MyGamesResult>(
    () => getCachedMyGamesSnapshot(userId) ?? { active: [], past: [] }
  );
  const [loading, setLoading] = useState(
    () => Boolean(userId) && !getCachedMyGamesSnapshot(userId)
  );
  const [error, setError] = useState<Error | null>(null);

  const fetchMyGames = useCallback(
    async (force = false) => {
      if (!userId) {
        setGames({ active: [], past: [] });
        setLoading(false);
        return;
      }

      const hasCached = getCachedMyGamesSnapshot(userId) != null;
      if (!hasCached || force) {
        setLoading(true);
      }
      setError(null);
      try {
        await ensureSupabaseSessionReady();
        const entries = await fetchCachedMyGames(userId, force);
        setGames(entries);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch my games'));
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void fetchMyGames(false);
  }, [fetchMyGames]);

  useSupabaseRealtimeReload(
    REALTIME_MY_GAMES_TABLES,
    () => void fetchMyGames(true),
    Boolean(userId),
    400
  );

  return {
    games,
    loading,
    error,
    refetch: fetchMyGames,
  };
};

export const useActivity = (activityId: string) => {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(Boolean(activityId));
  const [error, setError] = useState<Error | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!activityId) {
      setActivity(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await expireStaleActivities();
      const activityData = await getActivityById(activityId);
      setActivity(activityData);
      if (!activityData) {
        setError(new Error('Game not found or you no longer have access.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (activityId) {
      fetchActivity();
    }
  }, [activityId, fetchActivity]);

  // Subscribe to real-time updates for this activity and its join requests
  useEffect(() => {
    if (!activityId) return;

    const channel = supabase
      .channel(`activity-${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `id=eq.${activityId}`,
        },
        () => {
          fetchActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          fetchActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, fetchActivity]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity,
  };
};

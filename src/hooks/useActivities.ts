import { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types/activity';
import {
  getNearbyActivities,
  getMyGames,
  getActivityById,
  MyGamesResult,
} from '../services/activityService';
import { supabase } from '../services/api/supabase';
import { ensureSupabaseSessionReady } from '../services/api/ensureSupabaseSession';
import { SportType } from '../constants/sports';
import { CONFIG } from '../constants/config';
import { useAuth } from './useAuth';
import { useSupabaseRealtimeReload } from './useSupabaseRealtimeReload';

export const useActivities = (
  userLocation?: { latitude: number; longitude: number },
  sportType?: SportType
) => {
  const { loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
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
      setActivities(nearbyActivities);
      console.warn(
        `[Discover] hook got ${nearbyActivities.length} games (sport=${sportType ?? 'all'})`
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setLoading(false);
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
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
        },
        () => {
          // Refetch activities on any change
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
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
  const [games, setGames] = useState<MyGamesResult>({ active: [], past: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMyGames = useCallback(async () => {
    if (!userId) {
      setGames({ active: [], past: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ensureSupabaseSessionReady();
      const entries = await getMyGames(userId);
      setGames(entries);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch my games'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyGames();
  }, [fetchMyGames]);

  useSupabaseRealtimeReload(['activities', 'join_requests'], fetchMyGames, Boolean(userId));

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

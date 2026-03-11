import { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types/activity';
import {
  getNearbyActivities,
  getUserActivities,
  getActivityById,
} from '../services/activityService';
import { supabase } from '../services/api/supabase';
import { SportType } from '../constants/sports';

export const useActivities = (
  userLocation?: { latitude: number; longitude: number },
  sportType?: SportType
) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);
    try {
      const nearbyActivities = await getNearbyActivities(
        userLocation.latitude,
        userLocation.longitude,
        5000,
        sportType
      );
      setActivities(nearbyActivities);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setLoading(false);
    }
  }, [userLocation, sportType]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Subscribe to real-time updates
  useEffect(() => {
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
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
};

export const useUserActivities = (userId: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userActivities = await getUserActivities(userId);
      setActivities(userActivities);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user activities'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserActivities();
    }
  }, [userId, fetchUserActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchUserActivities,
  };
};

export const useActivity = (activityId: string) => {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activityData = await getActivityById(activityId);
      setActivity(activityData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (activityId) {
      fetchActivity();
    }
  }, [activityId, fetchActivity]);

  // Subscribe to real-time updates for this activity
  useEffect(() => {
    if (!activityId) return;

    const subscription = supabase
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
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activityId, fetchActivity]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity,
  };
};

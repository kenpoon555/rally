import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { ROUTES } from '../../constants/routes';
import {
  ACTIVITY_DURATIONS,
  ACTIVITY_VISIBILITY,
  ActivityVisibility,
} from '../../constants/sports';
import { createActivity } from '../../services/activityService';
import {
  getAllActivityLocations,
  getNearbyActivityLocations,
} from '../../services/locationService';
import { ActivityLocation } from '../../types/location';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, 'CreateActivity'>;

const CreateActivityScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  // One-shot location only: watchPosition on Android crashes when opening screens after granting permission.
  const { location, loading: loadingLocation, fetchLocation } = useLocation(false);
  const { sports } = useSportsCatalog();

  const [locations, setLocations] = useState<ActivityLocation[]>([]);
  const [usingGlobalFallback, setUsingGlobalFallback] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [sportType, setSportType] = useState<string>(
    user?.preferred_sports?.[0] || 'Basketball'
  );
  const [duration, setDuration] = useState<(typeof ACTIVITY_DURATIONS)[number]>(
    (user?.default_duration as (typeof ACTIVITY_DURATIONS)[number]) || 60
  );
  const [visibility, setVisibility] = useState<ActivityVisibility>(
    (user?.default_visibility as ActivityVisibility) || 'nearby'
  );
  const [missingPlayersText, setMissingPlayersText] = useState('1');
  const [schedulingMode, setSchedulingMode] = useState<'fixed' | 'flex'>('fixed');

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    const load = async () => {
      if (!location) {
        setLocations([]);
        setUsingGlobalFallback(false);
        return;
      }
      setLoadingLocations(true);
      try {
        const near = await getNearbyActivityLocations(
          location.latitude,
          location.longitude,
          5000
        );
        let nextLocations = near;
        let fallback = false;

        if (nextLocations.length === 0) {
          nextLocations = await getAllActivityLocations(300);
          fallback = nextLocations.length > 0;
        }

        setLocations(nextLocations);
        setUsingGlobalFallback(fallback);
        if (nextLocations.length > 0) {
          setSelectedLocationId((prev) => prev || nextLocations[0].id);
        }
      } catch (error) {
        console.error('Error loading activity locations:', error);
        setLocations([]);
        setUsingGlobalFallback(false);
      } finally {
        setLoadingLocations(false);
      }
    };

    load();
  }, [location]);

  useEffect(() => {
    if (sports.length > 0 && !sports.some((s) => s.name === sportType)) {
      setSportType(sports[0].name);
    }
  }, [sports, sportType]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.preferred_sports?.length && sports.some((s) => s.name === user.preferred_sports[0])) {
      setSportType(user.preferred_sports[0]);
    }

    if (user.default_duration && ACTIVITY_DURATIONS.includes(user.default_duration as any)) {
      setDuration(user.default_duration as (typeof ACTIVITY_DURATIONS)[number]);
    }

    if (
      user.default_visibility &&
      ACTIVITY_VISIBILITY.includes(user.default_visibility as ActivityVisibility)
    ) {
      setVisibility(user.default_visibility as ActivityVisibility);
    }
  }, [user, sports]);

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const distanceMeters = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const locationsWithDistance = locations
    .map((loc) => {
      if (!location || !loc.location?.coordinates) {
        return { ...loc, distanceMeters: null as number | null };
      }
      const [lng, lat] = loc.location.coordinates;
      return {
        ...loc,
        distanceMeters: distanceMeters(location.latitude, location.longitude, lat, lng),
      };
    })
    .sort((a, b) => {
      if (a.distanceMeters == null && b.distanceMeters == null) return 0;
      if (a.distanceMeters == null) return 1;
      if (b.distanceMeters == null) return -1;
      return a.distanceMeters - b.distanceMeters;
    });

  const keyword = locationSearch.trim().toLowerCase();
  const sportMatchedLocations = locationsWithDistance.filter(
    (loc) => loc.sport_type.toLowerCase() === sportType.toLowerCase()
  );
  const filteredLocations = !keyword
    ? sportMatchedLocations
    : sportMatchedLocations.filter((loc) => {
        return (
          loc.name.toLowerCase().includes(keyword) ||
          loc.sport_type.toLowerCase().includes(keyword)
        );
      });
  const visibleLocations = filteredLocations.slice(0, 10);
  const effectiveSelectedLocationId =
    selectedLocationId && visibleLocations.some((loc) => loc.id === selectedLocationId)
      ? selectedLocationId
      : visibleLocations[0]?.id ?? null;
  const selectedLocation =
    locations.find((l) => l.id === effectiveSelectedLocationId) || null;

  const selectLocation = (loc: ActivityLocation) => {
    setSelectedLocationId(loc.id);
    const matchedSport = sports.find(
      (sport) => sport.name.toLowerCase() === loc.sport_type.toLowerCase()
    );
    if (matchedSport) {
      setSportType(matchedSport.name);
    }
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in and try again.');
      return;
    }
    if (!effectiveSelectedLocationId) {
      Alert.alert('No location selected', 'Pick a location first.');
      return;
    }

    const parsed = Number.parseInt(missingPlayersText, 10);
    const missingPlayers = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const candidateLocationIds =
      schedulingMode === 'flex'
        ? [
            effectiveSelectedLocationId,
            ...visibleLocations
              .map((loc) => loc.id)
              .filter((id) => id !== effectiveSelectedLocationId),
          ]
            .filter(Boolean)
            .slice(0, 3) as string[]
        : undefined;

    setSaving(true);
    try {
      const created = await createActivity({
        user_id: user.id,
        location_id: effectiveSelectedLocationId,
        sport_type: sportType,
        start_time: now.toISOString(),
        duration,
        visibility,
        missing_players: missingPlayers,
        scheduling_mode: schedulingMode,
        match_status: schedulingMode === 'flex' ? 'collecting' : 'open',
        window_start: schedulingMode === 'flex' ? now.toISOString() : undefined,
        window_end: schedulingMode === 'flex' ? windowEnd.toISOString() : undefined,
        preference_deadline: schedulingMode === 'flex' ? windowEnd.toISOString() : undefined,
        candidate_location_ids: candidateLocationIds,
      });

      Alert.alert('Activity created', 'Your activity is now visible for matching.', [
        {
          text: 'View Activity',
          onPress: () =>
            navigation.navigate(ROUTES.ACTIVITY.DETAIL as any, {
              activityId: created.id,
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Create failed', error?.message || 'Could not create activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Activity</Text>
      <Text style={styles.subtitle}>Pick a location and publish your game.</Text>
      <Text style={styles.helperText}>
        Prefilled from your profile defaults. Update in Profile if needed.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduling Mode</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.optionButton, schedulingMode === 'fixed' && styles.optionButtonSelected]}
            onPress={() => setSchedulingMode('fixed')}
          >
            <Text
              style={[
                styles.optionButtonText,
                schedulingMode === 'fixed' && styles.optionButtonTextSelected,
              ]}
            >
              Fixed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, schedulingMode === 'flex' && styles.optionButtonSelected]}
            onPress={() => setSchedulingMode('flex')}
          >
            <Text
              style={[
                styles.optionButtonText,
                schedulingMode === 'flex' && styles.optionButtonTextSelected,
              ]}
            >
              Flexible
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          {schedulingMode === 'flex'
            ? 'Flexible mode collects player preferences and finalizes best slot.'
            : 'Fixed mode publishes immediate exact start.'}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity onPress={fetchLocation}>
            <Text style={styles.linkText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loadingLocation || loadingLocations ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#007AFF" />
            <Text style={styles.loadingText}>Loading locations...</Text>
          </View>
        ) : locations.length === 0 ? (
          <Text style={styles.helperText}>
            No locations available yet. Try refresh, or check seed data.
          </Text>
        ) : (
          <>
            {usingGlobalFallback && (
              <Text style={styles.helperText}>
                Nearby locations were empty. Showing all available locations for testing.
              </Text>
            )}
            <TextInput
              style={styles.input}
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder="Search location or sport type"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              Showing {visibleLocations.length} of {filteredLocations.length} {sportType} locations
              (max 10).
            </Text>
            {filteredLocations.length === 0 ? (
              <Text style={styles.helperText}>
                No {sportType} locations match your search.
              </Text>
            ) : null}
            {visibleLocations.map((loc) => {
              const selected = effectiveSelectedLocationId === loc.id;
              const distanceLabel =
                loc.distanceMeters == null
                  ? 'Distance unavailable'
                  : loc.distanceMeters < 1000
                  ? `${Math.round(loc.distanceMeters)}m away`
                  : `${(loc.distanceMeters / 1000).toFixed(1)}km away`;
              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.locationCard, selected && styles.locationCardSelected]}
                  onPress={() => selectLocation(loc)}
                >
                  <Text style={[styles.locationName, selected && styles.locationNameSelected]}>
                    {loc.name}
                  </Text>
                  <Text style={[styles.locationMeta, selected && styles.locationMetaSelected]}>
                    {loc.sport_type} • {distanceLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sport</Text>
        <View style={styles.wrapRow}>
          {sports.map((sport) => {
            const selected = sportType === sport.name;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => setSportType(sport.name)}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                  {sport.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.row}>
          {ACTIVITY_DURATIONS.map((dur) => {
            const selected = duration === dur;
            return (
              <TouchableOpacity
                key={dur}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => setDuration(dur)}
              >
                <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>
                  {dur} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibility</Text>
        <View style={styles.row}>
          {ACTIVITY_VISIBILITY.map((value) => {
            const selected = visibility === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => setVisibility(value)}
              >
                <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>
                  {value === 'friends' ? 'Friends Only' : 'Nearby Players'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open Slots</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={missingPlayersText}
          onChangeText={setMissingPlayersText}
          placeholder="Number of players needed"
        />
        {!!selectedLocation && (
          <Text style={styles.helperText}>Selected spot: {selectedLocation.name}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.createButton, (saving || !effectiveSelectedLocationId) && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={saving || !effectiveSelectedLocationId}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Create Activity</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  helperText: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
  },
  locationCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  locationCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e8f1ff',
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  locationNameSelected: {
    color: '#0057c2',
  },
  locationMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  locationMetaSelected: {
    color: '#0057c2',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
  },
  pill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  pillText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextSelected: {
    color: '#fff',
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  createButton: {
    marginTop: 26,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateActivityScreen;

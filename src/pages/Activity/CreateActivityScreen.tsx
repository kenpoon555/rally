import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { ROUTES } from '../../constants/routes';
import { CONFIG } from '../../constants/config';
import {
  ACTIVITY_DURATIONS,
  CREATE_ACTIVITY_VISIBILITY,
  ActivityVisibility,
  MVP_DEFAULT_SCHEDULING_MODE,
  getDefaultLaunchSportName,
  getSportMetadata,
  resolvePreferredSportForLaunch,
  SportType,
} from '../../constants/sports';
import { createActivity } from '../../services/activityService';
import {
  getAllActivityLocations,
  getNearbyActivityLocations,
} from '../../services/locationService';
import { ActivityLocation } from '../../types/location';
import { calculateDistance } from '../../utils/distance';
import { formatDistanceLabel } from '../../utils/formatDistance';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, 'CreateActivity'>;

type LocationWithDistance = ActivityLocation & { distanceMeters: number | null };

const CreateActivityScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { location, loading: loadingLocation, fetchLocation, hasPermission } = useLocation(false);
  const { sports } = useSportsCatalog();
  const launchSportName = sports[0]?.name ?? getDefaultLaunchSportName();
  const showSportPicker = sports.length > 1;

  const [locations, setLocations] = useState<ActivityLocation[]>([]);
  const [courtSearchRadiusM, setCourtSearchRadiusM] = useState(CONFIG.NEARBY_COURT_RADIUS_M);
  const [showAllCourtsDev, setShowAllCourtsDev] = useState(false);
  const [showAllCourtsFallback, setShowAllCourtsFallback] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [needPlayersTonight, setNeedPlayersTonight] = useState(false);
  const didRequestInitialLocationRef = useRef(false);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [sportType, setSportType] = useState<string>(() =>
    resolvePreferredSportForLaunch(user?.preferred_sports?.[0])
  );
  const [duration, setDuration] = useState<(typeof ACTIVITY_DURATIONS)[number]>(
    (user?.default_duration as (typeof ACTIVITY_DURATIONS)[number]) || 60
  );
  const [visibility, setVisibility] = useState<ActivityVisibility>(
    (user?.default_visibility as ActivityVisibility) || 'nearby'
  );
  const [missingPlayersText, setMissingPlayersText] = useState(() => {
    const sport = resolvePreferredSportForLaunch(user?.preferred_sports?.[0]);
    return sport === SportType.BASKETBALL ? '3' : '1';
  });
  const [schedulingMode, setSchedulingMode] = useState<'fixed' | 'flex'>(
    MVP_DEFAULT_SCHEDULING_MODE
  );
  const defaultFixedStart = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    d.setSeconds(0, 0);
    return d;
  }, []);
  const [fixedStartTime, setFixedStartTime] = useState(defaultFixedStart);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const meta = getSportMetadata(sportType);
    if (meta?.name === SportType.BASKETBALL) {
      setMissingPlayersText((prev) => (prev === '1' ? '3' : prev));
    }
  }, [sportType]);

  useEffect(() => {
    if (didRequestInitialLocationRef.current) {
      return;
    }
    didRequestInitialLocationRef.current = true;
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    const load = async () => {
      if (!location) {
        setLocations([]);
        setCourtSearchRadiusM(CONFIG.NEARBY_COURT_RADIUS_M);
        setShowAllCourtsDev(false);
        setShowAllCourtsFallback(false);
        return;
      }

      if (showAllCourtsDev) {
        setLoadingLocations(true);
        try {
          const all = await getAllActivityLocations(100);
          setLocations(all);
          setCourtSearchRadiusM(0);
          if (all.length > 0) {
            setSelectedLocationId((prev) => prev || all[0].id);
          }
        } catch (error) {
          console.error('Error loading all courts:', error);
          setLocations([]);
        } finally {
          setLoadingLocations(false);
        }
        return;
      }

      setLoadingLocations(true);
      try {
        let radius = CONFIG.NEARBY_COURT_RADIUS_M;
        let near = await getNearbyActivityLocations(
          location.latitude,
          location.longitude,
          radius
        );

        if (near.length === 0) {
          radius = CONFIG.WIDER_COURT_RADIUS_M;
          near = await getNearbyActivityLocations(
            location.latitude,
            location.longitude,
            radius
          );
        }

        setLocations(near);
        setCourtSearchRadiusM(near.length > 0 ? radius : CONFIG.NEARBY_COURT_RADIUS_M);
        setShowAllCourtsFallback(false);
        if (near.length > 0) {
          setSelectedLocationId((prev) => prev || near[0].id);
        }
      } catch (error) {
        console.error('Error loading activity locations:', error);
        setLocations([]);
        setCourtSearchRadiusM(CONFIG.NEARBY_COURT_RADIUS_M);
        setShowAllCourtsFallback(false);
      } finally {
        setLoadingLocations(false);
      }
    };

    load();
  }, [location, showAllCourtsDev]);

  useEffect(() => {
    if (sports.length > 0 && !sports.some((s) => s.name === sportType)) {
      setSportType(launchSportName);
    }
  }, [sports, sportType, launchSportName]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const resolved = resolvePreferredSportForLaunch(user.preferred_sports?.[0]);
    setSportType(resolved);

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

  const locationsWithDistance: LocationWithDistance[] = useMemo(() => {
    return locations
      .map((loc) => {
        const coords = parseGeographyCoordinates(loc.location);
        if (!location || !coords) {
          return { ...loc, distanceMeters: null };
        }
        const [lng, lat] = coords;
        return {
          ...loc,
          location: { type: 'Point' as const, coordinates: coords },
          distanceMeters: calculateDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: lat, longitude: lng }
          ),
        };
      })
      .sort((a, b) => {
        if (a.distanceMeters == null && b.distanceMeters == null) return 0;
        if (a.distanceMeters == null) return 1;
        if (b.distanceMeters == null) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [locations, location]);

  const keyword = locationSearch.trim().toLowerCase();
  const sportLocations = locationsWithDistance.filter(
    (loc) => loc.sport_type.toLowerCase() === sportType.toLowerCase()
  );
  const baseLocationList =
    sportLocations.length > 0 || !showAllCourtsFallback
      ? sportLocations
      : locationsWithDistance;

  const filteredLocations = !keyword
    ? baseLocationList
    : baseLocationList.filter((loc) => {
        return (
          loc.name.toLowerCase().includes(keyword) ||
          loc.sport_type.toLowerCase().includes(keyword)
        );
      });

  const visibleLocations = filteredLocations.slice(0, 20);
  const effectiveSelectedLocationId =
    selectedLocationId && visibleLocations.some((loc) => loc.id === selectedLocationId)
      ? selectedLocationId
      : visibleLocations[0]?.id ?? null;
  const selectedLocation = locationsWithDistance.find((l) => l.id === effectiveSelectedLocationId) || null;

  const mapRegion = useMemo(() => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
    }
    const first = visibleLocations[0];
    const coords = first ? parseGeographyCoordinates(first.location) : null;
    if (coords) {
      const [lng, lat] = coords;
      return { latitude: lat, longitude: lng, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    }
    return {
      latitude: 37.323,
      longitude: -122.0322,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [location, visibleLocations]);

  const courtStatusMessage = useMemo(() => {
    if (loadingLocation || loadingLocations) {
      return null;
    }
    if (!location) {
      return hasPermission === false
        ? 'Turn on location to see courts near you.'
        : 'Waiting for your location… tap Refresh.';
    }
    if (locations.length === 0) {
      return `No ${sportType.toLowerCase()} courts near you yet. Ask us to add courts in your area, or try Refresh after moving.`;
    }
    if (showAllCourtsDev) {
      return 'Showing all courts (dev mode). Distances are from your current location.';
    }
    if (courtSearchRadiusM === CONFIG.WIDER_COURT_RADIUS_M) {
      return `No courts within ${CONFIG.NEARBY_COURT_RADIUS_M / 1000} km — showing courts within ${CONFIG.WIDER_COURT_RADIUS_M / 1000} km.`;
    }
    return `Courts within ${courtSearchRadiusM / 1000} km of you.`;
  }, [
    loadingLocation,
    loadingLocations,
    location,
    hasPermission,
    locations.length,
    showAllCourtsDev,
    courtSearchRadiusM,
  ]);

  const selectLocation = (loc: ActivityLocation) => {
    setSelectedLocationId(loc.id);
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in and try again.');
      return;
    }
    if (!effectiveSelectedLocationId) {
      Alert.alert('No court selected', 'Pick a court on the map or list first.');
      return;
    }

    const parsed = Number.parseInt(missingPlayersText, 10);
    const missingPlayers = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    const now = new Date();
    const gameStart = schedulingMode === 'fixed' ? fixedStartTime : now;
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
        sport_type: sportType as SportType,
        start_time: gameStart.toISOString(),
        duration,
        visibility,
        missing_players: missingPlayers,
        scheduling_mode: schedulingMode,
        match_status: schedulingMode === 'flex' ? 'collecting' : 'open',
        window_start: schedulingMode === 'flex' ? now.toISOString() : undefined,
        window_end: schedulingMode === 'flex' ? windowEnd.toISOString() : undefined,
        preference_deadline: schedulingMode === 'flex' ? windowEnd.toISOString() : undefined,
        candidate_location_ids: candidateLocationIds,
        urgency_level: needPlayersTonight ? 'tonight' : 'normal',
      });

      navigation.replace(ROUTES.ACTIVITY.DETAIL as any, { activityId: created.id });
      Alert.alert(
        'Game created',
        needPlayersTonight
          ? 'Your urgent game is highlighted on Discover. Find players in My Games and Chats.'
          : 'Your game is on Discover and in My Games. Others nearby can request to join.'
      );
    } catch (error: any) {
      Alert.alert('Create failed', error?.message || 'Could not create game.');
    } finally {
      setSaving(false);
    }
  };

  const renderCourtRow = ({ item: loc }: { item: LocationWithDistance }) => {
    const selected = effectiveSelectedLocationId === loc.id;
    const distanceLabel = formatDistanceLabel(loc.distanceMeters);
    return (
      <TouchableOpacity
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
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Host a {sportType.toLowerCase()} game at a nearby court.</Text>

        {showSportPicker ? (
          <View style={[styles.section, { marginTop: 8 }]}>
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
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When do you want to play?</Text>
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
                Set time now
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
                I'm flexible
              </Text>
            </TouchableOpacity>
          </View>
          {schedulingMode === 'fixed' && (
            <View style={styles.timePickerBlock}>
              <Text style={styles.sectionTitle}>Game starts</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.timePickerButtonText}>
                  {fixedStartTime.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={fixedStartTime}
                  mode="datetime"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                      return;
                    }
                    if (date) {
                      setFixedStartTime(date);
                    }
                  }}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.timePickerDone}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          {courtStatusMessage ? (
            <Text style={styles.statusText}>{courtStatusMessage}</Text>
          ) : null}

          <View style={styles.mapWrap}>
            <TouchableOpacity style={styles.mapRefresh} onPress={fetchLocation}>
              <Text style={styles.mapRefreshText}>Refresh location</Text>
            </TouchableOpacity>
            <MapView
              style={styles.map}
              region={mapRegion}
              showsUserLocation={!!location}
              onPress={() => {}}
            >
              {visibleLocations.map((loc) => {
                const coords = parseGeographyCoordinates(loc.location);
                if (!coords) return null;
                const [lng, lat] = coords;
                const selected = effectiveSelectedLocationId === loc.id;
                return (
                  <Marker
                    key={loc.id}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={loc.name}
                    description={formatDistanceLabel(loc.distanceMeters)}
                    pinColor={selected ? '#007AFF' : '#34a853'}
                    onPress={() => selectLocation(loc)}
                  />
                );
              })}
            </MapView>
            {(loadingLocation || loadingLocations) && (
              <View style={styles.mapLoading}>
                <ActivityIndicator color="#007AFF" />
              </View>
            )}
          </View>

          {sportLocations.length === 0 && locationsWithDistance.length > 0 && (
            <View style={styles.fallbackBanner}>
              <Text style={styles.fallbackBannerText}>
                No {sportType.toLowerCase()}-tagged courts in this search. You can show other sports temporarily.
              </Text>
              <TouchableOpacity onPress={() => setShowAllCourtsFallback(true)}>
                <Text style={styles.linkText}>Show all sports</Text>
              </TouchableOpacity>
            </View>
          )}

          {__DEV__ && locations.length > 0 && courtSearchRadiusM > 0 && (
            <TouchableOpacity
              onPress={() => {
                setShowAllCourtsDev(true);
                setShowAllCourtsFallback(false);
              }}
            >
              <Text style={styles.devLink}>Dev: browse all courts in database</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            value={locationSearch}
            onChangeText={setLocationSearch}
            placeholder="Search court name"
            autoCapitalize="none"
          />

          <Text style={styles.listMeta}>
            {filteredLocations.length === 0
              ? 'No courts match your search.'
              : `${filteredLocations.length} court${filteredLocations.length === 1 ? '' : 's'} nearby`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomSheet}>
        <FlatList
          data={visibleLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderCourtRow}
          style={styles.courtList}
          contentContainerStyle={styles.courtListContent}
          ListEmptyComponent={
            !loadingLocation && !loadingLocations ? (
              <Text style={styles.helperText}>
                {location
                  ? 'No courts to list. Try Refresh or add courts in your area.'
                  : 'Enable location to load nearby courts.'}
              </Text>
            ) : null
          }
        />

        <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced((v) => !v)}>
          <Text style={styles.linkText}>{showAdvanced ? 'Hide options' : 'Duration & visibility'}</Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedBlock}>
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
                      {dur}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              {CREATE_ACTIVITY_VISIBILITY.map((value) => {
                const selected = visibility === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => setVisibility(value)}
                  >
                    <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>
                      {value === 'friends' ? 'Friends' : 'Nearby'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.urgencyToggle, needPlayersTonight && styles.urgencyToggleSelected]}
              onPress={() => setNeedPlayersTonight((v) => !v)}
            >
              <Text
                style={[
                  styles.urgencyToggleText,
                  needPlayersTonight && styles.urgencyToggleTextSelected,
                ]}
              >
                {needPlayersTonight ? '✓ Need players tonight' : 'Need players tonight'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={missingPlayersText}
              onChangeText={setMissingPlayersText}
              placeholder="Players needed"
            />
          </View>
        )}

        {!!selectedLocation && (
          <Text style={styles.selectedCourt} numberOfLines={1}>
            {selectedLocation.name} • {formatDistanceLabel(selectedLocation.distanceMeters)}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            (saving || !effectiveSelectedLocationId) && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={saving || !effectiveSelectedLocationId}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Publish Game</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapRefresh: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapRefreshText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  devLink: {
    marginTop: 8,
    color: '#888',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  statusText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 8,
    lineHeight: 18,
  },
  mapWrap: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    maxHeight: '42%',
  },
  courtList: {
    maxHeight: 160,
  },
  courtListContent: {
    paddingBottom: 4,
  },
  listMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
  },
  helperText: {
    color: '#666',
    fontSize: 13,
    paddingVertical: 8,
  },
  fallbackBanner: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f5f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8daf8',
  },
  fallbackBannerText: {
    fontSize: 13,
    color: '#334',
    marginBottom: 6,
  },
  locationCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  locationCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e8f1ff',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  locationNameSelected: {
    color: '#0057c2',
  },
  locationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  locationMetaSelected: {
    color: '#0057c2',
  },
  advancedToggle: {
    marginTop: 6,
    marginBottom: 4,
  },
  advancedBlock: {
    marginBottom: 6,
  },
  urgencyToggle: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  urgencyToggleSelected: {
    borderColor: '#b42318',
    backgroundColor: '#fff5f5',
  },
  urgencyToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  urgencyToggleTextSelected: {
    color: '#b42318',
  },
  selectedCourt: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  pill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 12,
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
  timePickerBlock: {
    marginTop: 12,
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f0f7ff',
  },
  timePickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0057c2',
  },
  timePickerDone: {
    marginTop: 8,
    textAlign: 'right',
    color: '#007AFF',
    fontWeight: '600',
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

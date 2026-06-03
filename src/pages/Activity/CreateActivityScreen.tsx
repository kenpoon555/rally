import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
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
import { BETA_REGION } from '../../constants/betaRegion';
import {
  ACTIVITY_DURATIONS,
  ACTIVITY_VISIBILITY,
  CREATE_ACTIVITY_VISIBILITY,
  ActivityVisibility,
  MVP_DEFAULT_SCHEDULING_MODE,
  getDefaultLaunchSportName,
  getDefaultOpenSpotsForSport,
  getDefaultTotalPlayersForSport,
  getCourtSearchRadiiForSport,
  getCreateGameSubtitle,
  totalPlayersFromOpenSpots,
  resolvePreferredSportForLaunch,
  SportType,
} from '../../constants/sports';
import { ScreenHeader } from '../../components/ui';
import { createActivity } from '../../services/activityService';
import { buildGameInviteUrl } from '../../navigation/deepLinking';
import { ONBOARDING_FLAGS, setOnboardingFlag } from '../../constants/onboardingFlags';
import {
  getAllActivityLocations,
  getNearbyActivityLocations,
} from '../../services/locationService';
import { ActivityLocation } from '../../types/location';
import { calculateDistance } from '../../utils/distance';
import { formatDistanceLabel } from '../../utils/formatDistance';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { colors, spacing } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSportIconName } from '../../components/SportIcon';
import { AddCourtSheet } from '../../components/AddCourtSheet';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { getMyRegularGroups } from '../../services/regularGroupService';
import { RegularGroup } from '../../types/regularGroup';
import { SHOW_LOCATION_DEBUG } from '../../constants/devFlags';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, 'CreateActivity'>;

type LocationWithDistance = ActivityLocation & { distanceMeters: number | null };

const CreateActivityScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setMyRallys([]);
      return;
    }
    getMyRegularGroups(user.id)
      .then(setMyRallys)
      .catch(() => setMyRallys([]));
  }, [user?.id]);
  const { location, loading: loadingLocation, fetchLocation, hasPermission } = useLocation(false);
  const { sports } = useSportsCatalog();
  const launchSportName = sports[0]?.name ?? getDefaultLaunchSportName();
  const showSportPicker = sports.length > 1;

  const [locations, setLocations] = useState<ActivityLocation[]>([]);
  const [courtSearchRadiusM, setCourtSearchRadiusM] = useState(CONFIG.NEARBY_COURT_RADIUS_M);
  const [showAllCourtsDev, setShowAllCourtsDev] = useState(false);
  const [myRallys, setMyRallys] = useState<RegularGroup[]>([]);
  const [showAllCourtsFallback, setShowAllCourtsFallback] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [needPlayersTonight, setNeedPlayersTonight] = useState(false);
  const [costNote, setCostNote] = useState('');
  const didRequestInitialLocationRef = useRef(false);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [addCourtSheetVisible, setAddCourtSheetVisible] = useState(false);
  const [sportType, setSportType] = useState<string>(() =>
    resolvePreferredSportForLaunch(user?.preferred_sports?.[0])
  );
  const [duration, setDuration] = useState<(typeof ACTIVITY_DURATIONS)[number]>(
    (user?.default_duration as (typeof ACTIVITY_DURATIONS)[number]) || 60
  );
  const [visibility, setVisibility] = useState<ActivityVisibility>(
    (user?.default_visibility as ActivityVisibility) || 'friends'
  );
  const [openSpotsText, setOpenSpotsText] = useState(() => {
    const sport = resolvePreferredSportForLaunch(user?.preferred_sports?.[0]);
    return String(getDefaultOpenSpotsForSport(sport));
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
  const [showAdvancedScheduling, setShowAdvancedScheduling] = useState(false);

  useEffect(() => {
    setOpenSpotsText(String(getDefaultOpenSpotsForSport(sportType)));
  }, [sportType]);

  const rosterTotalPlayers = useMemo(() => {
    const open = Number.parseInt(openSpotsText, 10);
    if (!Number.isFinite(open) || open < 0) {
      return getDefaultTotalPlayersForSport(sportType);
    }
    return totalPlayersFromOpenSpots(open);
  }, [openSpotsText, sportType]);

  useEffect(() => {
    if (didRequestInitialLocationRef.current) {
      return;
    }
    didRequestInitialLocationRef.current = true;
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    setSelectedLocationId(null);
    setShowAllCourtsFallback(false);
    setLocationSearch('');
  }, [sportType]);

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
        const radii = getCourtSearchRadiiForSport(sportType);
        let near: ActivityLocation[] = [];
        let matchedRadius = radii[0] ?? CONFIG.NEARBY_COURT_RADIUS_M;

        for (const radius of radii) {
          near = await getNearbyActivityLocations(
            location.latitude,
            location.longitude,
            radius
          );
          const sportMatches = near.filter(
            (loc) => loc.sport_type.toLowerCase() === sportType.toLowerCase()
          );
          if (sportMatches.length > 0) {
            matchedRadius = radius;
            setShowAllCourtsFallback(false);
            setSelectedLocationId((prev) => {
              if (prev && sportMatches.some((loc) => loc.id === prev)) {
                return prev;
              }
              return sportMatches[0].id;
            });
            break;
          }
          matchedRadius = radius;
        }

        const sportMatches = near.filter(
          (loc) => loc.sport_type.toLowerCase() === sportType.toLowerCase()
        );
        setLocations(near);
        setCourtSearchRadiusM(matchedRadius);
        setShowAllCourtsFallback(sportMatches.length === 0 && near.length > 0);
        if (sportMatches.length === 0) {
          setSelectedLocationId(null);
        }
      } catch (error) {
        console.error('Error loading activity locations:', error);
        setLocations([]);
        setCourtSearchRadiusM(CONFIG.NEARBY_COURT_RADIUS_M);
        setShowAllCourtsFallback(false);
        setSelectedLocationId(null);
      } finally {
        setLoadingLocations(false);
      }
    };

    load();
  }, [location, showAllCourtsDev, sportType]);

  useEffect(() => {
    if (visibility === 'friends') {
      setNeedPlayersTonight(false);
    }
  }, [visibility]);

  const formattedStartTime = useMemo(
    () =>
      fixedStartTime.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    [fixedStartTime]
  );

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
      : sportLocations.length > 0
        ? sportLocations[0]?.id ?? null
        : null;
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
      latitude: BETA_REGION.center.latitude,
      longitude: BETA_REGION.center.longitude,
      latitudeDelta: BETA_REGION.mapDelta,
      longitudeDelta: BETA_REGION.mapDelta,
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
    if (showAllCourtsDev) {
      return 'Showing all courts (dev mode). Distances are from your current location.';
    }

    const sportCount = sportLocations.length;
    const radiusKm = (courtSearchRadiusM / 1000).toFixed(
      courtSearchRadiusM >= 10000 ? 0 : 1
    );

    if (sportCount > 0) {
      return `${sportCount} ${sportType.toLowerCase()} court${sportCount === 1 ? '' : 's'} within ${radiusKm} km.`;
    }
    if (locations.length === 0) {
      return `No courts within ${radiusKm} km. Add one below, or set emulator location to LA (34.05, -118.24).`;
    }
    if (showAllCourtsFallback) {
      return `No ${sportType.toLowerCase()} courts within ${radiusKm} km — showing other sports to pick or Add a court.`;
    }
    return `Searching for ${sportType.toLowerCase()} courts…`;
  }, [
    loadingLocation,
    loadingLocations,
    location,
    hasPermission,
    locations.length,
    showAllCourtsDev,
    courtSearchRadiusM,
    sportType,
    sportLocations.length,
    showAllCourtsFallback,
  ]);

  const selectLocation = (loc: ActivityLocation) => {
    setSelectedLocationId(loc.id);
  };

  const handleCourtAdded = (loc: ActivityLocation) => {
    setLocations((prev) => {
      if (prev.some((item) => item.id === loc.id)) {
        return prev;
      }
      return [loc, ...prev];
    });
    setSelectedLocationId(loc.id);
    setShowAllCourtsDev(false);
    setShowAllCourtsFallback(false);
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

    const parsed = Number.parseInt(openSpotsText, 10);
    const missingPlayers = Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
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
        cost_note: costNote.trim() || null,
      });

      void setOnboardingFlag(ONBOARDING_FLAGS.HOST_ONBOARDING_COMPLETED);
      navigation.replace(ROUTES.ACTIVITY.DETAIL as any, { activityId: created.id });

      // Don't make the host hunt for the share button — open the invite sheet right away.
      const inviteUrl = created.invite_token ? buildGameInviteUrl(created.invite_token) : null;
      if (inviteUrl) {
        try {
          await Share.share({
            message: `I'm hosting ${created.sport_type} on Rally — tap to join my game: ${inviteUrl}`,
          });
          void setOnboardingFlag(ONBOARDING_FLAGS.COACH_SHARE_SHOWN);
        } catch {
          // Host dismissed the share sheet; the link is still on the Details screen.
        }
      } else {
        Alert.alert(
          'Game created',
          needPlayersTonight
            ? 'Your urgent game is highlighted on Discover. Find players in My Games and Chats.'
            : 'Your game is on Discover and in My Games. Others nearby can request to join.'
        );
      }
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
        <ScreenHeader title="Host a Game" subtitle={getCreateGameSubtitle(sportType)} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you hosting?</Text>
          <View style={[styles.pill, styles.pillSelected, styles.createKindSelected]}>
            <Text style={[styles.pillText, styles.pillTextSelected]}>{PRODUCT_COPY.publicGame}</Text>
          </View>
          <Text style={styles.createKindHint}>
            Open to discovery — find players for a one-off game.
          </Text>
          <TouchableOpacity
            style={styles.createKindLink}
            onPress={() => {
              if (myRallys.length === 0) {
                Alert.alert(
                  PRODUCT_COPY.startARally,
                  'Start a Rally first, then schedule games from Rally chat or your Rally profile.',
                  [{ text: 'OK' }]
                );
                return;
              }
              if (myRallys.length === 1) {
                navigation.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
                  groupId: myRallys[0].id,
                } as never);
                return;
              }
              Alert.alert(
                'Schedule for a Rally',
                'Pick a Rally to open its profile and schedule from chat.',
                myRallys.map((g) => ({
                  text: g.name,
                  onPress: () =>
                    navigation.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
                      groupId: g.id,
                    } as never),
                }))
              );
            }}
          >
            <Text style={styles.createKindLinkText}>
              Scheduling for {PRODUCT_COPY.rally}? Open your Rally instead →
            </Text>
          </TouchableOpacity>
        </View>

        {showSportPicker ? (
          <View style={[styles.section, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>Sport</Text>
            <View style={styles.wrapRow}>
              {sports.map((sport) => {
                const selected = sportType === sport.name;
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[styles.pill, styles.pillRow, selected && styles.pillSelected]}
                    onPress={() => setSportType(sport.name)}
                  >
                    <MaterialCommunityIcons
                      name={getSportIconName(sport.name)}
                      size={16}
                      color={selected ? '#fff' : colors.primaryDark}
                      style={styles.pillIcon}
                    />
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
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => {
              setShowAdvancedScheduling((v) => {
                const next = !v;
                if (!next) {
                  setSchedulingMode('fixed');
                }
                return next;
              });
            }}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvancedScheduling ? 'Hide advanced scheduling ▲' : 'Advanced scheduling ▼'}
            </Text>
          </TouchableOpacity>
          {showAdvancedScheduling ? (
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
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roster size</Text>
          <Text style={styles.rosterHint}>
            {rosterTotalPlayers} players total including you. Host can finalize early if everyone
            in the room taps Ready.
          </Text>
          <Text style={styles.fieldLabel}>Open spots (besides you)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={openSpotsText}
            onChangeText={setOpenSpotsText}
            placeholder="How many more players?"
          />
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
                    pinColor={selected ? colors.primary : '#34a853'}
                    onPress={() => selectLocation(loc)}
                  />
                );
              })}
            </MapView>
            {(loadingLocation || loadingLocations) && (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </View>

          {sportLocations.length === 0 && locationsWithDistance.length > 0 && showAllCourtsFallback && (
            <View style={styles.fallbackBanner}>
              <Text style={styles.fallbackBannerText}>
                No {sportType.toLowerCase()} courts in this search — showing other nearby courts.
                Pick one anyway or tap Add a court to tag a {sportType.toLowerCase()} spot.
              </Text>
            </View>
          )}

          {SHOW_LOCATION_DEBUG && locations.length > 0 && courtSearchRadiusM > 0 && (
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

          <TouchableOpacity
            style={styles.addCourtBtn}
            onPress={() => setAddCourtSheetVisible(true)}
          >
            <Text style={styles.addCourtBtnText}>
              {locations.length === 0 ? 'Add a court near you' : "Can't find your court? Add one"}
            </Text>
          </TouchableOpacity>
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
          <Text style={styles.linkText}>
            {showAdvanced ? 'Hide options' : 'Duration & who can see'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomTimeRow}>
          <View style={styles.bottomTimeCopy}>
            <Text style={styles.bottomTimeLabel}>Game starts</Text>
            <Text style={styles.bottomTimeValue}>{formattedStartTime}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.linkText}>Change</Text>
          </TouchableOpacity>
        </View>

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
            <Text style={styles.timePickerDone}>Done picking time</Text>
          </TouchableOpacity>
        )}

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
                      {value === 'friends' ? 'Friends only' : 'Nearby players'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.visibilityHint}>
              {visibility === 'friends'
                ? 'Only people you invite can join. Share the link after you publish.'
                : 'Shows on Discover for players near this court.'}
            </Text>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={costNote}
              onChangeText={setCostNote}
              placeholder="Cost note (optional) — e.g. ~$8/person court, BYO drinks"
              maxLength={120}
            />
          </View>
        )}

        {visibility === 'nearby' ? (
          <>
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
            {needPlayersTonight ? (
              <Text style={styles.urgencyHint}>
                Adds a TONIGHT badge on Discover so nearby players notice your game faster.
              </Text>
            ) : null}
          </>
        ) : null}

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
      <AddCourtSheet
        visible={addCourtSheetVisible}
        sportType={sportType as SportType}
        near={location}
        onClose={() => setAddCourtSheetVisible(false)}
        onAdded={handleCourtAdded}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
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
    color: colors.primary,
    fontWeight: '600',
  },
  addCourtBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  addCourtBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
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
  rosterHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
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
    borderColor: colors.primary,
    backgroundColor: '#e8f1ff',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  locationNameSelected: {
    color: colors.primaryDark,
  },
  locationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  locationMetaSelected: {
    color: colors.primaryDark,
  },
  advancedToggle: {
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  advancedBlock: {
    marginBottom: 6,
  },
  bottomTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  bottomTimeCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  bottomTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottomTimeValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  visibilityHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  urgencyHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    textAlign: 'center',
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
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIcon: {
    marginRight: 6,
  },
  pillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  createKindSelected: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  createKindHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  createKindLink: {
    marginTop: spacing.sm,
  },
  createKindLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f0f7ff',
  },
  timePickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  timePickerDone: {
    marginTop: 8,
    textAlign: 'right',
    color: colors.primary,
    fontWeight: '600',
  },
  advancedToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
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
    backgroundColor: colors.primary,
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

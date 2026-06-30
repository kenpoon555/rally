import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ScheduleDateTimePicker, snapDateToMinuteInterval } from '../../components/ScheduleDateTimePicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useMyGames } from '../../hooks/useActivities';
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
  clampRosterMax,
  clampRosterMin,
  formatActivityDurationLabel,
  formatRosterExpectation,
  getDefaultLaunchSportName,
  getCourtSearchRadiiForSport,
  getCreateGameSubtitle,
  getDefaultListingTitle,
  getSportRosterDefaults,
  resolvePreferredSportForLaunch,
  sortSportsForPlayTab,
  SportType,
  usesMeetupLocationPath,
} from '../../constants/sports';
import {
  Button,
  KeyboardSafeView,
  ScreenHeader,
  keyboardAwareScrollProps,
} from '../../components/ui';
import { SportPickerSheet } from '../../components/discover/SportPickerSheet';
import { createActivity } from '../../services/activityService';
import { updateUserProfile } from '../../services/userService';
import { shareGameInvite } from '../../services/inviteLinkService';
import { createCoachClassListing } from '../../services/coachClassListingService';
import {
  ensureClassInvite,
  shareClassEnrollmentInvite,
} from '../../services/studentEnrollmentService';
import { ONBOARDING_FLAGS, setOnboardingFlag } from '../../constants/onboardingFlags';
import {
  getAllActivityLocations,
  getNearbyActivityLocations,
} from '../../services/locationService';
import { ActivityLocation } from '../../types/location';
import { calculateDistance } from '../../utils/distance';
import { formatDistanceLabel, formatSearchRadiusLabel } from '../../utils/formatDistance';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSportIconName } from '../../components/SportIcon';
import { AddCourtSheet } from '../../components/AddCourtSheet';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { getMyRegularGroups } from '../../services/regularGroupService';
import { buildPlayStripSports, bumpPreferredSportsMru } from '../../utils/buildPlayStripSports';
import { orderSportsAttended } from '../../utils/profileScorecardHelpers';
import { RegularGroup } from '../../types/regularGroup';
import { SHOW_LOCATION_DEBUG } from '../../constants/devFlags';
import {
  getDefaultDurationFromTemplate,
  getListingTitleHint,
} from '../../services/sportTemplateService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateActivity'>;

type LocationWithDistance = ActivityLocation & { distanceMeters: number | null };

const CREATE_GAME_MINUTE_INTERVAL = 30;

function defaultPublicGameStartTime(): Date {
  const next = new Date();
  next.setMinutes(next.getMinutes() + 60);
  return snapDateToMinuteInterval(next, CREATE_GAME_MINUTE_INTERVAL);
}

const CreateActivityScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, refreshUser } = useAuth();

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
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardInset(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const { sports } = useSportsCatalog();
  const { games: myGames } = useMyGames(user?.id ?? '');
  const launchSportName = sports[0]?.name ?? getDefaultLaunchSportName();

  const [locations, setLocations] = useState<ActivityLocation[]>([]);
  const [courtSearchRadiusM, setCourtSearchRadiusM] = useState(CONFIG.COURT_SEARCH_NEARBY_RADIUS_M);
  const [courtSearchWidened, setCourtSearchWidened] = useState(false);
  const [showAllCourtsDev, setShowAllCourtsDev] = useState(false);
  const [myRallys, setMyRallys] = useState<RegularGroup[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needPlayersTonight, setNeedPlayersTonight] = useState(false);
  const [isIntroSession, setIsIntroSession] = useState(false);
  const [titleHint, setTitleHint] = useState<string | null>(null);
  const [costNote, setCostNote] = useState('');
  const [listingTitle, setListingTitle] = useState(() => {
    const prefill = route.params?.prefillTitle?.trim();
    if (prefill) {
      return prefill;
    }
    return getDefaultListingTitle(resolvePreferredSportForLaunch(user?.preferred_sports?.[0]));
  });
  const [sessionNote, setSessionNote] = useState('');
  const didRequestInitialLocationRef = useRef(false);
  const listingTitleTouchedRef = useRef(false);
  const hasPrefillTitle = Boolean(route.params?.prefillTitle?.trim());

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [meetAreaText, setMeetAreaText] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [addCourtSheetVisible, setAddCourtSheetVisible] = useState(false);
  const [sportPickerOpen, setSportPickerOpen] = useState(false);
  const [sportType, setSportType] = useState<string>(() =>
    resolvePreferredSportForLaunch(user?.preferred_sports?.[0])
  );
  const [duration, setDuration] = useState<(typeof ACTIVITY_DURATIONS)[number]>(
    (user?.default_duration as (typeof ACTIVITY_DURATIONS)[number]) || 60
  );
  const [visibility, setVisibility] = useState<ActivityVisibility>(
    (user?.default_visibility as ActivityVisibility) || 'friends'
  );
  const [rosterMin, setRosterMin] = useState(() => {
    const sport = resolvePreferredSportForLaunch(user?.preferred_sports?.[0]);
    return getSportRosterDefaults(sport).defaultMin;
  });
  const [rosterMax, setRosterMax] = useState(() => {
    const sport = resolvePreferredSportForLaunch(user?.preferred_sports?.[0]);
    return getSportRosterDefaults(sport).defaultMax;
  });
  const defaultFixedStart = useMemo(() => defaultPublicGameStartTime(), []);
  const [fixedStartTime, setFixedStartTime] = useState(defaultFixedStart);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    const prefill = route.params?.prefillStartTime;
    if (prefill) {
      const parsed = new Date(prefill);
      if (!Number.isNaN(parsed.getTime())) {
        setFixedStartTime(snapDateToMinuteInterval(parsed, CREATE_GAME_MINUTE_INTERVAL));
      }
    }
    if (route.params?.prefillTitle?.trim()) {
      setListingTitle(route.params.prefillTitle.trim());
      listingTitleTouchedRef.current = true;
    }
    const groupId = route.params?.prefillGroupId;
    if (groupId) {
      const rally = myRallys.find((g) => g.id === groupId);
      if (rally?.default_location_id) {
        setSelectedLocationId(rally.default_location_id);
      }
    }
  }, [
    route.params?.prefillStartTime,
    route.params?.prefillTitle,
    route.params?.prefillGroupId,
    myRallys,
  ]);

  useEffect(() => {
    void (async () => {
      const [durationMins, hint] = await Promise.all([
        getDefaultDurationFromTemplate(sportType),
        getListingTitleHint(sportType),
      ]);
      const defaults = getSportRosterDefaults(sportType);
      setRosterMin(defaults.defaultMin);
      setRosterMax(defaults.defaultMax);
      if (ACTIVITY_DURATIONS.includes(durationMins as (typeof ACTIVITY_DURATIONS)[number])) {
        setDuration(durationMins as (typeof ACTIVITY_DURATIONS)[number]);
      }
      const suggestedTitle = getDefaultListingTitle(sportType, hint);
      setTitleHint(suggestedTitle);
      if (!listingTitleTouchedRef.current && !hasPrefillTitle) {
        setListingTitle(suggestedTitle);
      }
    })();
  }, [sportType, hasPrefillTitle]);

  const rosterDefaults = useMemo(() => getSportRosterDefaults(sportType), [sportType]);
  const rosterExpectationCopy = formatRosterExpectation(rosterMin, rosterMax);

  const orderedSports = useMemo(() => sortSportsForPlayTab(sports), [sports]);
  const attendedSports = useMemo(
    () =>
      orderSportsAttended(
        [...myGames.active, ...myGames.past],
        user?.preferred_sports ?? []
      ),
    [myGames.active, myGames.past, user?.preferred_sports]
  );

  const { stripSports: sportBarSports, showMore: showSportPickerOverflow } = useMemo(
    () =>
      buildPlayStripSports({
        catalogSports: orderedSports,
        selectedSport: sportType,
        preferredSports: user?.preferred_sports ?? [],
        attendedSports,
      }),
    [orderedSports, sportType, user?.preferred_sports, attendedSports]
  );

  const extraSportCount = showSportPickerOverflow
    ? Math.max(0, orderedSports.length - sportBarSports.length)
    : 0;

  const adjustRosterMin = (delta: number) => {
    setRosterMin((prev) => {
      const next = clampRosterMin(sportType, prev + delta, rosterMax);
      if (next > rosterMax) {
        setRosterMax(next);
      }
      return next;
    });
  };

  const adjustRosterMax = (delta: number) => {
    setRosterMax((prev) => {
      const next = clampRosterMax(sportType, prev + delta, rosterMin);
      if (next < rosterMin) {
        setRosterMin(next);
      }
      return next;
    });
  };

  const handleSportChange = (nextSport: string) => {
    setSportType(nextSport);
    const defaults = getSportRosterDefaults(nextSport);
    setRosterMin(defaults.defaultMin);
    setRosterMax(defaults.defaultMax);
    if (!user?.id) {
      return;
    }
    const nextMru = bumpPreferredSportsMru(user.preferred_sports, nextSport);
    const unchanged =
      nextMru.length === (user.preferred_sports?.length ?? 0) &&
      nextMru.every((value, index) => value === user.preferred_sports?.[index]);
    if (unchanged) {
      return;
    }
    void updateUserProfile(user.id, {
      preferred_sports: nextMru as typeof user.preferred_sports,
    })
      .then(() => refreshUser())
      .catch(() => {
        // Local sport selection still applies.
      });
  };

  useEffect(() => {
    if (didRequestInitialLocationRef.current) {
      return;
    }
    didRequestInitialLocationRef.current = true;
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    setSelectedLocationId(null);
    setLocationSearch('');
  }, [sportType]);

  useEffect(() => {
    const load = async () => {
      if (!location) {
        setLocations([]);
        setCourtSearchRadiusM(CONFIG.COURT_SEARCH_NEARBY_RADIUS_M);
        setCourtSearchWidened(false);
        setShowAllCourtsDev(false);
        return;
      }

      if (showAllCourtsDev) {
        setLoadingLocations(true);
        try {
          const all = await getAllActivityLocations(100);
          setLocations(all);
          setCourtSearchRadiusM(0);
          const sportMatches = all.filter(
            (loc) => loc.sport_type.toLowerCase() === sportType.toLowerCase()
          );
          setSelectedLocationId((prev) => {
            if (prev && sportMatches.some((loc) => loc.id === prev)) {
              return prev;
            }
            return sportMatches[0]?.id ?? null;
          });
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
        let matchedRadius = radii[0] ?? CONFIG.COURT_SEARCH_NEARBY_RADIUS_M;
        let widened = false;

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
            widened = radius > (radii[0] ?? CONFIG.COURT_SEARCH_NEARBY_RADIUS_M);
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

        setLocations(near);
        setCourtSearchRadiusM(matchedRadius);
        setCourtSearchWidened(widened);
        const sportMatches = near.filter(
          (loc) => loc.sport_type.toLowerCase() === sportType.toLowerCase()
        );
        if (sportMatches.length === 0) {
          setSelectedLocationId(null);
        }
      } catch (error) {
        console.error('Error loading activity locations:', error);
        setLocations([]);
        setCourtSearchRadiusM(CONFIG.COURT_SEARCH_NEARBY_RADIUS_M);
        setCourtSearchWidened(false);
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
  const filteredLocations = !keyword
    ? sportLocations
    : sportLocations.filter((loc) => {
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
  const usesMeetupLocation = usesMeetupLocationPath(sportType);

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
    const nearbyLabel = formatSearchRadiusLabel(CONFIG.COURT_SEARCH_NEARBY_RADIUS_M);
    const wideLabel = formatSearchRadiusLabel(CONFIG.COURT_SEARCH_WIDE_RADIUS_M);

    if (sportCount > 0) {
      if (courtSearchWidened) {
        return `No ${sportType.toLowerCase()} courts within ${nearbyLabel} — showing ${sportCount} within ${wideLabel}.`;
      }
      return `${sportCount} ${sportType.toLowerCase()} court${sportCount === 1 ? '' : 's'} within ${nearbyLabel}.`;
    }
    if (locations.length === 0) {
      return `No courts within ${wideLabel}. Add a ${sportType.toLowerCase()} court below.`;
    }
    return `No ${sportType.toLowerCase()} courts within ${wideLabel}. Add one below.`;
  }, [
    loadingLocation,
    loadingLocations,
    location,
    hasPermission,
    locations.length,
    showAllCourtsDev,
    courtSearchWidened,
    sportType,
    sportLocations.length,
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
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in and try again.');
      return;
    }
    if (!usesMeetupLocation && !effectiveSelectedLocationId) {
      Alert.alert('No court selected', 'Pick a court on the map or list first.');
      return;
    }
    const meetAreaTrimmed = meetAreaText.trim();
    if (usesMeetupLocation && meetAreaTrimmed.length < 3) {
      Alert.alert(
        'Add meet area',
        'Enter a park, neighborhood, or area name. Pin the exact spot in game chat.'
      );
      return;
    }
    const titleTrimmed = listingTitle.trim();
    if (titleTrimmed.length < 3) {
      Alert.alert(
        route.params?.createMode === 'class' ? 'Add a class title' : 'Add a listing title',
        route.params?.createMode === 'class'
          ? 'Help parents understand your class — e.g. "Youth Basketball Clinic".'
          : 'Help players understand your game — e.g. "AM training partner" or "Indoor court split $80/hr — need 10".'
      );
      return;
    }

    const locationName = usesMeetupLocation
      ? meetAreaTrimmed
      : selectedLocation?.name ??
        locationsWithDistance.find((loc) => loc.id === effectiveSelectedLocationId)?.name ??
        'TBD';

    if (route.params?.createMode === 'class') {
      setSaving(true);
      try {
        const listing = await createCoachClassListing({
          coachUserId: user.id,
          title: titleTrimmed,
          sportType: sportType as SportType,
          locationName,
          startTime: fixedStartTime.toISOString(),
          durationMinutes: duration,
          feeNote: costNote.trim() || null,
        });

        const invite = await ensureClassInvite(
          user.id,
          listing.id,
          listing.title,
          listing.sport_type
        );

        navigation.replace(ROUTES.COACH_PARENT.CLASS_DETAIL, {
          classId: listing.id,
        });

        try {
          await shareClassEnrollmentInvite(invite);
        } catch {
          // Coach dismissed share sheet; invite remains on ClassDetail.
        }
      } catch (error: unknown) {
        Alert.alert(
          'Publish failed',
          error instanceof Error ? error.message : 'Could not publish class.'
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    const missingPlayers = Math.max(0, rosterMax - 1);

    setSaving(true);
    try {
      const created = await createActivity({
        user_id: user.id,
        location_id: usesMeetupLocation ? null : effectiveSelectedLocationId,
        sport_type: sportType as SportType,
        start_time: fixedStartTime.toISOString(),
        duration,
        visibility,
        missing_players: missingPlayers,
        roster_min: rosterMin,
        roster_max: rosterMax,
        scheduling_mode: 'fixed',
        match_status: 'open',
        urgency_level: needPlayersTonight ? 'tonight' : 'normal',
        cost_note: costNote.trim() || null,
        session_note: usesMeetupLocation
          ? `Meet area: ${meetAreaTrimmed}${sessionNote.trim() ? ` — ${sessionNote.trim()}` : ''}`
          : sessionNote.trim() || null,
        listing_title: titleTrimmed,
        play_intent: 'pickup',
        is_intro_session: isIntroSession && visibility === 'nearby',
      });

      void setOnboardingFlag(ONBOARDING_FLAGS.HOST_ONBOARDING_COMPLETED);
      navigation.replace(ROUTES.ACTIVITY.DETAIL as any, { activityId: created.id });

      // Don't make the host hunt for the share button — open the invite sheet right away.
      if (created.invite_token) {
        try {
          await shareGameInvite(created, { asHost: true });
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
        style={[styles.courtCard, selected && styles.courtCardSelected]}
        onPress={() => selectLocation(loc)}
        activeOpacity={0.85}
      >
        <View style={styles.courtCardBody}>
          <Text style={[styles.courtName, selected && styles.courtNameSelected]} numberOfLines={2}>
            {loc.name}
          </Text>
          <Text style={styles.courtMeta}>
            {loc.sport_type} · {distanceLabel}
          </Text>
        </View>
        {selected ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        ) : (
          <Ionicons name="ellipse-outline" size={20} color={colors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardSafeView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardInset > 0 ? { paddingBottom: keyboardInset + 120 } : { paddingBottom: 120 },
        ]}
        {...keyboardAwareScrollProps}
      >
        {route.params?.createMode === 'class' ? (
          <View style={styles.classModeBanner}>
            <Text style={styles.classModeTitle}>Class / Clinic</Text>
            <Text style={styles.classModeBody}>
              Coach-only create flow — enrollments and roster ship in v1.3.
            </Text>
          </View>
        ) : null}
        <ScreenHeader title={PRODUCT_COPY.createGame} subtitle={getCreateGameSubtitle(sportType)} />

        <Text style={styles.sectionLabel}>Sport</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportBar}
        >
          {sportBarSports.map((sport) => {
            const selected = sportType === sport.name;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.sportBarChip, selected && styles.sportBarChipSelected]}
                onPress={() => handleSportChange(sport.name)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={getSportIconName(sport.name)}
                  size={14}
                  color={selected ? colors.primaryDark : colors.textSecondary}
                  style={styles.sportChipIcon}
                />
                <Text
                  style={[styles.sportBarChipText, selected && styles.sportBarChipTextSelected]}
                  numberOfLines={1}
                >
                  {sport.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {extraSportCount > 0 ? (
            <TouchableOpacity
              style={styles.sportBarMoreChip}
              onPress={() => setSportPickerOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`All sports, ${extraSportCount} more`}
            >
              <Text style={styles.sportBarMoreTitle} numberOfLines={1}>
                All sports{' '}
                <Text style={styles.sportBarMoreSub}>(+{extraSportCount})</Text>
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <Text style={styles.sectionLabel}>Title</Text>
        <View style={styles.fieldCard}>
          <TextInput
            style={styles.input}
            value={listingTitle}
            onChangeText={(text) => {
              listingTitleTouchedRef.current = true;
              setListingTitle(text);
            }}
            placeholder={titleHint ?? getDefaultListingTitle(sportType)}
            placeholderTextColor={colors.textTertiary}
            maxLength={80}
          />
          <Text style={styles.fieldHint}>Players see this first on Discover and Play.</Text>
        </View>

        <Text style={styles.sectionLabel}>When</Text>
        <View style={styles.fieldCard}>
          <ScheduleDateTimePicker
            visible
            value={fixedStartTime}
            minuteInterval={CREATE_GAME_MINUTE_INTERVAL}
            onChange={(date) =>
              setFixedStartTime(snapDateToMinuteInterval(date, CREATE_GAME_MINUTE_INTERVAL))
            }
          />
          <Text style={styles.fieldMeta}>{formattedStartTime}</Text>
        </View>

        <Text style={styles.sectionLabel}>{PRODUCT_COPY.rosterSection}</Text>
        <View style={styles.fieldCard}>
          <View style={styles.rosterRow}>
            <Text style={styles.rosterRowLabel}>{PRODUCT_COPY.rosterLockAt}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustRosterMin(-1)}
                disabled={rosterMin <= rosterDefaults.floorMin}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>
                {rosterMin} player{rosterMin === 1 ? '' : 's'}
              </Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustRosterMin(1)}
                disabled={rosterMin >= rosterMax}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rosterRow}>
            <Text style={styles.rosterRowLabel}>{PRODUCT_COPY.rosterUpTo}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustRosterMax(-1)}
                disabled={rosterMax <= rosterMin}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>
                {rosterMax} player{rosterMax === 1 ? '' : 's'}
              </Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustRosterMax(1)}
                disabled={rosterMax >= rosterDefaults.ceilingMax}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.fieldHint}>{rosterExpectationCopy}</Text>
          <Text style={styles.fieldHint}>{PRODUCT_COPY.rosterLockHint}</Text>
          <View style={styles.durationRow}>
            {ACTIVITY_DURATIONS.map((dur) => {
              const selected = duration === dur;
              return (
                <TouchableOpacity
                  key={dur}
                  style={[styles.durationChip, selected && styles.durationChipSelected]}
                  onPress={() => setDuration(dur)}
                >
                  <Text
                    style={[styles.durationChipText, selected && styles.durationChipTextSelected]}
                  >
                    {formatActivityDurationLabel(dur)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Where</Text>
        {usesMeetupLocation ? (
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.input}
              value={meetAreaText}
              onChangeText={setMeetAreaText}
              placeholder="e.g. Griffith Park area, Rose Bowl loop"
              placeholderTextColor={colors.textTertiary}
              maxLength={120}
            />
            <Text style={styles.fieldHint}>
              Ballpark meet area only — pin the exact spot in game chat after you publish.
            </Text>
          </View>
        ) : (
          <>
        {courtStatusMessage ? <Text style={styles.statusText}>{courtStatusMessage}</Text> : null}

        <View style={styles.mapWrap}>
          <TouchableOpacity style={styles.mapRefresh} onPress={fetchLocation}>
            <Text style={styles.mapRefreshText}>Refresh</Text>
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

        {sportLocations.length === 0 && !loadingLocation && !loadingLocations ? (
          <View style={styles.emptyCourtBlock}>
            <Text style={styles.emptyCourtText}>
              No {sportType.toLowerCase()} courts nearby yet.
            </Text>
            <Button
              title={`Add a ${sportType.toLowerCase()} court`}
              variant="secondary"
              size="sm"
              onPress={() => setAddCourtSheetVisible(true)}
            />
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          value={locationSearch}
          onChangeText={setLocationSearch}
          placeholder="Search courts"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
        />

        <Text style={styles.listMeta}>
          {filteredLocations.length === 0
            ? 'No courts match.'
            : `${filteredLocations.length} court${filteredLocations.length === 1 ? '' : 's'} nearby`}
        </Text>

        {visibleLocations.map((loc) => (
          <React.Fragment key={loc.id}>{renderCourtRow({ item: loc })}</React.Fragment>
        ))}

        {!loadingLocation && !loadingLocations && visibleLocations.length === 0 ? (
          <Text style={styles.helperText}>
            {location ? 'Try Refresh or add a court below.' : 'Enable location to load courts.'}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.addCourtLink}
          onPress={() => setAddCourtSheetVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.rallyLinkText}>
            {locations.length === 0 ? (
              <Text style={styles.rallyLinkAction}>Add a court near you →</Text>
            ) : (
              <Text>
                <Text style={styles.rallyLinkMuted}>Can&apos;t find your court? </Text>
                <Text style={styles.rallyLinkAction}>Add One →</Text>
              </Text>
            )}
          </Text>
        </TouchableOpacity>

        {SHOW_LOCATION_DEBUG && locations.length > 0 && courtSearchRadiusM > 0 ? (
          <TouchableOpacity onPress={() => setShowAllCourtsDev(true)}>
            <Text style={styles.devLink}>Dev: browse all courts</Text>
          </TouchableOpacity>
        ) : null}
          </>
        )}

        <Text style={styles.sectionLabel}>Details (optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={sessionNote}
          onChangeText={setSessionNote}
          placeholder={
            usesMeetupLocation
              ? 'Pace, distance, or format hint'
              : 'Court #, skill level, split cost, etc.'
          }
          placeholderTextColor={colors.textTertiary}
          maxLength={200}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={styles.moreToggle}
          onPress={() => setShowMoreOptions((value) => !value)}
          activeOpacity={0.85}
        >
          <Text style={styles.moreToggleText}>
            {showMoreOptions ? 'Hide options' : 'More options'}
          </Text>
          <Ionicons
            name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primaryDark}
          />
        </TouchableOpacity>

        {showMoreOptions ? (
          <View style={styles.moreBlock}>
            <Text style={styles.moreLabel}>Who can see</Text>
            <View style={styles.optionRow}>
              {CREATE_ACTIVITY_VISIBILITY.map((value) => {
                const selected = visibility === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.optionBtn, selected && styles.optionBtnSelected]}
                    onPress={() => setVisibility(value)}
                  >
                    <Text style={[styles.optionBtnText, selected && styles.optionBtnTextSelected]}>
                      {value === 'friends' ? 'Friends only' : 'Nearby players'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldHint}>
              {visibility === 'friends'
                ? 'Invite-only — share the link after you publish.'
                : 'Shows on Discover for players near this court.'}
            </Text>

            {visibility === 'nearby' ? (
              <>
                <TouchableOpacity
                  style={[styles.toggleRow, isIntroSession && styles.toggleRowSelected]}
                  onPress={() => setIsIntroSession((value) => !value)}
                >
                  <Text style={styles.toggleRowText}>
                    {isIntroSession ? '✓ ' : ''}Intro session (stranger-friendly)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleRow, needPlayersTonight && styles.toggleRowUrgent]}
                  onPress={() => setNeedPlayersTonight((value) => !value)}
                >
                  <Text
                    style={[
                      styles.toggleRowText,
                      needPlayersTonight && styles.toggleRowTextUrgent,
                    ]}
                  >
                    {needPlayersTonight ? '✓ ' : ''}Need players tonight
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            <TextInput
              style={styles.input}
              value={costNote}
              onChangeText={setCostNote}
              placeholder="Cost note — e.g. ~$8/person court fee"
              placeholderTextColor={colors.textTertiary}
              maxLength={120}
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.rallyLink}
          onPress={() => {
            if (myRallys.length === 0) {
              Alert.alert(
                PRODUCT_COPY.startARally,
                'Start a Rally first, then create games from the Play tab.',
                [{ text: 'OK' }]
              );
              return;
            }
            if (myRallys.length === 1) {
              navigation.navigate(ROUTES.REGULAR_GROUP.CREW, {
                groupId: myRallys[0].id,
                initialTab: 'play',
              });
              return;
            }
            Alert.alert(
              'Open a Rally',
              'Pick a Rally to create a game for your crew.',
              myRallys.map((group) => ({
                text: group.name,
                onPress: () =>
                  navigation.navigate(ROUTES.REGULAR_GROUP.CREW, {
                    groupId: group.id,
                    initialTab: 'play',
                  }),
              }))
            );
          }}
        >
          <Text style={styles.rallyLinkText}>
            <Text style={styles.rallyLinkMuted}>Creating for {PRODUCT_COPY.rally}? </Text>
            <Text style={styles.rallyLinkAction}>Open your Rally →</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        {usesMeetupLocation ? (
          meetAreaText.trim().length >= 3 ? (
            <View style={styles.footerCourt}>
              <Ionicons name="map-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.footerCourtText} numberOfLines={1}>
                {meetAreaText.trim()}
              </Text>
            </View>
          ) : (
            <Text style={styles.footerHint}>Add meet area to publish</Text>
          )
        ) : selectedLocation ? (
          <View style={styles.footerCourt}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.footerCourtText} numberOfLines={1}>
              {selectedLocation.name} · {formatDistanceLabel(selectedLocation.distanceMeters)}
            </Text>
          </View>
        ) : (
          <Text style={styles.footerHint}>Pick a court to publish</Text>
        )}
        <Button
          title={
            saving
              ? 'Publishing…'
              : route.params?.createMode === 'class'
                ? 'Publish class'
                : 'Publish game'
          }
          onPress={() => void handleCreate()}
          loading={saving}
          disabled={saving || !effectiveSelectedLocationId}
        />
      </View>

      <AddCourtSheet
        visible={addCourtSheetVisible}
        sportType={sportType as SportType}
        near={location}
        onClose={() => setAddCourtSheetVisible(false)}
        onAdded={handleCourtAdded}
      />

      <SportPickerSheet
        visible={sportPickerOpen}
        sports={sports}
        selectedSport={sportType}
        recentSportNames={user?.preferred_sports ?? []}
        onSelect={handleSportChange}
        onClose={() => setSportPickerOpen(false)}
      />
    </KeyboardSafeView>
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
    padding: spacing.lg,
  },
  classModeBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  classModeBody: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sportBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  sportBarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sportBarChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  sportBarChipText: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sportBarChipTextSelected: {
    color: colors.primaryDark,
  },
  sportBarMoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sportBarMoreTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sportBarMoreSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  sportChipIcon: {
    marginRight: 4,
  },
  emptyCourtBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  emptyCourtText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  fieldMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rosterRowLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 56,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepperValue: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  durationChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  durationChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  durationChipTextSelected: {
    color: colors.primaryDark,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  mapWrap: {
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  map: {
    flex: 1,
  },
  mapRefresh: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapRefreshText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 12,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBanner: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 122, 94, 0.2)',
  },
  fallbackBannerText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 17,
  },
  listMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  courtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  courtCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  courtCardBody: {
    flex: 1,
    minWidth: 0,
  },
  courtName: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  courtNameSelected: {
    color: colors.primaryDark,
  },
  courtMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  addCourtLink: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  devLink: {
    marginBottom: spacing.sm,
    color: colors.textTertiary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  moreToggleText: {
    ...typography.bodyMedium,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
  moreBlock: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  moreLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  optionBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionBtnTextSelected: {
    color: colors.primaryDark,
  },
  toggleRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  toggleRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  toggleRowUrgent: {
    borderColor: colors.error,
    backgroundColor: '#fff5f5',
  },
  toggleRowText: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  toggleRowTextUrgent: {
    color: colors.error,
  },
  rallyLink: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rallyLinkText: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  rallyLinkMuted: {
    color: colors.textSecondary,
  },
  rallyLinkAction: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    gap: spacing.sm,
  },
  footerCourt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerCourtText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  footerHint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});

export default CreateActivityScreen;

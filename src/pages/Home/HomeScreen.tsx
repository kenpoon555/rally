import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useActivities } from '../../hooks/useActivities';
import { useGeofence } from '../../hooks/useGeofence';
import GameCard from '../../components/GameCard';
import ActivityConfirmationModal from '../../components/ActivityConfirmationModal';
import { ActivityLocation } from '../../types/location';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../../constants/routes';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { resolveUserDefaultSport } from '../../constants/sports';
import { updateUserProfile } from '../../services/userService';
import { SHOW_LOCATION_DEBUG_PANEL } from '../../constants/devFlags';
import { getTotalUnreadCount } from '../../services/chatService';
import { getCurrentLocation } from '../../services/locationService';
import { DevLocationLogPanel } from '../../components/DevLocationLogPanel';
import DiscoverPipelinePanel from '../../components/DiscoverPipelinePanel';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { addLocationLog } from '../../utils/devLocationLog';
import { shouldShowInDiscoverFeed, sortActivitiesByDistance } from '../../utils/activityHelpers';
import { getBlockedUserIds } from '../../services/safetyService';

function runRawLocationTest() {
  addLocationLog('Raw test: started (expo-location)');
  getCurrentLocation()
    .then((loc) => {
      const msg = `Raw test SUCCESS: lat=${loc.latitude.toFixed(4)} lng=${loc.longitude.toFixed(4)}`;
      addLocationLog(msg);
      console.log('SUCCESS', JSON.stringify(loc));
    })
    .catch((err) => {
      const msg = `Raw test FAIL: ${err.message}`;
      addLocationLog(msg);
      console.log('FAIL', err.message);
    });
}

type TabParamList = {
  Home: undefined;
  Chats: undefined;
  MyGames: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const locState = useLocation(false, { skipPermissionCheckOnMount: Platform.OS === 'android' });
  const location = locState?.location ?? null;
  const fetchLocation = locState?.fetchLocation ?? (async () => {});
  const hasPermission = locState?.hasPermission ?? false;
  const locationError = locState?.error;
  const locationLoading = locState?.loading ?? false;
  const { sports } = useSportsCatalog();
  const defaultSport = resolveUserDefaultSport(user?.preferred_sports?.[0]);
  const showSportFilters = sports.length > 1;
  const [selectedSport, setSelectedSport] = useState(defaultSport);
  const effectiveSportFilter = selectedSport;

  const preferredSport = user?.preferred_sports?.[0];
  useEffect(() => {
    setSelectedSport(resolveUserDefaultSport(preferredSport));
  }, [preferredSport]);

  const discoverTitle = `${selectedSport} near you`;

  const emptyGamesLabel = `No ${selectedSport.toLowerCase()} games nearby yet`;

  const handleSportFilter = useCallback(
    async (sport: string) => {
      setSelectedSport(sport);
      if (!user?.id || user.preferred_sports?.[0] === sport) {
        return;
      }
      try {
        await updateUserProfile(user.id, {
          preferred_sports: [sport] as typeof user.preferred_sports,
        });
        await refreshUser();
      } catch {
        // Filter still applies locally; profile sync can retry from Profile.
      }
    },
    [user, refreshUser]
  );

  const { activities, loading, error: discoverError, refetch } = useActivities(
    location || undefined,
    effectiveSportFilter
  );

  const sortedActivities = useMemo(
    () => sortActivitiesByDistance(activities, location),
    [activities, location]
  );
  const [detectedLocation, setDetectedLocation] = useState<ActivityLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  const visibleActivities = useMemo(() => {
    const filtered = sortedActivities
      .filter((a) => !blockedUserIds.has(a.user_id))
      .filter((a) => shouldShowInDiscoverFeed(a, user?.id));
    const byDistance = sortActivitiesByDistance(filtered, location);
    return [...byDistance].sort((a, b) => {
      const aTonight = a.urgency_level === 'tonight' ? 1 : 0;
      const bTonight = b.urgency_level === 'tonight' ? 1 : 0;
      return bTonight - aTonight;
    });
  }, [sortedActivities, blockedUserIds, user?.id, location]);

  const showInitialLoading = loading && visibleActivities.length === 0;

  const onboardingTips = useMemo(
    () => [
      'Turn on location to see courts and games near you.',
      'Pull down to refresh the list.',
      'No games yet? Create the first game nearby.',
    ],
    []
  );

  useEffect(() => {
    const loadUnread = async () => {
      if (!user?.id) {
        setUnreadChats(0);
        return;
      }
      try {
        const total = await getTotalUnreadCount(user.id);
        setUnreadChats(total);
      } catch {
        setUnreadChats(0);
      }
    };
    loadUnread();
  }, [user?.id, activities.length]);

  useEffect(() => {
    if (!user?.id) {
      setBlockedUserIds(new Set());
      return;
    }
    getBlockedUserIds(user.id)
      .then((ids) => setBlockedUserIds(new Set(ids)))
      .catch(() => setBlockedUserIds(new Set()));
  }, [user?.id]);

  const onGeofenceLocationDetected = useCallback((loc: ActivityLocation) => {
    setDetectedLocation(loc);
    setModalVisible(true);
  }, []);

  useGeofence(location, {
    onLocationDetected: onGeofenceLocationDetected,
    enabled: !!location && !!user,
  });

  useFocusEffect(
    useCallback(() => {
      if (authLoading) {
        return;
      }
      refetch();
    }, [authLoading, refetch])
  );

  const handleActivityCreated = () => {
    refetch();
  };

  const handleRefresh = async () => {
    await fetchLocation();
    await refetch();
    setHasFetchedOnce(true);
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }
    refetch();
  }, [authLoading, user?.id, location?.latitude, location?.longitude, refetch]);

  const openCreateGame = () => {
    navigation.navigate(ROUTES.ACTIVITY.CREATE as any);
  };

  const openNearbyCourtsMap = () => {
    navigation.getParent()?.navigate(ROUTES.HOME.MAP as never);
  };

  const openProfile = () => {
    navigation.navigate(ROUTES.PROFILE.MAIN as any);
  };

  const openChats = () => {
    navigation.navigate(ROUTES.CHAT.TAB as never);
  };

  const handleQuickMatch = () => {
    if (visibleActivities.length > 0) {
      navigation.navigate(ROUTES.ACTIVITY.DETAIL as any, {
        activityId: visibleActivities[0].id,
      });
      return;
    }
    openCreateGame();
  };

  const locationSetupMessage = locationLoading
    ? 'Finding your location…'
      : hasPermission && locationError
        ? locationError.message?.toLowerCase().includes('timed out')
          ? 'Location timed out. On the emulator: ⋯ → Location → set a point, wait 2s, tap Find my location.'
          : locationError.message || "We couldn't read your location. Try again."
        : hasPermission
          ? 'Tap Find my location below (emulator: set mock location in Extended controls first).'
          : 'Enable location to see games and courts near you.';

  return (
    <View style={styles.container}>
      {SHOW_LOCATION_DEBUG_PANEL && (
        <ErrorBoundary fallback={null}>
          <DevLocationLogPanel onRawTest={runRawLocationTest} />
        </ErrorBoundary>
      )}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>{discoverTitle}</Text>
            <Text style={styles.subtitle}>Find a game or host one at a nearby court</Text>
            <Text style={styles.privacyHint}>
              Distances and map pins are approximate until you join a game.
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={openProfile}>
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryHeaderButton} onPress={openCreateGame}>
            <Text style={styles.primaryHeaderButtonText}>Create Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMatchButton} onPress={handleQuickMatch}>
            <Text style={styles.quickMatchButtonText}>Quick Match</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatsButton} onPress={openChats}>
            <Text style={styles.chatsButtonText}>
              Chats{unreadChats > 0 ? ` (${unreadChats})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.nearbyCourtsLink} onPress={openNearbyCourtsMap}>
          <Text style={styles.nearbyCourtsLinkText}>Browse nearby courts on map →</Text>
        </TouchableOpacity>
        <Text style={styles.preferenceHint}>
          Default sport: {defaultSport} • {user?.default_duration || 60} min •{' '}
          {user?.default_visibility || 'nearby'}
        </Text>
      </View>

      {!location && (
        <View style={styles.locationSetupCard}>
          <Text style={styles.locationSetupTitle}>Location setup</Text>
          <Text style={styles.locationSetupBody}>{locationSetupMessage}</Text>
          {!hasPermission && !locationLoading && (
            <View style={styles.locationButtonRow}>
              <TouchableOpacity style={styles.retryLocationButton} onPress={() => fetchLocation()}>
                <Text style={styles.retryLocationText}>Enable location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsLocationButton}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.settingsLocationText}>Settings</Text>
              </TouchableOpacity>
            </View>
          )}
          {hasPermission && !locationLoading && (
            <TouchableOpacity style={styles.retryLocationButton} onPress={() => fetchLocation()}>
              <Text style={styles.retryLocationText}>
                {locationError ? 'Try again' : 'Find my location'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {discoverError && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>{discoverError.message}</Text>
        </View>
      )}

      {showSportFilters && (
        <View style={styles.filterRow}>
          {sports.map((sport) => {
            const selected = selectedSport === sport.name;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => void handleSportFilter(sport.name)}
              >
                <Text
                  style={[styles.filterChipText, selected && styles.filterChipTextSelected]}
                >
                  {sport.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading nearby games…</Text>
        </View>
      ) : (
        <FlatList
          data={visibleActivities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <GameCard
              activity={item}
              userLocation={location}
              onPress={() =>
                navigation.navigate('ActivityDetail', {
                  activityId: item.id,
                } as any)
              }
            />
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <DiscoverPipelinePanel
                userId={user?.id}
                latitude={location?.latitude}
                longitude={location?.longitude}
                sportType={effectiveSportFilter}
                activitiesCount={activities.length}
                visibleCount={visibleActivities.length}
                discoverLoading={loading}
                discoverError={discoverError?.message ?? null}
                authLoading={authLoading}
              />
              <Text style={styles.emptyTitle}>
                {discoverError ? 'Could not load games' : emptyGamesLabel}
              </Text>
              <Text style={styles.emptyText}>
                {discoverError
                  ? discoverError.message
                  : 'Be the first to host a game, or browse nearby courts on the map.'}
              </Text>
              {!discoverError && (
                <View style={styles.tipList}>
                  {onboardingTips.map((tip) => (
                    <Text key={tip} style={styles.tipText}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
              <View style={styles.ctaRow}>
                {discoverError ? (
                  <TouchableOpacity style={styles.primaryCta} onPress={() => refetch()}>
                    <Text style={styles.primaryCtaText}>Try again</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.primaryCta} onPress={openCreateGame}>
                      <Text style={styles.primaryCtaText}>Create Game</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryCta} onPress={openNearbyCourtsMap}>
                      <Text style={styles.secondaryCtaText}>Nearby courts</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              {!hasFetchedOnce && !discoverError && (
                <Text style={styles.helperText}>
                  New areas stay empty until someone creates the first game.
                </Text>
              )}
            </View>
          }
        />
      )}

      <ActivityConfirmationModal
        visible={modalVisible}
        detectedLocation={detectedLocation}
        suggestedSport={resolvePreferredSportForLaunch(detectedLocation?.sport_type)}
        onClose={() => {
          setModalVisible(false);
          setDetectedLocation(null);
        }}
        onActivityCreated={handleActivityCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  privacyHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
    lineHeight: 17,
  },
  profileButton: {
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  primaryHeaderButton: {
    borderRadius: 8,
    backgroundColor: '#1a73e8',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  primaryHeaderButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  quickMatchButton: {
    borderRadius: 8,
    backgroundColor: '#0b8f55',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickMatchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  chatsButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chatsButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 12,
  },
  preferenceHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#7a7a7a',
  },
  nearbyCourtsLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  nearbyCourtsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  locationSetupCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  locationSetupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  locationSetupBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  locationButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  retryLocationButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsLocationButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  settingsLocationText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  limitBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff4e5',
    borderWidth: 1,
    borderColor: '#f5c26b',
  },
  limitBannerText: {
    color: '#8a5a00',
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    backgroundColor: '#fff',
  },
  filterChipSelected: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  filterChipText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tipList: {
    marginTop: 12,
    alignSelf: 'stretch',
    paddingHorizontal: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 3,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryCta: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryCtaText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryCta: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryCtaText: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default HomeScreen;

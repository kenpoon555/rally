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
  ScrollView,
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
import { resolveUserDefaultSport, resolvePreferredSportForLaunch, getSportMetadata } from '../../constants/sports';
import { updateUserProfile } from '../../services/userService';
import { SHOW_LOCATION_DEBUG_PANEL, SHOW_DISCOVER_PIPELINE_PANEL } from '../../constants/devFlags';
import { getCurrentLocation } from '../../services/locationService';
import { colors, PRIMARY_COLOR, radius, spacing, typography } from '../../constants/theme';
import { Button, ScreenHeader } from '../../components/ui';
import { DevLocationLogPanel } from '../../components/DevLocationLogPanel';
import DiscoverPipelinePanel from '../../components/DiscoverPipelinePanel';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { addLocationLog } from '../../utils/devLocationLog';
import { shouldShowInDiscoverFeed, sortDiscoverFeedActivities } from '../../utils/activityHelpers';
import { getBlockedUserIds } from '../../services/safetyService';
import { getUserFriends } from '../../services/friendsService';

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
  Home: { sportFilter?: string; highlightOpenSpots?: boolean } | undefined;
  Chats: undefined;
  MyGames: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
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

  // "Find players" from a Game Room deep-links here with a sport + open-spots intent.
  const routeSportFilter = route.params?.sportFilter;
  const highlightOpenSpots = route.params?.highlightOpenSpots ?? false;
  useEffect(() => {
    if (routeSportFilter) {
      setSelectedSport(resolveUserDefaultSport(routeSportFilter));
    }
  }, [routeSportFilter]);

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
    () => sortDiscoverFeedActivities(activities, location, friendIds, { highlightOpenSpots }),
    [activities, location, friendIds, highlightOpenSpots]
  );
  const [detectedLocation, setDetectedLocation] = useState<ActivityLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  const visibleActivities = useMemo(() => {
    return sortedActivities
      .filter((a) => !blockedUserIds.has(a.user_id))
      .filter((a) => shouldShowInDiscoverFeed(a, user?.id));
  }, [sortedActivities, blockedUserIds, user?.id]);

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
    if (!user?.id) {
      setBlockedUserIds(new Set());
      setFriendIds(new Set());
      return;
    }
    getBlockedUserIds(user.id)
      .then((ids) => setBlockedUserIds(new Set(ids)))
      .catch(() => setBlockedUserIds(new Set()));
    getUserFriends(user.id)
      .then((friends) =>
        setFriendIds(
          new Set(
            friends
              .map((friendship) => friendship.friend?.id || friendship.friend_id)
              .filter((id): id is string => Boolean(id))
          )
        )
      )
      .catch(() => setFriendIds(new Set()));
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
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never);
  };

  const handleJoinNearest = () => {
    if (visibleActivities.length > 0) {
      navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
        activityId: visibleActivities[0].id,
      } as never);
      return;
    }
    openCreateGame();
  };

  const locationSetupMessage = locationLoading
    ? 'Finding your location…'
    : hasPermission && locationError
      ? locationError.message?.toLowerCase().includes('timed out')
        ? 'Location timed out. Check that location services are on, then try again.'
        : locationError.message || "We couldn't read your location. Try again."
      : hasPermission
        ? 'Tap below to use your current location for nearby games.'
        : 'Enable location to see games near you.';

  return (
    <View style={styles.container}>
      {SHOW_LOCATION_DEBUG_PANEL && (
        <ErrorBoundary fallback={null}>
          <DevLocationLogPanel onRawTest={runRawLocationTest} />
        </ErrorBoundary>
      )}
      <View style={styles.header}>
        <ScreenHeader
          title={discoverTitle}
          subtitle="Find a game or host one at a nearby court. Distances are approximate until you join."
        />
        <View style={styles.actionRow}>
          <Button title="Create Game" size="sm" onPress={openCreateGame} />
          <Button title="Join nearest" variant="accent" size="sm" onPress={handleJoinNearest} />
        </View>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {sports.map((sport) => {
            const selected = selectedSport === sport.name;
            const label = getSportMetadata(sport.name)?.shortLabel ?? sport.name;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => void handleSportFilter(sport.name)}
              >
                <Text
                  style={[styles.filterChipText, selected && styles.filterChipTextSelected]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {showInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
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
              friendIds={friendIds}
              onPress={() =>
                navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
                  activityId: item.id,
                } as never)
              }
            />
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {SHOW_DISCOVER_PIPELINE_PANEL && (
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
              )}
              <Text style={styles.emptyTitle}>
                {discoverError ? 'Could not load games' : emptyGamesLabel}
              </Text>
              <Text style={styles.emptyText}>
                {discoverError
                  ? discoverError.message
                  : 'No open games nearby yet. Host one at your court, or share a Regulars link so your crew can join the next game.'}
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
                  <TouchableOpacity style={styles.primaryCta} onPress={openCreateGame}>
                    <Text style={styles.primaryCtaText}>Create Game</Text>
                  </TouchableOpacity>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  preferenceHint: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    fontSize: 12,
    color: colors.textTertiary,
  },
  nearbyCourtsLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  nearbyCourtsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  locationSetupCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.md + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationSetupTitle: {
    ...typography.bodyMedium,
    marginBottom: spacing.xs + 2,
  },
  locationSetupBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  locationButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  retryLocationButton: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  retryLocationText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsLocationButton: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  settingsLocationText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  limitBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  limitBannerText: {
    color: '#8a5a00',
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  filterChipSelected: {
    backgroundColor: PRIMARY_COLOR,
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
    backgroundColor: PRIMARY_COLOR,
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
    borderColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryCtaText: {
    color: PRIMARY_COLOR,
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

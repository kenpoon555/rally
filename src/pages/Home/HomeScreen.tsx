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
  Alert,
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
import { resolveUserDefaultSport, resolvePreferredSportForLaunch, getSportMetadata, sortSportsForPlayTab } from '../../constants/sports';
import { updateUserProfile } from '../../services/userService';
import { SHOW_LOCATION_DEBUG_PANEL } from '../../constants/devFlags';
import { PLAY_PARTNER_SURFACES_ENABLED } from '../../constants/betaFlags';
import { getCurrentLocation } from '../../services/locationService';
import { colors, PRIMARY_COLOR, radius, spacing, typography } from '../../constants/theme';
import { Button, ScreenHeader } from '../../components/ui';
import { DevLocationLogPanel } from '../../components/DevLocationLogPanel';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { addLocationLog } from '../../utils/devLocationLog';
import { shouldShowInDiscoverFeed, sortDiscoverFeedActivities } from '../../utils/activityHelpers';
import { getBlockedUserIds } from '../../services/safetyService';
import { getUserFriends } from '../../services/friendsService';
import { getMyRegularGroups } from '../../services/regularGroupService';
import { RegularGroup } from '../../types/regularGroup';
import { DiscoverEmptyState } from '../../components/discover/DiscoverEmptyState';
import { DiscoverErrorState } from '../../components/discover/DiscoverErrorState';
import { DiscoverSportFilters } from '../../components/discover/DiscoverSportFilters';
import { toUserErrorMessage } from '../../utils/errorMessages';
import { BETA_REGION } from '../../constants/betaRegion';
import { NeedPlayerPostCard } from '../../components/NeedPlayerPostCard';
import {
  listNeedPlayerPosts,
  NEED_PLAYERS_SPORTS,
  requestNeedPlayerSpot,
} from '../../services/needPlayersService';
import { NeedPlayerPost } from '../../types/needPlayer';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { SportType } from '../../constants/sports';
import { FreeAgentPostCard } from '../../components/FreeAgentPostCard';
import {
  FREE_AGENT_SPORTS,
  listFreeAgentPosts,
} from '../../services/freeAgentService';
import { FreeAgentPost } from '../../types/freeAgent';
import { CoachesCarousel } from '../../components/CoachesCarousel';
import { listCoachListings, listIntroSessions } from '../../services/partnerService';
import { CoachListing, IntroSession } from '../../types/sportTemplate';

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

type DiscoverMode = 'games' | 'free_agents';
type RouteDiscoverMode = DiscoverMode | 'need_players';

type TabParamList = {
  Home:
    | {
        sportFilter?: string;
        highlightOpenSpots?: boolean;
        discoverMode?: RouteDiscoverMode;
      }
    | undefined;
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
  const { sports } = useSportsCatalog();
  const preferredSport = user?.preferred_sports?.[0];
  const [selectedSport, setSelectedSport] = useState(() => resolveUserDefaultSport(preferredSport));
  const effectiveSportFilter = selectedSport;
  const playTabSports = useMemo(
    () => sortSportsForPlayTab(sports, preferredSport),
    [sports, preferredSport]
  );

  useEffect(() => {
    setSelectedSport(resolveUserDefaultSport(preferredSport));
  }, [preferredSport]);

  // "Find players" from a Game Room deep-links here with a sport + open-spots intent.
  const routeSportFilter = route.params?.sportFilter;
  const routeDiscoverMode = route.params?.discoverMode;
  const highlightOpenSpots = route.params?.highlightOpenSpots ?? false;
  const [discoverMode, setDiscoverMode] = useState<DiscoverMode>(() => {
    if (routeDiscoverMode === 'free_agents') {
      return 'free_agents';
    }
    return 'games';
  });
  const [needPosts, setNeedPosts] = useState<NeedPlayerPost[]>([]);
  const [needLoading, setNeedLoading] = useState(false);
  const [needError, setNeedError] = useState<string | null>(null);
  const [requestingPostId, setRequestingPostId] = useState<string | null>(null);
  const [freeAgentPosts, setFreeAgentPosts] = useState<FreeAgentPost[]>([]);
  const [freeAgentLoading, setFreeAgentLoading] = useState(false);
  const [freeAgentError, setFreeAgentError] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachListing[]>([]);
  const [introSessions, setIntroSessions] = useState<IntroSession[]>([]);
  const [partnerOnly, setPartnerOnly] = useState(false);
  useEffect(() => {
    if (routeSportFilter) {
      setSelectedSport(resolveUserDefaultSport(routeSportFilter));
    }
  }, [routeSportFilter]);
  useEffect(() => {
    if (routeDiscoverMode === 'free_agents') {
      setDiscoverMode('free_agents');
    } else {
      setDiscoverMode('games');
    }
  }, [routeDiscoverMode]);

  const discoverSubtitle =
    discoverMode === 'free_agents'
      ? PRODUCT_COPY.playPlayersHint
      : PRODUCT_COPY.playGamesHint;

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

  const loadNeedPosts = useCallback(async () => {
    setNeedLoading(true);
    setNeedError(null);
    try {
      const sportFilter = NEED_PLAYERS_SPORTS.includes(effectiveSportFilter as SportType)
        ? effectiveSportFilter
        : null;
      const posts = await listNeedPlayerPosts(sportFilter);
      setNeedPosts(posts);
    } catch (error: unknown) {
      setNeedError(error instanceof Error ? error.message : 'Could not load posts');
      setNeedPosts([]);
    } finally {
      setNeedLoading(false);
    }
  }, [effectiveSportFilter]);

  const loadFreeAgentPosts = useCallback(async () => {
    setFreeAgentLoading(true);
    setFreeAgentError(null);
    try {
      const sportFilter = FREE_AGENT_SPORTS.includes(effectiveSportFilter as SportType)
        ? effectiveSportFilter
        : null;
      setFreeAgentPosts(await listFreeAgentPosts(sportFilter));
    } catch (error: unknown) {
      setFreeAgentError(error instanceof Error ? error.message : 'Could not load free agents');
      setFreeAgentPosts([]);
    } finally {
      setFreeAgentLoading(false);
    }
  }, [effectiveSportFilter]);

  const discoverLocation = location ?? BETA_REGION.center;

  const { activities, loading, error: discoverError, refetch } = useActivities(
    discoverLocation,
    effectiveSportFilter
  );

  const sortedActivities = useMemo(
    () =>
      sortDiscoverFeedActivities(activities, discoverLocation, friendIds, { highlightOpenSpots }),
    [activities, discoverLocation, friendIds, highlightOpenSpots]
  );
  const [detectedLocation, setDetectedLocation] = useState<ActivityLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [crewForEmpty, setCrewForEmpty] = useState<RegularGroup | null>(null);

  const loadPartnersContent = useCallback(async () => {
    if (!PLAY_PARTNER_SURFACES_ENABLED) {
      setCoaches([]);
      setIntroSessions([]);
      return;
    }
    try {
      const sportFilter = effectiveSportFilter;
      const [coachRows, introRows] = await Promise.all([
        listCoachListings(sportFilter),
        listIntroSessions(sportFilter),
      ]);
      setCoaches(coachRows);
      setIntroSessions(introRows);
    } catch {
      setCoaches([]);
      setIntroSessions([]);
    }
  }, [effectiveSportFilter]);

  const recruitingActivityIds = useMemo(
    () => new Set(needPosts.map((post) => post.activity_id)),
    [needPosts]
  );

  const visibleActivities = useMemo(() => {
    return sortedActivities
      .filter((a) => !blockedUserIds.has(a.user_id))
      .filter((a) => shouldShowInDiscoverFeed(a, user?.id))
      .filter((a) => !partnerOnly || Boolean(a.location?.partner_tier))
      .filter((a) => !recruitingActivityIds.has(a.id));
  }, [sortedActivities, blockedUserIds, user?.id, partnerOnly, recruitingActivityIds]);

  const showInitialLoading = loading && visibleActivities.length === 0;

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || visibleActivities.length > 0) {
        return;
      }
      getMyRegularGroups(user.id)
        .then((groups) => {
          const match =
            groups.find((group) => group.sport_type === effectiveSportFilter) ?? groups[0] ?? null;
          setCrewForEmpty(match);
        })
        .catch(() => setCrewForEmpty(null));
    }, [user?.id, visibleActivities.length, effectiveSportFilter])
  );

  const sportLabel = getSportMetadata(selectedSport)?.shortLabel ?? selectedSport;
  const discoverErrorMessage = discoverError
    ? toUserErrorMessage(discoverError, 'Unable to load nearby games right now.')
    : null;

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
      if (discoverMode === 'free_agents') {
        void loadFreeAgentPosts();
      } else {
        void loadNeedPosts();
        if (PLAY_PARTNER_SURFACES_ENABLED) {
          void loadPartnersContent();
        }
      }
    }, [authLoading, refetch, discoverMode, loadNeedPosts, loadFreeAgentPosts, loadPartnersContent])
  );

  const handleActivityCreated = () => {
    refetch();
  };

  const handleRefresh = async () => {
    await fetchLocation();
    if (discoverMode === 'free_agents') {
      await loadFreeAgentPosts();
      return;
    }
    await Promise.all([
      refetch(),
      loadNeedPosts(),
      ...(PLAY_PARTNER_SURFACES_ENABLED ? [loadPartnersContent()] : []),
    ]);
  };

  const openSportLanding = useCallback(() => {
    navigation.getParent()?.navigate(ROUTES.LANDING.SPORT as never, {
      sportSlug: selectedSport.toLowerCase(),
    } as never);
  }, [navigation, selectedSport]);

  const handleRequestSpot = useCallback(
    async (post: NeedPlayerPost) => {
      if (!user?.id) {
        return;
      }
      setRequestingPostId(post.id);
      try {
        await requestNeedPlayerSpot(post.id);
        await loadNeedPosts();
        Alert.alert(
          'Request sent',
          'The host will review your request. If accepted, open the game and tap I\'m in.'
        );
      } catch (error: unknown) {
        Alert.alert('Could not request', error instanceof Error ? error.message : 'Try again.');
      } finally {
        setRequestingPostId(null);
      }
    },
    [loadNeedPosts, user?.id]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }
    refetch();
  }, [authLoading, user?.id, location?.latitude, location?.longitude, refetch]);

  const openCreateGame = () => {
    navigation.getParent()?.navigate(ROUTES.ACTIVITY.CREATE as never);
  };

  const gamesListHeader = useMemo(
    () => (
      <View>
        {PLAY_PARTNER_SURFACES_ENABLED ? <CoachesCarousel coaches={coaches} /> : null}
        {PLAY_PARTNER_SURFACES_ENABLED ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.modeChip, partnerOnly && styles.modeChipSelected]}
              onPress={() => setPartnerOnly((v) => !v)}
            >
              <Text style={[styles.modeChipText, partnerOnly && styles.modeChipTextSelected]}>
                {PRODUCT_COPY.partnerVenuesFilter}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
        {PLAY_PARTNER_SURFACES_ENABLED ? (
          <TouchableOpacity style={styles.landingLink} onPress={openSportLanding}>
            <Text style={styles.landingLinkText}>View {sportLabel} landing page</Text>
          </TouchableOpacity>
        ) : null}
        {PLAY_PARTNER_SURFACES_ENABLED && introSessions.length > 0 ? (
          <View style={styles.introHeader}>
            <Text style={styles.introTitle}>{PRODUCT_COPY.introSessions}</Text>
            {introSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.introCard}
                onPress={() =>
                  navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
                    activityId: session.id,
                  } as never)
                }
              >
                <Text style={styles.introCardTitle}>
                  {session.listing_title || `${session.sport_type} intro`}
                </Text>
                <Text style={styles.introCardMeta}>
                  @{session.host_username} · {session.missing_players} spots
                  {session.location_name ? ` · ${session.location_name}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {needPosts.length > 0 ? (
          <View style={styles.recruitingSection}>
            <Text style={styles.recruitingTitle}>{PRODUCT_COPY.playRecruitingTitle}</Text>
            <Text style={styles.recruitingHint}>{PRODUCT_COPY.playRecruitingHint}</Text>
            {needPosts.map((post) => (
              <NeedPlayerPostCard
                key={post.id}
                post={post}
                requesting={requestingPostId === post.id}
                onRequest={() => void handleRequestSpot(post)}
                onPress={() =>
                  navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
                    activityId: post.activity_id,
                  } as never)
                }
              />
            ))}
          </View>
        ) : null}
        {visibleActivities.length > 0 ? (
          <Text style={styles.allGamesLabel}>All open games</Text>
        ) : null}
      </View>
    ),
    [
      coaches,
      partnerOnly,
      sportLabel,
      introSessions,
      needPosts,
      requestingPostId,
      visibleActivities.length,
      openSportLanding,
      handleRequestSpot,
      navigation,
    ]
  );

  const showHostInHeader = discoverMode === 'games' && visibleActivities.length > 0;

  return (
    <View style={styles.container}>
      {SHOW_LOCATION_DEBUG_PANEL && (
        <ErrorBoundary fallback={null}>
          <DevLocationLogPanel onRawTest={runRawLocationTest} />
        </ErrorBoundary>
      )}
      <ScreenHeader
        title="Play"
        subtitle={discoverSubtitle}
        showLogo
        accentColor={colors.accent}
        right={
          showHostInHeader ? (
            <Button title="Host" size="sm" onPress={openCreateGame} />
          ) : undefined
        }
      />

      <View style={styles.modeSegment}>
        {(['games', 'free_agents'] as const).map((mode) => {
          const selected = discoverMode === mode;
          const label = mode === 'games' ? 'Games' : 'Players';
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.modeChip, selected && styles.modeChipSelected]}
              onPress={() => {
                setDiscoverMode(mode);
                if (mode === 'free_agents') {
                  void loadFreeAgentPosts();
                }
              }}
            >
              <Text style={[styles.modeChipText, selected && styles.modeChipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <DiscoverSportFilters
        sports={playTabSports}
        selectedSport={selectedSport}
        onSelect={(sport) => void handleSportFilter(sport)}
      />

      {needError && discoverMode === 'games' ? (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>
            {toUserErrorMessage(needError, 'Unable to load recruiting posts right now.')}
          </Text>
        </View>
      ) : null}

      {freeAgentError && discoverMode === 'free_agents' ? (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>
            {toUserErrorMessage(freeAgentError, 'Unable to load available players right now.')}
          </Text>
        </View>
      ) : null}

      {discoverMode === 'free_agents' ? (
        freeAgentLoading && freeAgentPosts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Loading available players…</Text>
          </View>
        ) : (
          <FlatList
            data={freeAgentPosts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <FreeAgentPostCard post={item} />}
            refreshControl={
              <RefreshControl
                refreshing={freeAgentLoading}
                onRefresh={() => void loadFreeAgentPosts()}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No free agents yet</Text>
                <Text style={styles.emptyText}>
                  Post your availability from Profile → Free agents.
                </Text>
              </View>
            }
          />
        )
      ) : showInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading nearby games…</Text>
        </View>
      ) : discoverMode === 'games' ? (
        <FlatList
          data={visibleActivities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            visibleActivities.length === 0 && styles.listContentEmpty,
          ]}
          ListHeaderComponent={gamesListHeader}
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
          refreshControl={
            <RefreshControl refreshing={loading || needLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            discoverErrorMessage ? (
              <DiscoverErrorState
                message={discoverErrorMessage}
                onRetry={() => void refetch()}
                retrying={loading}
                fill
              />
            ) : (
              <DiscoverEmptyState
                sport={selectedSport}
                sportLabel={sportLabel}
                regularGroup={crewForEmpty}
                onHostGame={openCreateGame}
                onOpenRally={
                  crewForEmpty
                    ? () =>
                        navigation.getParent()?.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
                          groupId: crewForEmpty.id,
                        } as never)
                    : undefined
                }
                fill
              />
            )
          }
        />
      ) : null}

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
  nearbyCourtsLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  nearbyCourtsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
  modeSegment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: 4,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  modeChipSelected: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  modeChipText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeChipTextSelected: {
    color: colors.primaryDark,
  },
  landingLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  landingLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  recruitingSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  recruitingTitle: {
    ...typography.label,
    color: colors.warning,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recruitingHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  allGamesLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  introHeader: {
    marginBottom: spacing.md,
  },
  introTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  introCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  introCardTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  introCardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
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
    paddingBottom: spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
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

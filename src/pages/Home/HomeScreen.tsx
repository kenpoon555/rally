import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useActivities } from '../../hooks/useActivities';
import { useGeofence } from '../../hooks/useGeofence';
import ActivityConfirmationModal from '../../components/ActivityConfirmationModal';
import { Activity } from '../../types/activity';
import { ActivityLocation } from '../../types/location';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../../constants/routes';
import { navigationRef } from '../../navigation/navigationRef';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { resolveUserDefaultSport, resolvePreferredSportForLaunch, getSportMetadata, sortSportsForPlayTab } from '../../constants/sports';
import { updateUserProfile } from '../../services/userService';
import { SHOW_LOCATION_DEBUG_PANEL } from '../../constants/devFlags';
import { getCurrentLocation } from '../../services/locationService';
import { colors, PRIMARY_COLOR, radius, spacing } from '../../constants/theme';
import { ScreenHeader, SegmentToggle } from '../../components/ui';
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
import { SportPickerSheet } from '../../components/discover/SportPickerSheet';
import { DiscoverSectionHeader } from '../../components/discover/DiscoverSectionHeader';
import { GameCardShell } from '../../components/game/GameCardShell';
import { discoverPresetKey } from '../../config/gameCardLayouts';
import { CompactFreeAgentRow } from '../../components/discover/CompactFreeAgentRow';
import { toUserErrorMessage } from '../../utils/errorMessages';
import { BETA_REGION } from '../../constants/betaRegion';
import { listNeedPlayerPosts } from '../../services/needPlayersService';
import { NeedPlayerPost } from '../../types/needPlayer';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { SportType } from '../../constants/sports';
import { listFreeAgentPosts } from '../../services/freeAgentService';
import { FreeAgentPost } from '../../types/freeAgent';
import { COACH_CLASSES_DISCOVER } from '../../constants/coachParentFlags';
import {
  freeAgentEmptyCopy,
  playDiscoverSportFilter,
  shouldShowPlayClassesSegment,
} from '../../config/surfaceVisibility';
import { useCoachParent } from '../../hooks/useCoachParent';
import { coachClassToActivity, listDiscoverClasses, userIsCoach } from '../../services/coachParentService';
import { CreateRolePickerSheet } from '../../components/coachParent/CreateRolePickerSheet';

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

type DiscoverMode = 'games' | 'free_agents' | 'classes';
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

/** Quick-pick sports in the Play strip; full catalog via More. */
const PLAY_STRIP_SPORT_COUNT = 3;

const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const isFocused = useIsFocused();
  const locState = useLocation(false, { skipPermissionCheckOnMount: Platform.OS === 'android' });
  const location = locState?.location ?? null;
  const fetchLocation = locState?.fetchLocation ?? (async () => {});
  const { sports } = useSportsCatalog();
  const preferredSport = user?.preferred_sports?.[0];
  const [selectedSport, setSelectedSport] = useState(() => resolveUserDefaultSport(preferredSport));
  const effectiveSportFilter = selectedSport;
  const orderedPlaySports = useMemo(() => sortSportsForPlayTab(sports), [sports]);
  const stripSports = useMemo(() => {
    const primary = orderedPlaySports.slice(0, PLAY_STRIP_SPORT_COUNT);
    if (primary.some((sport) => sport.name === selectedSport)) {
      return primary;
    }
    const selected = orderedPlaySports.find((sport) => sport.name === selectedSport);
    if (!selected) {
      return primary;
    }
    return [...primary.slice(0, PLAY_STRIP_SPORT_COUNT - 1), selected];
  }, [orderedPlaySports, selectedSport]);
  const [sportPickerOpen, setSportPickerOpen] = useState(false);
  const moreSportSelected = useMemo(
    () => !stripSports.some((sport) => sport.name === selectedSport),
    [stripSports, selectedSport]
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
  const [, setNeedLoading] = useState(false);
  const [, setNeedError] = useState<string | null>(null);
  const [freeAgentPosts, setFreeAgentPosts] = useState<FreeAgentPost[]>([]);
  const [freeAgentLoading, setFreeAgentLoading] = useState(false);
  const [freeAgentError, setFreeAgentError] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const { hasClassContext, enrollments, isCoach, classesDiscoverEnabled } = useCoachParent();
  const showPlayClassesSegment = useMemo(
    () =>
      shouldShowPlayClassesSegment({
        classesDiscoverEnabled,
        hasClassContext,
        isCoach,
        userId: user?.id,
      }),
    [classesDiscoverEnabled, hasClassContext, isCoach, user?.id]
  );
  const [classActivities, setClassActivities] = useState<Activity[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [createPickerOpen, setCreatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      : discoverMode === 'classes'
        ? 'Browse classes near you'
        : PRODUCT_COPY.playGamesHint;

  const loadClassListings = useCallback(async () => {
    if (!COACH_CLASSES_DISCOVER) {
      setClassActivities([]);
      return;
    }
    setClassesLoading(true);
    try {
      const rows = await listDiscoverClasses(effectiveSportFilter, user?.id);
      setClassActivities(rows.map((row) => coachClassToActivity(row, user?.username)));
    } finally {
      setClassesLoading(false);
    }
  }, [effectiveSportFilter, user?.id, user?.username]);

  useEffect(() => {
    if (discoverMode === 'classes') {
      void loadClassListings();
    }
  }, [discoverMode, loadClassListings]);

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
      const posts = await listNeedPlayerPosts(
        playDiscoverSportFilter(effectiveSportFilter) as SportType
      );
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
      setFreeAgentPosts(
        await listFreeAgentPosts(playDiscoverSportFilter(effectiveSportFilter) as SportType)
      );
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
    effectiveSportFilter as SportType
  );

  const sortedActivities = useMemo(
    () =>
      sortDiscoverFeedActivities(activities, discoverLocation, friendIds, { highlightOpenSpots }),
    [activities, discoverLocation, friendIds, highlightOpenSpots]
  );
  const [detectedLocation, setDetectedLocation] = useState<ActivityLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [crewForEmpty, setCrewForEmpty] = useState<RegularGroup | null>(null);

  const recruitingActivityIds = useMemo(
    () => new Set(needPosts.map((post) => post.activity_id)),
    [needPosts]
  );

  const visibleActivities = useMemo(() => {
    return sortedActivities
      .filter((a) => !blockedUserIds.has(a.user_id))
      .filter((a) => shouldShowInDiscoverFeed(a, user?.id))
      .filter((a) => !recruitingActivityIds.has(a.id));
  }, [sortedActivities, blockedUserIds, user?.id, recruitingActivityIds]);

  const lockedWelcomingGames = useMemo(
    () =>
      visibleActivities.filter(
        (activity) =>
          (activity.match_status ?? '') === 'finalized' && (activity.missing_players ?? 0) > 0
      ),
    [visibleActivities]
  );

  const openGames = useMemo(() => {
    const lockedIds = new Set(lockedWelcomingGames.map((activity) => activity.id));
    return visibleActivities.filter((activity) => !lockedIds.has(activity.id));
  }, [visibleActivities, lockedWelcomingGames]);

  type GameSection = { key: string; title: string; subtitle?: string; data: Activity[] };

  const gameSections = useMemo((): GameSection[] => {
    const sections: GameSection[] = [];
    if (openGames.length > 0) {
      sections.push({
        key: 'open',
        title: PRODUCT_COPY.playOpenGamesSection.toUpperCase(),
        data: openGames,
      });
    }
    if (lockedWelcomingGames.length > 0) {
      sections.push({
        key: 'locked',
        title: PRODUCT_COPY.playLockedWelcomingSection.toUpperCase(),
        subtitle: PRODUCT_COPY.playLockedWelcomingHint,
        data: lockedWelcomingGames,
      });
    }
    return sections;
  }, [openGames, lockedWelcomingGames]);

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
    enabled: isFocused && !!location && !!user,
  });

  useFocusEffect(
    useCallback(() => {
      if (authLoading) {
        return;
      }
      if (discoverMode === 'free_agents') {
        void loadFreeAgentPosts();
      } else {
        void loadNeedPosts();
      }
    }, [authLoading, discoverMode, loadNeedPosts, loadFreeAgentPosts])
  );

  const handleActivityCreated = () => {
    refetch();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchLocation();
      if (discoverMode === 'free_agents') {
        await loadFreeAgentPosts();
        return;
      }
      await Promise.all([refetch(), loadNeedPosts()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openActivityDetail = useCallback(
    (activityId: string) => {
      navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL as never, {
        activityId,
      } as never);
    },
    [navigation]
  );

  const handleInvitePlayer = useCallback(() => {
    Alert.alert(
      'Invite from a game',
      'Host a game or open your game room, then invite available players from there.'
    );
  }, []);

  const navigateToCreateGame = (params?: { createMode?: 'class' }) => {
    const routeParams = (params ?? {}) as never;
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate(ROUTES.ACTIVITY.CREATE as never, routeParams);
      return;
    }
    if (navigationRef.isReady()) {
      navigationRef.navigate(ROUTES.ACTIVITY.CREATE as never, routeParams);
    }
  };

  const openCreateGame = () => {
    if (COACH_CLASSES_DISCOVER && userIsCoach(user)) {
      setCreatePickerOpen(true);
      return;
    }
    navigateToCreateGame();
  };

  const handleCreateOption = (option: 'game' | 'rally' | 'class') => {
    setCreatePickerOpen(false);
    InteractionManager.runAfterInteractions(() => {
      if (option === 'class') {
        navigateToCreateGame({ createMode: 'class' });
        return;
      }
      navigateToCreateGame();
    });
  };

  const segmentOptions = useMemo(() => {
    const base = [
      { value: 'games' as const, label: 'Games' },
      { value: 'free_agents' as const, label: 'Players' },
    ];
    if (showPlayClassesSegment) {
      base.push({ value: 'classes', label: 'Classes' });
    }
    return base;
  }, [showPlayClassesSegment]);

  useEffect(() => {
    if (discoverMode === 'classes' && !showPlayClassesSegment) {
      setDiscoverMode('games');
    }
  }, [discoverMode, showPlayClassesSegment]);

  const headerRight =
    discoverMode === 'games' || discoverMode === 'classes' ? (
      <TouchableOpacity
        style={styles.hostHeaderBtn}
        onPress={openCreateGame}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={PRODUCT_COPY.createGame}
      >
        <Ionicons name="add" size={18} color={colors.onPrimary} />
        <Text style={styles.hostHeaderBtnText}>Host</Text>
      </TouchableOpacity>
    ) : null;

  const isHostUser = useMemo(
    () => visibleActivities.some((activity) => activity.user_id === user?.id),
    [visibleActivities, user?.id]
  );

  return (
    <View style={styles.container}>
      {SHOW_LOCATION_DEBUG_PANEL && (
        <ErrorBoundary fallback={null}>
          <DevLocationLogPanel onRawTest={runRawLocationTest} />
        </ErrorBoundary>
      )}
      <ScreenHeader title="Play" subtitle={discoverSubtitle} right={headerRight} />

      <View style={styles.playChrome}>
        <DiscoverSportFilters
          sports={stripSports}
          selectedSport={selectedSport}
          onSelect={(sport) => void handleSportFilter(sport)}
          onMorePress={() => setSportPickerOpen(true)}
          moreSelected={moreSportSelected}
          moreLabel="More"
        />

        <SegmentToggle
          options={segmentOptions}
          value={discoverMode}
          onChange={(mode) => {
            setDiscoverMode(mode);
            if (mode === 'free_agents') {
              void loadFreeAgentPosts();
            }
            if (mode === 'classes') {
              void loadClassListings();
            }
          }}
        />
      </View>

      {freeAgentError && discoverMode === 'free_agents' ? (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>
            {toUserErrorMessage(freeAgentError, 'Unable to load available players right now.')}
          </Text>
        </View>
      ) : null}

      {discoverMode === 'free_agents' ? (
        <FlatList
          style={styles.list}
          data={freeAgentPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            freeAgentPosts.length === 0 && styles.listContentEmpty,
          ]}
          ListHeaderComponent={
            <DiscoverSectionHeader
              title={PRODUCT_COPY.playPlayersNearbySection.toUpperCase()}
              subtitle={PRODUCT_COPY.playPlayersNearbyHint}
            />
          }
          renderItem={({ item }) => (
            <CompactFreeAgentRow
              post={item}
              onInvite={isHostUser ? handleInvitePlayer : undefined}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={freeAgentLoading}
              onRefresh={() => void loadFreeAgentPosts()}
            />
          }
          ListEmptyComponent={
            freeAgentLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.loadingText}>Loading players nearby…</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {freeAgentEmptyCopy(effectiveSportFilter).title}
                </Text>
                <Text style={styles.emptyText}>
                  {freeAgentEmptyCopy(effectiveSportFilter).body}
                </Text>
              </View>
            )
          }
        />
      ) : discoverMode === 'classes' ? (
        <FlatList
          style={styles.list}
          data={classActivities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            classActivities.length === 0 && styles.listContentEmpty,
          ]}
          ListHeaderComponent={
            hasClassContext && enrollments[0] ? (
              <View style={styles.nextClassBanner}>
                <Text style={styles.nextClassTitle}>Next class</Text>
                <Text style={styles.nextClassBody}>
                  {enrollments[0].student_name} · {enrollments[0].class_title} · Confirm
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <GameCardShell
              presetKey="classDiscover"
              activity={item}
              userLocation={discoverLocation}
              isHost={item.user_id === user?.id}
              onPress={() =>
                navigation.getParent()?.navigate(ROUTES.COACH_PARENT.CLASS_DETAIL as never, {
                  classId: item.id,
                } as never)
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={classesLoading}
              onRefresh={() => void loadClassListings()}
            />
          }
          ListEmptyComponent={
            classesLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.loadingText}>Loading classes…</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No {sportLabel} classes nearby</Text>
                <Text style={styles.emptyText}>Check back later or try another sport.</Text>
              </View>
            )
          }
        />
      ) : (
        <SectionList
          style={styles.list}
          sections={gameSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            gameSections.length === 0 && styles.listContentEmpty,
          ]}
          renderSectionHeader={({ section }) => (
            <DiscoverSectionHeader title={section.title} subtitle={section.subtitle} />
          )}
          renderItem={({ item, section }) => (
            <GameCardShell
              presetKey={discoverPresetKey(section.key === 'locked' ? 'locked' : 'open')}
              activity={item}
              userLocation={discoverLocation}
              isHost={item.user_id === user?.id}
              onPress={() => openActivityDetail(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            showInitialLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.loadingText}>Loading nearby games…</Text>
              </View>
            ) : discoverErrorMessage ? (
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
          stickySectionHeadersEnabled={false}
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

      <SportPickerSheet
        visible={sportPickerOpen}
        sports={orderedPlaySports}
        selectedSport={selectedSport}
        onSelect={(sport) => void handleSportFilter(sport)}
        onClose={() => setSportPickerOpen(false)}
      />

      <CreateRolePickerSheet
        visible={createPickerOpen}
        showClassOption={userIsCoach(user)}
        onClose={() => setCreatePickerOpen(false)}
        onSelect={handleCreateOption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hostHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  hostHeaderBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  nextClassBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextClassTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  nextClassBody: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
  filterChipText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  playChrome: {
    flexShrink: 0,
  },
  list: {
    flex: 1,
  },
  inlineLoading: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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

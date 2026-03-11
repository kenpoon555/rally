import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useActivities } from '../../hooks/useActivities';
import { useGeofence } from '../../hooks/useGeofence';
import ActivityCard from '../../components/ActivityCard';
import ActivityConfirmationModal from '../../components/ActivityConfirmationModal';
import { ActivityLocation } from '../../types/location';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../../constants/routes';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { getTotalUnreadCount } from '../../services/chatService';
import { getCurrentLocation } from '../../services/locationService';
import { DevLocationLogPanel } from '../../components/DevLocationLogPanel';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { addLocationLog } from '../../utils/devLocationLog';

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
  Map: undefined;
  Friends: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  // Android: no location on load (crashes). Pull to refresh to get location.
  const locState = useLocation(false, { skipPermissionCheckOnMount: Platform.OS === 'android' });
  const location = locState?.location ?? null;
  const fetchLocation = locState?.fetchLocation ?? (async () => {});
  const hasPermission = locState?.hasPermission ?? false;
  const locationError = locState?.error;
  const locationLoading = locState?.loading ?? false;
  const { sports } = useSportsCatalog();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const { activities, loading, refetch } = useActivities(
    location || undefined,
    selectedSport || undefined
  );
  const [detectedLocation, setDetectedLocation] = useState<ActivityLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);

  const filteredSportLabel = selectedSport || 'All sports';
  const showInitialLoading = loading && activities.length === 0;

  const onboardingTips = useMemo(
    () => [
      'Widen your search by allowing location access.',
      'Try another sport filter to discover more games.',
      'Create an activity to start the first rally nearby.',
    ],
    []
  );

  const preferenceMismatch = useMemo(() => {
    const preferred = user?.preferred_sports;
    if (!selectedSport || !preferred?.length || !Array.isArray(preferred)) {
      return false;
    }
    return !preferred.includes(selectedSport as any);
  }, [selectedSport, user?.preferred_sports]);

  // No location fetch on mount: Android crashes when getCurrentLocation/permission result runs during the grant flow. User can pull-to-refresh to get location.
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

  const onGeofenceLocationDetected = useCallback((loc: ActivityLocation) => {
    setDetectedLocation(loc);
    setModalVisible(true);
  }, []);

  // Geofence detection (options ref-stabilized in useGeofence to avoid effect loop on tab switch)
  useGeofence(location, {
    onLocationDetected: onGeofenceLocationDetected,
    enabled: !!location && !!user,
  });

  const handleActivityCreated = () => {
    refetch();
  };

  const handleRefresh = async () => {
    await Promise.all([fetchLocation(), refetch()]);
    setHasFetchedOnce(true);
  };

  const openCreateActivity = () => {
    navigation.navigate(ROUTES.ACTIVITY.CREATE as any);
  };

  const openMapTab = () => {
    navigation.navigate(ROUTES.HOME.MAP as any);
  };

  const openProfile = () => {
    navigation.navigate(ROUTES.PROFILE.MAIN as any);
  };

  const openChats = () => {
    navigation.navigate(ROUTES.CHAT.LIST as any);
  };

  const handleQuickMatch = () => {
    if (activities.length > 0) {
      navigation.navigate(ROUTES.ACTIVITY.DETAIL as any, {
        activityId: activities[0].id,
      });
      return;
    }
    openCreateActivity();
  };

  return (
    <View style={styles.container}>
      <ErrorBoundary fallback={null}>
        <DevLocationLogPanel onRawTest={runRawLocationTest} />
      </ErrorBoundary>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Discover</Text>
          <TouchableOpacity style={styles.profileButton} onPress={openProfile}>
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Showing {filteredSportLabel}</Text>
        <Text style={styles.preferenceHint}>
          Default: {user?.default_duration || 60} min • {user?.default_visibility || 'nearby'}
        </Text>
        {preferenceMismatch && (
          <Text style={styles.mismatchHint}>
            This sport differs from your saved preference. Update in Profile if this is your new default.
          </Text>
        )}
        <TouchableOpacity style={styles.chatsButton} onPress={openChats}>
          <Text style={styles.chatsButtonText}>
            Chats{unreadChats > 0 ? ` (${unreadChats})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickMatchButton} onPress={handleQuickMatch}>
          <Text style={styles.quickMatchButtonText}>Quick Match</Text>
        </TouchableOpacity>
      </View>
      {!location && (
        <View style={styles.locationWarningRow}>
          <Text style={styles.warning}>
            {locationLoading
              ? 'Getting location…'
              : hasPermission && locationError
                ? locationError.message?.toLowerCase().includes('timed out')
                  ? 'Location timed out. Set mock location in emulator or use a real device.'
                  : 'Couldn\'t get coordinates.'
                : 'Location permission needed to see nearby activities'}
          </Text>
          {hasPermission && locationError && !locationLoading && (
            <TouchableOpacity style={styles.retryLocationButton} onPress={() => fetchLocation()}>
              <Text style={styles.retryLocationText}>Retry location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedSport === null && styles.filterChipSelected,
          ]}
          onPress={() => setSelectedSport(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedSport === null && styles.filterChipTextSelected,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {sports.map((sport) => {
          const selected = selectedSport === sport.name;
          return (
            <TouchableOpacity
              key={sport.id}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setSelectedSport(sport.name)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selected && styles.filterChipTextSelected,
                ]}
              >
                {sport.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {showInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading nearby activities...</Text>
        </View>
      ) : (
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPress={() =>
              navigation.navigate('ActivityDetail', {
                activityId: item.id,
              } as any)
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No activities yet nearby</Text>
            <Text style={styles.emptyText}>
              Pull to refresh or create one now so others can join.
            </Text>
            <View style={styles.tipList}>
              {onboardingTips.map((tip) => (
                <Text key={tip} style={styles.tipText}>
                  - {tip}
                </Text>
              ))}
            </View>
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.primaryCta} onPress={openCreateActivity}>
                <Text style={styles.primaryCtaText}>Create Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryCta} onPress={openMapTab}>
                <Text style={styles.secondaryCtaText}>Open Map</Text>
              </TouchableOpacity>
            </View>
            {!hasFetchedOnce && (
              <Text style={styles.helperText}>
                Tip: first load may be empty until more activities are created.
              </Text>
            )}
          </View>
        }
      />
      )}
      <ActivityConfirmationModal
        visible={modalVisible}
        detectedLocation={detectedLocation}
        suggestedSport={detectedLocation?.sport_type || 'Basketball'}
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
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  preferenceHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#7a7a7a',
  },
  mismatchHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#b45309',
  },
  chatsButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chatsButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 12,
  },
  quickMatchButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#0b8f55',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickMatchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  locationWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  warning: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ff9500',
    backgroundColor: '#fff',
    flex: 1,
    minWidth: 0,
  },
  retryLocationButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginRight: 12,
  },
  retryLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: {
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
  },
  primaryCta: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
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

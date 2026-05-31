import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocation } from '../../hooks/useLocation';
import { useActivities } from '../../hooks/useActivities';
import { Activity } from '../../types/activity';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityLocation } from '../../types/location';
import { getNearbyActivityLocations } from '../../services/locationService';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { fuzzMapCoordinate } from '../../utils/approximateLocation';
import { PRIVACY_LOCATION_TEXT } from '../../constants/legal';

type MainStackParamList = {
  MainTabs: undefined;
  Map: typeof ROUTES.HOME.MAP;
  ActivityDetail: { activityId?: string; inviteToken?: string };
  CreateActivity: undefined;
};

type Props = NativeStackScreenProps<MainStackParamList, typeof ROUTES.HOME.MAP>;

const FALLBACK_REGION = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { location, loading: locationLoading, fetchLocation } = useLocation(false, {
    skipPermissionCheckOnMount: true,
  });
  const { activities, loading: activitiesLoading, refetch } = useActivities(location || undefined);
  const [nearbyLocations, setNearbyLocations] = useState<ActivityLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const loadNearbyLocations = async () => {
      if (!location) {
        setNearbyLocations([]);
        return;
      }

      setLoadingLocations(true);
      try {
        const locations = await getNearbyActivityLocations(
          location.latitude,
          location.longitude,
          5000
        );
        setNearbyLocations(locations);
      } catch {
        setNearbyLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadNearbyLocations();
  }, [location]);

  const currentRegion = useMemo(() => {
    if (!location) {
      return FALLBACK_REGION;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [location]);

  const initialRegionRef = useRef(FALLBACK_REGION);
  if (currentRegion) {
    initialRegionRef.current = currentRegion;
  }
  const stableInitialRegion = initialRegionRef.current;

  const loading = locationLoading || activitiesLoading || loadingLocations;
  const hasActivityPins = activities.length > 0;
  const hasLocationPins = nearbyLocations.length > 0;
  const showEmptyOverlay = !loading && !hasActivityPins && !hasLocationPins;

  const handleStartHere = () => {
    navigation.navigate(ROUTES.ACTIVITY.CREATE as never);
  };

  const handleRefresh = async () => {
    const hadLocation = !!location;
    await fetchLocation();
    if (hadLocation) {
      await refetch();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.subtitle}>
          {location
            ? 'Activities and courts near your current area'
            : 'Showing default area until location is available'}
        </Text>
        <Text style={styles.privacyHint}>{PRIVACY_LOCATION_TEXT}</Text>
      </View>
      <MapView
        key={location ? `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}` : 'fallback'}
        style={styles.map}
        initialRegion={stableInitialRegion}
        showsUserLocation={!!location}
      >
        {activities.map((activity: Activity) => {
          if (!activity.location?.location?.coordinates) return null;
          const [lng, lat] = activity.location.location.coordinates;
          const isHost = user?.id === activity.user_id;
          const coordinate = isHost
            ? { latitude: lat, longitude: lng }
            : fuzzMapCoordinate(lat, lng, activity.id);
          return (
            <Marker
              key={activity.id}
              coordinate={coordinate}
              title={activity.sport_type}
              description={`${activity.player_count} players`}
            />
          );
        })}
        {nearbyLocations.map((spot: ActivityLocation) => {
          if (!spot.location?.coordinates) {
            return null;
          }
          const [lng, lat] = spot.location.coordinates;
          return (
            <Marker
              key={`spot-${spot.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor="#34a853"
              title={spot.name}
              description={`${spot.sport_type} spot`}
            />
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      )}

      {showEmptyOverlay && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyTitle}>No activities near this area yet</Text>
          <Text style={styles.emptyText}>
            Start one here so nearby players can discover and join.
          </Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.primaryCta} onPress={handleStartHere}>
              <Text style={styles.primaryCtaText}>Start Here</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} onPress={handleRefresh}>
              <Text style={styles.secondaryCtaText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.bottomSheet}>
        <View style={styles.bottomHeader}>
          <Text style={styles.bottomTitle}>Nearby Activity Pins</Text>
          <TouchableOpacity onPress={handleStartHere}>
            <Text style={styles.bottomCta}>Create Game</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomListContent}
          renderItem={({ item }) => (
            <View style={styles.bottomCard}>
              <Text style={styles.bottomCardTitle}>{item.sport_type}</Text>
              <Text style={styles.bottomCardMeta}>
                {item.location?.name || 'Unknown location'}
              </Text>
              <Text style={styles.bottomCardMeta}>
                {item.player_count} players
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.bottomEmptyText}>
              No active games right now. Courts and parks are still shown on map.
            </Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
    fontSize: 13,
  },
  privacyHint: {
    marginTop: 6,
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#555',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  emptyText: {
    marginTop: 8,
    color: '#555',
    fontSize: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  primaryCta: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  primaryCtaText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryCta: {
    borderColor: '#1a73e8',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryCtaText: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  bottomTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#333',
  },
  bottomCta: {
    color: '#1a73e8',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomListContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  bottomCard: {
    width: 180,
    backgroundColor: '#f7f9fc',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
  },
  bottomCardTitle: {
    fontWeight: '700',
    color: '#222',
  },
  bottomCardMeta: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  bottomEmptyText: {
    paddingHorizontal: 8,
    color: '#666',
    fontSize: 13,
  },
});

export default MapScreen;

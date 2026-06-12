import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SportType } from '../constants/sports';
import { ActivityLocation } from '../types/location';
import {
  addCourtFromPlacePreview,
  addCourtFromPlacesSearch,
  discoverNearbyCourtsFromPlaces,
} from '../services/courtService';
import { colors, radius, spacing } from '../constants/theme';
import { KeyboardSafeBottomSheet } from './ui';
import { calculateDistance } from '../utils/distance';
import { formatSearchRadiusLabel, formatTravelEstimate } from '../utils/formatDistance';
import { CONFIG } from '../constants/config';
import { parseGeographyCoordinates } from '../utils/activityLocationGeo';

type Props = {
  visible: boolean;
  sportType: SportType;
  near?: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onAdded: (location: ActivityLocation) => void;
};

type NearbyPreview = ActivityLocation & { distanceMeters: number };

export function AddCourtSheet({ visible, sportType, near, onClose, onAdded }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyCourts, setNearbyCourts] = useState<NearbyPreview[]>([]);

  const radiusLabel = formatSearchRadiusLabel(CONFIG.COURT_SEARCH_WIDE_RADIUS_M);

  const loadNearbyCourts = useCallback(async () => {
    if (!near) {
      setNearbyCourts([]);
      setNearbyError('Turn on location to see courts near you.');
      return;
    }

    setLoadingNearby(true);
    setNearbyError(null);
    try {
      const results = await discoverNearbyCourtsFromPlaces(sportType, near);
      const withDistance = results
        .map((court) => {
          const coords = parseGeographyCoordinates(court.location);
          const distanceMeters = coords
            ? calculateDistance(near, { latitude: coords[1], longitude: coords[0] })
            : Number.POSITIVE_INFINITY;
          return { ...court, distanceMeters };
        })
        .filter((court) => court.distanceMeters <= CONFIG.COURT_SEARCH_WIDE_RADIUS_M)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      setNearbyCourts(withDistance);
      if (withDistance.length === 0) {
        setNearbyError(`No ${sportType.toLowerCase()} courts found within ${radiusLabel}.`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not load nearby courts.';
      setNearbyError(message);
      setNearbyCourts([]);
    } finally {
      setLoadingNearby(false);
    }
  }, [near, radiusLabel, sportType]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setNearbyCourts([]);
      setNearbyError(null);
      return;
    }
    void loadNearbyCourts();
  }, [visible, loadNearbyCourts]);

  const finishAdd = (saved: ActivityLocation) => {
    onAdded(saved);
    setQuery('');
    onClose();
    Alert.alert('Court added', `${saved.name} is ready — you can host a game there now.`);
  };

  const handleAddPreview = async (place: ActivityLocation) => {
    setSearching(true);
    try {
      const saved = await addCourtFromPlacePreview(place, sportType);
      finishAdd(saved);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not add court.';
      Alert.alert('Add court', message);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const saved = await addCourtFromPlacesSearch(query, sportType, near ?? undefined);
      finishAdd(saved);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not add court.';
      Alert.alert('Add court', message);
    } finally {
      setSearching(false);
    }
  };

  const nearbySectionTitle = useMemo(() => {
    if (!near) {
      return 'Nearby courts';
    }
    return `Nearby ${sportType.toLowerCase()} courts (within ${radiusLabel})`;
  }, [near, radiusLabel, sportType]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardSafeBottomSheet style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Add a court</Text>
            <Text style={styles.subtitle}>
              Pick a nearby court or search by park, recreation center, or address. We save it for
              everyone nearby.
            </Text>

            <Text style={styles.sectionLabel}>{nearbySectionTitle}</Text>
            {loadingNearby ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Finding courts near you…</Text>
              </View>
            ) : nearbyError ? (
              <Text style={styles.errorText}>{nearbyError}</Text>
            ) : (
              <ScrollView style={styles.nearbyList} keyboardShouldPersistTaps="handled">
                {nearbyCourts.map((court) => {
                  const travel = formatTravelEstimate(court.distanceMeters);
                  return (
                    <TouchableOpacity
                      key={court.google_place_id ?? court.id}
                      style={styles.nearbyRow}
                      disabled={searching}
                      onPress={() => void handleAddPreview(court)}
                    >
                      <View style={styles.nearbyRowText}>
                        <Text style={styles.nearbyName} numberOfLines={2}>
                          {court.name}
                        </Text>
                        {travel ? <Text style={styles.nearbyMeta}>{travel}</Text> : null}
                      </View>
                      <Text style={styles.addLink}>Add</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={styles.sectionLabel}>Search for another court</Text>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder={`e.g. ${sportType} courts at a park name`}
              autoCapitalize="words"
              editable={!searching}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, searching && styles.btnDisabled]}
              onPress={() => void handleSearch()}
              disabled={searching || !query.trim()}
            >
              {searching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Search and add</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={searching}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardSafeBottomSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropTap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '88%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  nearbyList: {
    maxHeight: 220,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  nearbyRowText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  nearbyMeta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  addLink: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ACTIVITY_DURATIONS, ActivityDuration, getSportMetadata, resolvePreferredSportForLaunch } from '../constants/sports';
import { ActivityLocation } from '../types/location';
import { createActivity } from '../services/activityService';
import { saveActivityLocation } from '../services/locationService';
import { useAuth } from '../hooks/useAuth';
import { useSportsCatalog } from '../hooks/useSportsCatalog';

interface ActivityConfirmationModalProps {
  visible: boolean;
  detectedLocation: ActivityLocation | null;
  suggestedSport: string;
  onClose: () => void;
  onActivityCreated: () => void;
}

const ActivityConfirmationModal: React.FC<ActivityConfirmationModalProps> = ({
  visible,
  detectedLocation,
  suggestedSport,
  onClose,
  onActivityCreated,
}) => {
  const { user } = useAuth();
  const { sports } = useSportsCatalog();
  const [sportType, setSportType] = useState<string>(() =>
    resolvePreferredSportForLaunch(suggestedSport)
  );
  const [duration, setDuration] = useState<ActivityDuration>(60);
  const [visibility, setVisibility] = useState<'friends' | 'nearby'>('nearby');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSportType(resolvePreferredSportForLaunch(suggestedSport));
    }
  }, [visible, suggestedSport]);

  const handleConfirm = async () => {
    if (!user || !detectedLocation) return;

    setLoading(true);
    try {
      // Save location if it doesn't exist
      let locationId = detectedLocation.id;
      if (!locationId || !detectedLocation.google_place_id) {
        const savedLocation = await saveActivityLocation({
          name: detectedLocation.name,
          sport_type: sportType,
          location: detectedLocation.location,
          google_place_id: detectedLocation.google_place_id,
          radius: detectedLocation.radius,
        });
        locationId = savedLocation.id;
      }

      const now = new Date();
      const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const meta = getSportMetadata(sportType);
      const useFlex = meta?.defaultSchedulingMode === 'flex';

      await createActivity({
        user_id: user.id,
        location_id: locationId,
        sport_type: sportType,
        start_time: now.toISOString(),
        duration,
        visibility,
        scheduling_mode: useFlex ? 'flex' : 'fixed',
        match_status: useFlex ? 'collecting' : 'open',
        window_start: useFlex ? now.toISOString() : undefined,
        window_end: useFlex ? windowEnd.toISOString() : undefined,
        preference_deadline: useFlex ? windowEnd.toISOString() : undefined,
        candidate_location_ids: useFlex ? [locationId] : undefined,
      });

      onActivityCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating activity:', error);
      Alert.alert('Create failed', error.message || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Are you playing here?</Text>
          {detectedLocation && (
            <Text style={styles.location}>{detectedLocation.name}</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Sport</Text>
            <View style={styles.sportOptions}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportButton,
                    sportType === sport.name && styles.sportButtonSelected,
                  ]}
                  onPress={() => setSportType(sport.name)}
                >
                  <Text
                    style={[
                      styles.sportButtonText,
                      sportType === sport.name && styles.sportButtonTextSelected,
                    ]}
                  >
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationOptions}>
              {ACTIVITY_DURATIONS.map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.durationButton,
                    duration === dur && styles.durationButtonSelected,
                  ]}
                  onPress={() => setDuration(dur)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      duration === dur && styles.durationButtonTextSelected,
                    ]}
                  >
                    {dur} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  visibility === 'friends' && styles.visibilityButtonSelected,
                ]}
                onPress={() => setVisibility('friends')}
              >
                <Text
                  style={[
                    styles.visibilityButtonText,
                    visibility === 'friends' && styles.visibilityButtonTextSelected,
                  ]}
                >
                  Friends Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  visibility === 'nearby' && styles.visibilityButtonSelected,
                ]}
                onPress={() => setVisibility('nearby')}
              >
                <Text
                  style={[
                    styles.visibilityButtonText,
                    visibility === 'nearby' && styles.visibilityButtonTextSelected,
                  ]}
                >
                  Nearby Players
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  sportButtonSelected: {
    backgroundColor: '#007AFF',
  },
  sportButtonText: {
    fontSize: 14,
    color: '#333',
  },
  sportButtonTextSelected: {
    color: '#fff',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: '#007AFF',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#333',
  },
  durationButtonTextSelected: {
    color: '#fff',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  visibilityButtonSelected: {
    backgroundColor: '#007AFF',
  },
  visibilityButtonText: {
    fontSize: 14,
    color: '#333',
  },
  visibilityButtonTextSelected: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ActivityConfirmationModal;

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/userService';
import { ACTIVITY_DURATIONS, ACTIVITY_VISIBILITY } from '../../constants/sports';
import { getProfileReviewStats } from '../../services/reviewService';
import { ProfileReviewStats } from '../../types/review';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profile_photo_url || '');
  const [defaultDuration, setDefaultDuration] = useState<number>(user?.default_duration || 60);
  const [defaultVisibility, setDefaultVisibility] = useState<'friends' | 'nearby'>(
    user?.default_visibility || 'nearby'
  );
  const [defaultDistance, setDefaultDistance] = useState<string>(
    user?.default_distance_meters ? String(user.default_distance_meters) : '5000'
  );
  const [reviewStats, setReviewStats] = useState<ProfileReviewStats | null>(null);

  const usernamePreview = useMemo(() => {
    if (nickname.trim()) {
      return nickname.trim();
    }
    return user?.username || 'Player';
  }, [nickname, user?.username]);

  useEffect(() => {
    if (!user?.id) {
      setReviewStats(null);
      return;
    }
    getProfileReviewStats(user.id)
      .then(setReviewStats)
      .catch(() => setReviewStats(null));
  }, [user?.id]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'Please sign in and try again.');
      return;
    }

    const parsedDistance = Number.parseInt(defaultDistance, 10);
    const defaultDistanceMeters = Number.isFinite(parsedDistance) && parsedDistance > 0 ? parsedDistance : 5000;

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        nickname: nickname.trim() || user.username,
        profile_photo_url: profilePhotoUrl.trim() || undefined,
        default_duration: defaultDuration,
        default_visibility: defaultVisibility,
        default_distance_meters: defaultDistanceMeters,
        onboarding_completed: true,
      } as any);
      Alert.alert('Saved', 'Profile and preferences updated.');
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Set your defaults so creating activities is faster.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review Summary</Text>
        <Text style={styles.previewText}>
          Total reviews: {reviewStats?.review_count || 0}
          {typeof reviewStats?.visible_score === 'number'
            ? ` • Public score: ${reviewStats.visible_score.toFixed(2)}`
            : ' • Public score hidden until 5 reviews'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity</Text>
        <Text style={styles.previewText}>Public name preview: {usernamePreview}</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Nickname"
          maxLength={30}
        />
        <TextInput
          style={styles.input}
          value={profilePhotoUrl}
          onChangeText={setProfilePhotoUrl}
          placeholder="Profile photo URL"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Duration</Text>
        <View style={styles.row}>
          {ACTIVITY_DURATIONS.map((dur) => {
            const selected = defaultDuration === dur;
            return (
              <TouchableOpacity
                key={dur}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => setDefaultDuration(dur)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{dur} min</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Visibility</Text>
        <View style={styles.row}>
          {ACTIVITY_VISIBILITY.map((value) => {
            const selected = defaultVisibility === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => setDefaultVisibility(value)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {value === 'friends' ? 'Friends Only' : 'Nearby Players'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Search Radius (meters)</Text>
        <TextInput
          style={styles.input}
          value={defaultDistance}
          onChangeText={setDefaultDistance}
          keyboardType="number-pad"
          placeholder="5000"
        />
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
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
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  optionText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/userService';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { resolveUserDefaultSport } from '../../constants/sports';
import { ROUTES } from '../../constants/routes';
import {
  getPendingReviewPrompts,
  getProfileReviewStats,
  PendingReviewPrompt,
} from '../../services/reviewService';
import { ProfileReviewStats } from '../../types/review';
import {
  getProfileTrustStats,
  getUsersIBlocked,
  unblockUser,
  updatePushQuietHours,
} from '../../services/safetyService';
import { ProfileTrustStats, UserBlock } from '../../types/safety';
import { FULL_LEGAL_SECTIONS, PRIVACY_LOCATION_TEXT } from '../../constants/legal';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, signOut, refreshUser } = useAuth();
  const { sports } = useSportsCatalog();
  const defaultSport = resolveUserDefaultSport(user?.preferred_sports?.[0]);

  const openActivityDetail = (activityId: string) => {
    navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, { activityId } as never);
  };

  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
  const [reviewStats, setReviewStats] = useState<ProfileReviewStats | null>(null);
  const [reviewPrompts, setReviewPrompts] = useState<PendingReviewPrompt[]>([]);
  const [reviewPromptsLoading, setReviewPromptsLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<UserBlock[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [quietPreset, setQuietPreset] = useState<'off' | '22-8' | '23-7'>('off');
  const [savingQuiet, setSavingQuiet] = useState(false);
  const [trustStats, setTrustStats] = useState<ProfileTrustStats | null>(null);

  const usernamePreview = useMemo(() => {
    if (nickname.trim()) {
      return nickname.trim();
    }
    return user?.username || 'Player';
  }, [nickname, user?.username]);

  useEffect(() => {
    if (!user?.id) {
      setReviewStats(null);
      setReviewPrompts([]);
      return;
    }
    getProfileReviewStats(user.id)
      .then(setReviewStats)
      .catch(() => setReviewStats(null));
  }, [user?.id]);

  const loadReviewPrompts = useCallback(async () => {
    if (!user?.id) {
      setReviewPrompts([]);
      return;
    }
    setReviewPromptsLoading(true);
    try {
      const prompts = await getPendingReviewPrompts(user.id);
      setReviewPrompts(prompts);
    } catch {
      setReviewPrompts([]);
    } finally {
      setReviewPromptsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadReviewPrompts();
  }, [loadReviewPrompts]);

  useEffect(() => {
    if (user?.push_quiet_hours_start === 22 && user?.push_quiet_hours_end === 8) {
      setQuietPreset('22-8');
    } else if (user?.push_quiet_hours_start === 23 && user?.push_quiet_hours_end === 7) {
      setQuietPreset('23-7');
    } else if (user?.push_quiet_hours_start == null) {
      setQuietPreset('off');
    }
  }, [user?.push_quiet_hours_start, user?.push_quiet_hours_end]);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.id) {
      setBlockedUsers([]);
      return;
    }
    setBlockedLoading(true);
    try {
      setBlockedUsers(await getUsersIBlocked(user.id));
    } catch {
      setBlockedUsers([]);
    } finally {
      setBlockedLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  useEffect(() => {
    if (!user?.id) {
      setTrustStats(null);
      return;
    }
    getProfileTrustStats(user.id)
      .then(setTrustStats)
      .catch(() => setTrustStats(null));
  }, [user?.id]);

  const handleSaveQuietHours = async () => {
    if (!user?.id) {
      return;
    }
    const map = {
      off: { start: null as number | null, end: null as number | null },
      '22-8': { start: 22, end: 8 },
      '23-7': { start: 23, end: 7 },
    };
    const { start, end } = map[quietPreset];
    setSavingQuiet(true);
    try {
      await updatePushQuietHours(user.id, start, end);
      Alert.alert('Saved', 'Push quiet hours updated (UTC).');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not save quiet hours.');
    } finally {
      setSavingQuiet(false);
    }
  };

  const handleUnblock = (blockedId: string, username: string) => {
    if (!user?.id) {
      return;
    }
    Alert.alert(`Unblock ${username}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await unblockUser(user.id, blockedId);
            await loadBlockedUsers();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Could not unblock.');
          }
        },
      },
    ]);
  };

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

  const handleDefaultSport = async (sport: string) => {
    if (!user?.id || user.preferred_sports?.[0] === sport) {
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        preferred_sports: [sport] as typeof user.preferred_sports,
      });
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Could not update default sport.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'Please sign in and try again.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        nickname: nickname.trim() || user.username,
        onboarding_completed: true,
      } as any);
      Alert.alert('Saved', 'Profile updated.');
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your games, reviews, and account settings.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Games</Text>
        <Text style={styles.previewText}>
          Upcoming, past, and hosted games live in the My Games tab. Game chats are in Chats.
        </Text>
        <TouchableOpacity
          style={styles.myGamesLink}
          onPress={() => navigation.navigate(ROUTES.MY_GAMES.TAB as never)}
        >
          <Text style={styles.myGamesLinkText}>Open My Games →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rate your partners</Text>
          <TouchableOpacity onPress={loadReviewPrompts}>
            <Text style={styles.linkText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {reviewPromptsLoading ? (
          <ActivityIndicator color="#007AFF" style={styles.gamesLoader} />
        ) : reviewPrompts.length === 0 ? (
          <Text style={styles.previewText}>
            After a game ends, partners appear here to rate (about 2 hours after game time).
          </Text>
        ) : (
          reviewPrompts.map((prompt) => (
            <TouchableOpacity
              key={`${prompt.activity_id}:${prompt.reviewed_id}`}
              style={[
                styles.reviewPromptCard,
                !prompt.rateable && styles.reviewPromptCardMuted,
              ]}
              onPress={() =>
                prompt.rateable
                  ? openActivityDetail(prompt.activity_id)
                  : undefined
              }
              disabled={!prompt.rateable}
            >
              <Text style={styles.reviewPromptTitle}>
                Rate {prompt.reviewed_username} — {prompt.court_name}
              </Text>
              <Text style={styles.reviewPromptMeta}>
                {prompt.sport_type} • {new Date(prompt.start_time).toLocaleString()}
              </Text>
              {!prompt.rateable ? (
                <Text style={styles.reviewPromptSoon}>Rating opens soon after the game ends</Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review summary</Text>
        <Text style={styles.previewText}>
          Total reviews: {reviewStats?.review_count || 0}
          {typeof reviewStats?.visible_score === 'number'
            ? ` • Public score: ${reviewStats.visible_score.toFixed(2)}`
            : ' • Public score hidden until 5 reviews'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default sport</Text>
        <Text style={styles.previewText}>
          Discover and Create Game start with this sport ({defaultSport}).
        </Text>
        <View style={styles.row}>
          {sports.map((sport) => {
            const selected = defaultSport === sport.name;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => void handleDefaultSport(sport.name)}
                disabled={saving}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {sport.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>You</Text>
        <View style={styles.identityRow}>
          {user?.profile_photo_url ? (
            <Image source={{ uri: user.profile_photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{usernamePreview.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.identityTextCol}>
            <Text style={styles.displayName}>{usernamePreview}</Text>
            <Text style={styles.usernameHandle}>@{user?.username || 'player'}</Text>
          </View>
        </View>
        <Text style={styles.fieldLabel}>Display name</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="How others see you in games"
          maxLength={30}
        />
        <Text style={styles.previewText}>Profile photo upload is coming soon.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trust</Text>
        <Text style={styles.previewText}>
          No-shows recorded against you: {trustStats?.no_show_count ?? 0}
        </Text>
        <Text style={styles.previewText}>
          Late exits before finalize: {trustStats?.flake_count ?? 0}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & privacy</Text>
        {FULL_LEGAL_SECTIONS.map((section) => (
          <View key={section.title} style={styles.legalBlock}>
            <Text style={styles.legalTitle}>{section.title}</Text>
            <Text style={styles.previewText}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.previewText}>{PRIVACY_LOCATION_TEXT}</Text>
      </View>

      {user?.is_admin ? (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate(ROUTES.ADMIN.MAIN as any)}
        >
          <Text style={styles.adminButtonText}>Open admin dashboard</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety</Text>
        <Text style={styles.previewText}>
          Report or block players from their profile on a game or 1:1 chat (Safety in chat header).
          Push quiet hours use UTC until we add local timezone support.
        </Text>
        <Text style={styles.previewText}>Push quiet hours</Text>
        <View style={styles.row}>
          {(['off', '22-8', '23-7'] as const).map((preset) => {
            const selected = quietPreset === preset;
            const label =
              preset === 'off' ? 'Off' : preset === '22-8' ? '22:00–08:00' : '23:00–07:00';
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => setQuietPreset(preset)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.saveButton, savingQuiet && styles.saveButtonDisabled]}
          onPress={handleSaveQuietHours}
          disabled={savingQuiet}
        >
          <Text style={styles.saveButtonText}>{savingQuiet ? 'Saving...' : 'Save quiet hours'}</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Blocked users</Text>
          <TouchableOpacity onPress={loadBlockedUsers}>
            <Text style={styles.linkText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {blockedLoading ? (
          <ActivityIndicator color="#007AFF" style={styles.gamesLoader} />
        ) : blockedUsers.length === 0 ? (
          <Text style={styles.previewText}>No blocked users.</Text>
        ) : (
          blockedUsers.map((row) => {
            const username =
              (row.blocked_profile as { username?: string } | undefined)?.username || 'Player';
            return (
              <View key={row.id} style={styles.blockedRow}>
                <Text style={styles.blockedName}>{username}</Text>
                <TouchableOpacity onPress={() => handleUnblock(row.blocked_id, username)}>
                  <Text style={styles.linkText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save profile'}</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkTextSpaced: {
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  myGamesLink: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#eef5ff',
    alignSelf: 'flex-start',
  },
  myGamesLinkText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  gamesLoader: {
    marginVertical: 12,
  },
  gamesSubheading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  reviewPromptCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8faff',
  },
  reviewPromptCardMuted: {
    backgroundColor: '#f5f5f5',
    opacity: 0.85,
  },
  reviewPromptSoon: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  identityTextCol: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  usernameHandle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  reviewPromptTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  reviewPromptMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
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
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  blockedName: {
    fontSize: 15,
    fontWeight: '500',
  },
  legalBlock: {
    marginBottom: 10,
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminButton: {
    marginTop: 8,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ProfileScreen;

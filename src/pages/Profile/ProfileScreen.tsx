import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import {
  PRIVACY_LOCATION_TEXT,
  TERMS_SUMMARY,
  WAIVER_TEXT,
} from '../../constants/legal';
import { getMyRegularGroups } from '../../services/regularGroupService';
import { RegularGroup } from '../../types/regularGroup';
import { FOUNDER_BENEFITS_COPY } from '../../constants/betaCopy';
import { BetaMarketBanner } from '../../components/home/BetaMarketBanner';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { Button } from '../../components/ui';
import { colors, PRIMARY_COLOR, radius, spacing } from '../../constants/theme';
import {
  formatReliabilityLabel,
  getUserAttendanceStats,
  UserAttendanceStats,
} from '../../services/activityService';

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ label, value, onPress, showChevron = true }) => (
  <TouchableOpacity
    style={styles.settingsRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingsRowMain}>
      <Text style={styles.settingsRowLabel}>{label}</Text>
      {value ? <Text style={styles.settingsRowValue}>{value}</Text> : null}
    </View>
    {showChevron && onPress ? <Text style={styles.chevron}>›</Text> : null}
  </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, signOut, refreshUser } = useAuth();
  const { sports } = useSportsCatalog();
  const defaultSport = resolveUserDefaultSport(user?.preferred_sports?.[0]);

  const openActivityDetail = (activityId: string) => {
    navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, { activityId } as never);
  };

  const [savingNickname, setSavingNickname] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
  const [reviewStats, setReviewStats] = useState<ProfileReviewStats | null>(null);
  const [reviewPrompts, setReviewPrompts] = useState<PendingReviewPrompt[]>([]);
  const [reviewPromptsLoading, setReviewPromptsLoading] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<UserBlock[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [quietPreset, setQuietPreset] = useState<'off' | '22-8' | '23-7'>('off');
  const [savingQuiet, setSavingQuiet] = useState(false);
  const [trustStats, setTrustStats] = useState<ProfileTrustStats | null>(null);
  const [legalModal, setLegalModal] = useState<{ title: string; body: string } | null>(null);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [regularGroups, setRegularGroups] = useState<RegularGroup[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<UserAttendanceStats | null>(null);
  const [savingTimezone, setSavingTimezone] = useState(false);

  const usernamePreview = useMemo(() => {
    if (nickname.trim()) {
      return nickname.trim();
    }
    return user?.username || 'Player';
  }, [nickname, user?.username]);

  const trustHeroLine = useMemo(() => {
    const count = reviewStats?.review_count || 0;
    if (typeof reviewStats?.visible_score === 'number') {
      return `${reviewStats.visible_score.toFixed(1)} / 5 · ${count} review${count === 1 ? '' : 's'}`;
    }
    if (count > 0) {
      return `${count} review${count === 1 ? '' : 's'} · public rating after 5`;
    }
    return 'New — play games to build your rating';
  }, [reviewStats]);

  const reliabilityLine = useMemo(() => {
    if (attendanceStats && attendanceStats.committed_sessions > 0) {
      const label = formatReliabilityLabel(attendanceStats);
      const detail = `${attendanceStats.confirmed_attended}/${attendanceStats.committed_sessions} locked games attended`;
      return `${label} · ${detail}`;
    }
    const flakes = trustStats?.flake_count ?? 0;
    const noShows = trustStats?.no_show_count ?? 0;
    if (flakes === 0 && noShows === 0) {
      return 'New player — reliability builds after locked rosters';
    }
    const parts: string[] = [];
    if (noShows > 0) {
      parts.push(`${noShows} no-show${noShows === 1 ? '' : 's'} recorded`);
    }
    if (flakes > 0) {
      parts.push(`${flakes} late exit${flakes === 1 ? '' : 's'} before finalize`);
    }
    return parts.join(' · ');
  }, [attendanceStats, trustStats]);

  const timezoneLabel = useMemo(() => {
    if (user?.timezone) {
      return user.timezone.replace(/_/g, ' ');
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ');
    } catch {
      return 'Not set';
    }
  }, [user?.timezone]);

  const rateablePromptCount = useMemo(
    () => reviewPrompts.filter((p) => p.rateable).length,
    [reviewPrompts]
  );

  useEffect(() => {
    setNickname(user?.nickname || user?.username || '');
  }, [user?.nickname, user?.username]);

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
      setReviewPrompts(await getPendingReviewPrompts(user.id));
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

  useEffect(() => {
    if (!user?.id) {
      setRegularGroups([]);
      return;
    }
    getMyRegularGroups(user.id)
      .then(setRegularGroups)
      .catch(() => setRegularGroups([]));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setAttendanceStats(null);
      return;
    }
    getUserAttendanceStats(user.id)
      .then(setAttendanceStats)
      .catch(() => setAttendanceStats(null));
  }, [user?.id]);

  const pickTimezone = () => {
    if (!user?.id) {
      return;
    }
    const options = [
      { label: 'Pacific (LA)', value: 'America/Los_Angeles' },
      { label: 'Mountain', value: 'America/Denver' },
      { label: 'Central', value: 'America/Chicago' },
      { label: 'Eastern', value: 'America/New_York' },
      {
        label: `Use device (${Intl.DateTimeFormat().resolvedOptions().timeZone})`,
        value: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    ];
    Alert.alert('Time zone', 'Used for game reminders and quiet hours.', [
      ...options.map((o) => ({
        text: o.label,
        onPress: async () => {
          setSavingTimezone(true);
          try {
            await updateUserProfile(user.id, { timezone: o.value });
            await refreshUser();
          } catch (error: unknown) {
            Alert.alert(
              'Could not save',
              error instanceof Error ? error.message : 'Try again.'
            );
          } finally {
            setSavingTimezone(false);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveNickname = async () => {
    if (!user?.id) {
      return;
    }
    const trimmed = nickname.trim() || user.username;
    if (trimmed === (user.nickname || user.username)) {
      return;
    }
    setSavingNickname(true);
    try {
      await updateUserProfile(user.id, {
        nickname: trimmed,
        onboarding_completed: true,
      } as any);
      await refreshUser();
    } catch (error: unknown) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Could not save name.');
    } finally {
      setSavingNickname(false);
    }
  };

  const applyQuietPreset = async (preset: 'off' | '22-8' | '23-7') => {
    if (!user?.id || preset === quietPreset) {
      setQuietPreset(preset);
      return;
    }
    setQuietPreset(preset);
    const map = {
      off: { start: null as number | null, end: null as number | null },
      '22-8': { start: 22, end: 8 },
      '23-7': { start: 23, end: 7 },
    };
    const { start, end } = map[preset];
    setSavingQuiet(true);
    try {
      await updatePushQuietHours(user.id, start, end);
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save quiet hours.');
      setQuietPreset(quietPreset);
    } finally {
      setSavingQuiet(false);
    }
  };

  const handleDefaultSport = async (sport: string) => {
    if (!user?.id || user.preferred_sports?.[0] === sport) {
      setShowSportPicker(false);
      return;
    }
    try {
      await updateUserProfile(user.id, {
        preferred_sports: [sport] as typeof user.preferred_sports,
      });
      await refreshUser();
      setShowSportPicker(false);
    } catch (error: unknown) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Could not update sport.');
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
          } catch (error: unknown) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not unblock.');
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
          } catch (error: unknown) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
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
            <Text style={styles.trustHero}>{trustHeroLine}</Text>
            <Text style={styles.reliabilityHero}>{reliabilityLine}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Display name</Text>
        <View style={styles.nameRow}>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            onEndEditing={() => void saveNickname()}
            placeholder="How others see you in games"
            maxLength={30}
          />
          {savingNickname ? <ActivityIndicator color={PRIMARY_COLOR} size="small" /> : null}
        </View>
      </View>

      <BetaMarketBanner />

      {rateablePromptCount > 0 ? (
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.ratingsHeader}
            onPress={() => setShowRatings((v) => !v)}
          >
            <Text style={styles.sectionTitle}>
              Rate Players ({rateablePromptCount})
            </Text>
            <Text style={styles.chevron}>{showRatings ? '▼' : '›'}</Text>
          </TouchableOpacity>
          {showRatings ? (
            reviewPromptsLoading ? (
              <ActivityIndicator color={PRIMARY_COLOR} style={styles.inlineLoader} />
            ) : (
              reviewPrompts.map((prompt) => (
                <TouchableOpacity
                  key={`${prompt.activity_id}:${prompt.reviewed_id}`}
                  style={[
                    styles.reviewPromptCard,
                    !prompt.rateable && styles.reviewPromptCardMuted,
                  ]}
                  onPress={() =>
                    prompt.rateable ? openActivityDetail(prompt.activity_id) : undefined
                  }
                  disabled={!prompt.rateable}
                >
                  <Text style={styles.reviewPromptTitle}>
                    Rate {prompt.reviewed_username} — {prompt.court_name}
                  </Text>
                  <Text style={styles.reviewPromptMeta}>
                    {prompt.sport_type} · {new Date(prompt.start_time).toLocaleString()}
                  </Text>
                  {!prompt.rateable ? (
                    <Text style={styles.reviewPromptSoon}>
                      Opens ~2 hours after game time
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))
            )
          ) : null}
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Social</Text>
        <Button
          title="Add friends"
          size="sm"
          onPress={() =>
            navigation.navigate(ROUTES.FRIENDS.LIST as never, { openSearch: true } as never)
          }
          style={styles.addFriendsProfileBtn}
        />
        <Text style={styles.addFriendsProfileHint}>
          Search by username to connect and message
        </Text>
        <SettingsRow
          label="Friends"
          value="Your list, requests, messages"
          onPress={() => navigation.navigate(ROUTES.FRIENDS.LIST as never)}
        />
        <SettingsRow
          label="My games"
          value="Upcoming, past, hosting"
          onPress={() => navigation.navigate(ROUTES.MY_GAMES.TAB as never)}
        />
      </View>

      {regularGroups.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.groupLabel}>{PRODUCT_COPY.yourRallies}</Text>
          {regularGroups.map((group) => (
            <SettingsRow
              key={group.id}
              label={group.name}
              value={group.sport_type}
              onPress={() =>
                navigation.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
                  groupId: group.id,
                } as never)
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Activity</Text>
        <SettingsRow
          label="Default sport"
          value={defaultSport}
          onPress={() => setShowSportPicker((v) => !v)}
        />
        {showSportPicker ? (
          <View style={styles.sportPicker}>
            {sports.map((sport) => {
              const selected = defaultSport === sport.name;
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportChip, selected && styles.sportChipSelected]}
                  onPress={() => void handleDefaultSport(sport.name)}
                >
                  <Text style={[styles.sportChipText, selected && styles.sportChipTextSelected]}>
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Schedule</Text>
        <SettingsRow
          label="Time zone"
          value={savingTimezone ? 'Saving…' : timezoneLabel}
          onPress={pickTimezone}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Notifications</Text>
        <Text style={styles.hint}>Quiet hours (UTC) — join pushes skipped during this window.</Text>
        <View style={styles.quietRow}>
          {(['off', '22-8', '23-7'] as const).map((preset) => {
            const selected = quietPreset === preset;
            const label =
              preset === 'off' ? 'Off' : preset === '22-8' ? '22:00–08:00' : '23:00–07:00';
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.quietChip, selected && styles.quietChipSelected]}
                onPress={() => void applyQuietPreset(preset)}
                disabled={savingQuiet}
              >
                <Text style={[styles.quietChipText, selected && styles.quietChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Safety</Text>
        <Text style={styles.hint}>
          Report or block from a game or DM (Safety in chat header or player profile).
        </Text>
        <SettingsRow
          label="Blocked users"
          value={
            blockedLoading
              ? 'Loading…'
              : blockedUsers.length === 0
                ? 'None'
                : `${blockedUsers.length}`
          }
          onPress={() => setShowBlocked((v) => !v)}
        />
        {showBlocked ? (
          blockedLoading ? (
            <ActivityIndicator color={PRIMARY_COLOR} style={styles.inlineLoader} />
          ) : blockedUsers.length === 0 ? (
            <Text style={styles.hint}>No blocked users.</Text>
          ) : (
            blockedUsers.map((row) => {
              const username =
                (row.blocked_profile as { username?: string } | undefined)?.username || 'Player';
              return (
                <View key={row.id} style={styles.blockedRow}>
                  <Text style={styles.blockedName}>@{username}</Text>
                  <TouchableOpacity onPress={() => handleUnblock(row.blocked_id, username)}>
                    <Text style={styles.linkText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )
        ) : null}
      </View>

      <View style={styles.founderCard}>
        <Text style={styles.founderTitle}>LA beta · founding players</Text>
        <Text style={styles.founderBody}>{FOUNDER_BENEFITS_COPY}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Beta</Text>
        <SettingsRow
          label="Send feedback"
          value="Founding Member notes"
          onPress={() =>
            navigation.navigate(ROUTES.FEEDBACK.BETA as never, { screen: 'Profile' } as never)
          }
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Legal</Text>
        <SettingsRow
          label="Terms of use"
          onPress={() => setLegalModal({ title: 'Terms of use', body: TERMS_SUMMARY })}
        />
        <SettingsRow
          label="Activity waiver"
          onPress={() => setLegalModal({ title: 'Activity waiver', body: WAIVER_TEXT })}
        />
        <SettingsRow
          label="Location & privacy"
          onPress={() =>
            setLegalModal({ title: 'Location & privacy', body: PRIVACY_LOCATION_TEXT })
          }
        />
      </View>

      {user?.is_admin ? (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate(ROUTES.ADMIN.MAIN as any)}
        >
          <Text style={styles.adminButtonText}>Admin dashboard</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Modal
        visible={legalModal != null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModal(null)}
      >
        <View style={styles.legalModal}>
          <View style={styles.legalModalHeader}>
            <Text style={styles.legalModalTitle}>{legalModal?.title}</Text>
            <TouchableOpacity onPress={() => setLegalModal(null)}>
              <Text style={styles.linkText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.legalModalBody}>
            <Text style={styles.legalBodyText}>{legalModal?.body}</Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  identityTextCol: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  usernameHandle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trustHero: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  reliabilityHero: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    color: colors.text,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ratingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addFriendsProfileBtn: {
    marginBottom: spacing.xs,
  },
  addFriendsProfileHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  settingsRowMain: {
    flex: 1,
  },
  settingsRowLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingsRowValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#aaa',
    marginLeft: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
    marginTop: 4,
  },
  sportPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  sportChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
  },
  sportChipSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: PRIMARY_COLOR,
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sportChipTextSelected: {
    color: '#fff',
  },
  quietRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  quietChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  quietChipSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: colors.primaryLight,
  },
  quietChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  quietChipTextSelected: {
    color: PRIMARY_COLOR,
  },
  reviewPromptCard: {
    borderWidth: 1,
    borderColor: '#e0e8f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8faff',
  },
  reviewPromptCardMuted: {
    backgroundColor: '#f5f5f5',
    opacity: 0.9,
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
  reviewPromptSoon: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
  inlineLoader: {
    marginVertical: 12,
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
  linkText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
    fontSize: 15,
  },
  founderCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  founderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  founderBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  adminButton: {
    marginTop: 4,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  signOutButton: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },
  legalModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  legalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  legalModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  legalModalBody: {
    padding: 16,
    paddingBottom: 32,
  },
  legalBodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
});

export default ProfileScreen;

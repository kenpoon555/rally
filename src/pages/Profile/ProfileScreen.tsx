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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile, deleteOwnAccount } from '../../services/userService';
import { useSportsCatalog } from '../../hooks/useSportsCatalog';
import { resolveUserDefaultSport } from '../../constants/sports';
import { ROUTES } from '../../constants/routes';
import {
  getPendingReviewPrompts,
  getProfileReviewStats,
  PendingReviewPrompt,
} from '../../services/reviewService';
import { subscribeReviewPromptsInvalidation } from '../../utils/reviewPromptsBus';
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
import { PRODUCT_COPY } from '../../constants/productCopy';
import { Button, KeyboardSafeView, ScreenHeader, keyboardAwareScrollProps } from '../../components/ui';
import { ProfileTabBar, ProfileTab } from '../../components/profile/ProfileTabBar';
import { ProfileSettingsRow } from '../../components/profile/ProfileSettingsRow';
import { ProfileLinkCard } from '../../components/profile/ProfileLinkCard';
import { ProfileScoreCard } from '../../components/profile/ProfileScoreCard';
import { colors, PRIMARY_COLOR, radius, spacing } from '../../constants/theme';
import {
  formatReliabilityLabel,
  getUserAttendanceStats,
  MyGameEntry,
  UserAttendanceStats,
} from '../../services/activityService';
import { fetchCachedMyGames } from '../../services/userDataCache';
import {
  buildProfileScorecardStats,
  formatRallyMemberSince,
  orderSportsAttended,
} from '../../utils/profileScorecardHelpers';
import { bumpPreferredSportsMru } from '../../utils/buildPlayStripSports';
import { setProfilePayment, formatPaymentLabel } from '../../services/paymentService';
import { PreferredPayment } from '../../types/user';
import { getMyCaptainStatus, submitCaptainApplication } from '../../services/captainService';
import { submitCaptainFeedback } from '../../services/captainFeedbackService';
import { CaptainStatusPayload } from '../../types/captain';
import { SportType } from '../../constants/sports';
import {
  cancelFreeAgentPost,
  createFreeAgentPost,
  getMyFreeAgentPost,
  listMyPendingFreeAgentInvites,
  respondFreeAgentInvite,
} from '../../services/freeAgentService';
import { FreeAgentAvailabilityPreset, FreeAgentInvite, MyFreeAgentPost } from '../../types/freeAgent';
import { formatActivityTime } from '../../utils/activityHelpers';
import { submitConciergeRequest } from '../../services/conciergeService';
import { profileDisplayName } from '../../utils/profileDisplayName';
import { useCoachParent } from '../../hooks/useCoachParent';
import { ProfileFamilySection } from '../../components/coachParent/ProfileFamilySection';
import { ProfileCoachToolsSection } from '../../components/coachParent/ProfileCoachToolsSection';
import { CLASS_INBOX_ANNOUNCE } from '../../constants/coachParentFlags';
import { BETA_OPS_SURFACES_ENABLED } from '../../constants/betaFlags';
import {
  listMyPendingFillInvites,
  respondFillInvite,
} from '../../services/fillInService';
import {
  listMyPendingGameFriendInvites,
  respondGameFriendInvite,
} from '../../services/gameFriendInviteService';
import { FillInvite } from '../../types/fillIn';
import { GameFriendInvite } from '../../types/gameFriendInvite';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut, refreshUser } = useAuth();
  const { sports } = useSportsCatalog();
  const defaultSport = resolveUserDefaultSport(user?.preferred_sports?.[0]);
  const [profileTab, setProfileTab] = useState<ProfileTab>('me');
  const { showFamily, showCoachTools, students } = useCoachParent();

  const openActivityDetail = (activityId: string) => {
    navigation.navigate(ROUTES.ACTIVITY.DETAIL, { activityId });
  };

  const [savingNickname, setSavingNickname] = useState(false);
  const [nickname, setNickname] = useState(() => profileDisplayName(user));
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
  const [myGameEntries, setMyGameEntries] = useState<MyGameEntry[]>([]);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [paymentNote, setPaymentNote] = useState(user?.payment_note ?? '');
  const [preferredPayment, setPreferredPayment] = useState<PreferredPayment | null>(
    user?.preferred_payment ?? null
  );
  const [savingPayment, setSavingPayment] = useState(false);
  const [showPaymentEditor, setShowPaymentEditor] = useState(false);
  const [captainStatus, setCaptainStatus] = useState<CaptainStatusPayload | null>(null);
  const [captainSport, setCaptainSport] = useState<SportType>('Badminton');
  const [captainNote, setCaptainNote] = useState('');
  const [captainGroupId, setCaptainGroupId] = useState<string | null>(null);
  const [submittingCaptain, setSubmittingCaptain] = useState(false);
  const [showCaptainForm, setShowCaptainForm] = useState(false);
  const [myFreeAgentPost, setMyFreeAgentPost] = useState<MyFreeAgentPost | null>(null);
  const [freeAgentInvites, setFreeAgentInvites] = useState<FreeAgentInvite[]>([]);
  const [freeAgentSport, setFreeAgentSport] = useState<SportType>('Badminton');
  const [freeAgentPreset, setFreeAgentPreset] =
    useState<FreeAgentAvailabilityPreset>('flexible');
  const [freeAgentNote, setFreeAgentNote] = useState('');
  const [savingFreeAgent, setSavingFreeAgent] = useState(false);
  const [showFreeAgentForm, setShowFreeAgentForm] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [fillInvites, setFillInvites] = useState<FillInvite[]>([]);
  const [gameFriendInvites, setGameFriendInvites] = useState<GameFriendInvite[]>([]);
  const [showConciergeForm, setShowConciergeForm] = useState(false);
  const [conciergeSport, setConciergeSport] = useState<SportType>('Badminton');
  const [conciergeArea, setConciergeArea] = useState('');
  const [conciergeAvailability, setConciergeAvailability] = useState('');
  const [submittingConcierge, setSubmittingConcierge] = useState(false);
  const [showCaptainFeedback, setShowCaptainFeedback] = useState(false);
  const [feedbackSport] = useState<SportType>('Badminton');
  const [feedbackArea, setFeedbackArea] = useState('host tools');
  const [feedbackScore, setFeedbackScore] = useState(3);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submittingCaptainFeedback, setSubmittingCaptainFeedback] = useState(false);

  useEffect(() => {
    setPaymentNote(user?.payment_note ?? '');
    setPreferredPayment(user?.preferred_payment ?? null);
  }, [user?.payment_note, user?.preferred_payment]);

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
    setNickname(profileDisplayName(user));
  }, [user]);

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

  useFocusEffect(
    useCallback(() => {
      void loadReviewPrompts();
    }, [loadReviewPrompts])
  );

  useEffect(() => {
    return subscribeReviewPromptsInvalidation(() => {
      void loadReviewPrompts();
    });
  }, [loadReviewPrompts]);

  useEffect(() => {
    if (rateablePromptCount > 0) {
      setShowRatings(true);
    }
  }, [rateablePromptCount]);

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
    getMyCaptainStatus()
      .then(setCaptainStatus)
      .catch(() => setCaptainStatus(null));
    getMyFreeAgentPost()
      .then(setMyFreeAgentPost)
      .catch(() => setMyFreeAgentPost(null));
    listMyPendingFreeAgentInvites()
      .then(setFreeAgentInvites)
      .catch(() => setFreeAgentInvites([]));
    listMyPendingFillInvites()
      .then(setFillInvites)
      .catch(() => setFillInvites([]));
    listMyPendingGameFriendInvites()
      .then(setGameFriendInvites)
      .catch(() => setGameFriendInvites([]));
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

  useEffect(() => {
    if (!user?.id) {
      setMyGameEntries([]);
      return;
    }
    fetchCachedMyGames(user.id)
      .then((result) => setMyGameEntries([...result.active, ...result.past]))
      .catch(() => setMyGameEntries([]));
  }, [user?.id]);

  const memberSinceLabel = useMemo(
    () => formatRallyMemberSince(user?.created_at),
    [user?.created_at]
  );

  const sportsAttended = useMemo(
    () => orderSportsAttended(myGameEntries, user?.preferred_sports ?? []),
    [myGameEntries, user?.preferred_sports]
  );

  const scorecardStats = useMemo(
    () => buildProfileScorecardStats(myGameEntries, attendanceStats),
    [myGameEntries, attendanceStats]
  );

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
    if (trimmed === profileDisplayName(user)) {
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
    setShowSportPicker(false);
    if (!user?.id) {
      return;
    }
    const nextMru = bumpPreferredSportsMru(user.preferred_sports, sport);
    const unchanged =
      nextMru.length === (user.preferred_sports?.length ?? 0) &&
      nextMru.every((value, index) => value === user.preferred_sports?.[index]);
    if (unchanged) {
      return;
    }
    try {
      await updateUserProfile(user.id, {
        preferred_sports: nextMru as typeof user.preferred_sports,
      });
      await refreshUser();
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your Rally account and profile data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Your account will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete permanently',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteOwnAccount();
                      await signOut();
                    } catch (error: unknown) {
                      Alert.alert(
                        'Error',
                        error instanceof Error ? error.message : 'Failed to delete account'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await signOut();
            if (result?.warning) {
              Alert.alert('Signed out', result.warning);
            }
          } catch (error: unknown) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardSafeView style={styles.container}>
      <ScreenHeader
        title="You"
        subtitle={
          profileTab === 'me'
            ? 'Your player card'
            : profileTab === 'connect'
              ? 'Friends, Rallies, and invites'
              : 'Account and preferences'
        }
        showLogo
        accentColor={colors.primaryDark}
      />
      <ProfileTabBar active={profileTab} onChange={setProfileTab} />
      <ScrollView contentContainerStyle={styles.content} {...keyboardAwareScrollProps}>
      {profileTab === 'me' ? (
      <>
      <ProfileScoreCard
        username={user?.username || 'player'}
        profilePhotoUrl={user?.profile_photo_url}
        memberSinceLabel={memberSinceLabel}
        sports={sportsAttended}
        stats={scorecardStats}
        style={styles.heroCard}
      />

      <View style={styles.heroCardFooter}>
        <Text style={styles.trustCaption} numberOfLines={2}>
          {trustHeroLine}
        </Text>
        <Text style={styles.reliabilityCaption} numberOfLines={2}>
          {reliabilityLine}
        </Text>

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
        <Text style={styles.groupLabel}>Preferences</Text>
        <ProfileSettingsRow
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
      </>
      ) : null}

      {profileTab === 'connect' ? (
      <>
      <ProfileLinkCard
        icon="people-outline"
        title="Friends"
        subtitle="Add friends, requests, and messages"
        onPress={() => navigation.navigate(ROUTES.FRIENDS.LIST)}
      />
      <ProfileLinkCard
        icon="search-outline"
        title="Find friends"
        subtitle="Search by username"
        onPress={() =>
          navigation.navigate(ROUTES.FRIENDS.LIST, { openSearch: true })
        }
      />
      <ProfileLinkCard
        icon="calendar-outline"
        title="My games"
        subtitle="Upcoming, past, and hosting"
        onPress={() => navigation.navigate(ROUTES.MY_GAMES.TAB)}
      />

      {regularGroups.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.groupLabel}>{PRODUCT_COPY.yourRallies}</Text>
          {regularGroups.map((group) => (
            <ProfileSettingsRow
              key={group.id}
              label={group.name}
              value={group.sport_type}
              onPress={() =>
                navigation.navigate(ROUTES.REGULAR_GROUP.CREW, {
                  groupId: group.id,
                })
              }
            />
          ))}
        </View>
      ) : null}

      {BETA_OPS_SURFACES_ENABLED ? (
      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>{PRODUCT_COPY.captainProgram}</Text>
        <Text style={styles.hint}>{PRODUCT_COPY.captainProgramHint}</Text>
        {(captainStatus?.captains ?? []).some((c) => c.status === 'active') ? (
          <Text style={styles.trustHero}>
            Active captain ·{' '}
            {(captainStatus?.captains ?? [])
              .filter((c) => c.status === 'active')
              .map((c) => c.sport)
              .join(', ')}
          </Text>
        ) : (captainStatus?.applications ?? []).some((a) => a.status === 'pending') ? (
          <Text style={styles.hint}>
            Application pending for{' '}
            {(captainStatus?.applications ?? [])
              .filter((a) => a.status === 'pending')
              .map((a) => a.sport)
              .join(', ')}
          </Text>
        ) : (
          <ProfileSettingsRow
            label="Apply to be a captain"
            value={showCaptainForm ? 'Editing…' : 'Los Angeles'}
            onPress={() => setShowCaptainForm((v) => !v)}
          />
        )}
        {showCaptainForm &&
        !(captainStatus?.captains ?? []).some((c) => c.status === 'active') ? (
          <View style={styles.paymentEditor}>
            <Text style={styles.fieldLabel}>Sport</Text>
            <View style={styles.quietRow}>
              {(['Badminton', 'Pickleball', 'Basketball'] as const).map((sport) => {
                const selected = captainSport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.quietChip, selected && styles.quietChipSelected]}
                    onPress={() => setCaptainSport(sport)}
                  >
                    <Text
                      style={[styles.quietChipText, selected && styles.quietChipTextSelected]}
                    >
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Your typical game</Text>
            <TextInput
              style={styles.input}
              value={captainNote}
              onChangeText={setCaptainNote}
              placeholder="e.g. Wed 7pm doubles at Santa Monica"
              maxLength={200}
            />
            {regularGroups.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Link a Rally (optional)</Text>
                <View style={styles.quietRow}>
                  <TouchableOpacity
                    style={[styles.quietChip, captainGroupId === null && styles.quietChipSelected]}
                    onPress={() => setCaptainGroupId(null)}
                  >
                    <Text
                      style={[
                        styles.quietChipText,
                        captainGroupId === null && styles.quietChipTextSelected,
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {regularGroups.map((group) => {
                    const selected = captainGroupId === group.id;
                    return (
                      <TouchableOpacity
                        key={group.id}
                        style={[styles.quietChip, selected && styles.quietChipSelected]}
                        onPress={() => setCaptainGroupId(group.id)}
                      >
                        <Text
                          style={[styles.quietChipText, selected && styles.quietChipTextSelected]}
                        >
                          {group.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}
            <Button
              title={submittingCaptain ? 'Submitting…' : 'Submit application'}
              size="sm"
              onPress={() => {
                setSubmittingCaptain(true);
                void (async () => {
                  try {
                    await submitCaptainApplication({
                      sport: captainSport,
                      typicalGameNote: captainNote,
                      regularGroupId: captainGroupId,
                    });
                    const status = await getMyCaptainStatus();
                    setCaptainStatus(status);
                    setShowCaptainForm(false);
                    Alert.alert(PRODUCT_COPY.captainApplicationSent, 'We review applications weekly.');
                  } catch (error: unknown) {
                    Alert.alert(
                      'Could not submit',
                      error instanceof Error ? error.message : 'Try again.'
                    );
                  } finally {
                    setSubmittingCaptain(false);
                  }
                })();
              }}
              disabled={submittingCaptain}
            />
          </View>
        ) : null}
      </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>{PRODUCT_COPY.freeAgents}</Text>
        <Text style={styles.hint}>{PRODUCT_COPY.freeAgentsHint}</Text>
        {[...freeAgentInvites, ...fillInvites, ...gameFriendInvites].length > 0 ? (
          <View style={styles.paymentEditor}>
            <Text style={styles.fieldLabel}>Game invites</Text>
            {gameFriendInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>
                  @{invite.inviter_username} · {invite.sport_type}
                  {invite.regular_group_id ? ' (this game)' : ''}
                </Text>
                <Text style={styles.hint}>
                  {formatActivityTime(invite.start_time)}
                  {invite.location_name ? ` · ${invite.location_name}` : ''}
                  {invite.open_spots > 0
                    ? ` · ${invite.open_spots} spot${invite.open_spots === 1 ? '' : 's'}`
                    : ' · waitlist'}
                </Text>
                <View style={styles.inviteActions}>
                  <Button
                    title={busyInviteId === invite.id ? '…' : 'Accept'}
                    size="sm"
                    onPress={() => {
                      setBusyInviteId(invite.id);
                      void (async () => {
                        try {
                          await respondGameFriendInvite(invite.id, true);
                          setGameFriendInvites(await listMyPendingGameFriendInvites());
                          openActivityDetail(invite.activity_id);
                        } catch (error: unknown) {
                          Alert.alert(
                            'Could not accept',
                            error instanceof Error ? error.message : 'Try again.'
                          );
                        } finally {
                          setBusyInviteId(null);
                        }
                      })();
                    }}
                    disabled={busyInviteId === invite.id}
                  />
                  <Button
                    title="Decline"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setBusyInviteId(invite.id);
                      void (async () => {
                        try {
                          await respondGameFriendInvite(invite.id, false);
                          setGameFriendInvites(await listMyPendingGameFriendInvites());
                        } catch (error: unknown) {
                          Alert.alert(
                            'Could not decline',
                            error instanceof Error ? error.message : 'Try again.'
                          );
                        } finally {
                          setBusyInviteId(null);
                        }
                      })();
                    }}
                    disabled={busyInviteId === invite.id}
                  />
                </View>
              </View>
            ))}
            {freeAgentInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>
                  @{invite.host_username} · {invite.sport_type}
                </Text>
                <Text style={styles.hint}>
                  {formatActivityTime(invite.start_time)}
                  {invite.location_name ? ` · ${invite.location_name}` : ''} ·{' '}
                  {invite.open_spots} spot{invite.open_spots === 1 ? '' : 's'}
                </Text>
                <View style={styles.inviteActions}>
                  <Button
                    title={busyInviteId === invite.id ? '…' : 'Accept'}
                    size="sm"
                    onPress={() => {
                      setBusyInviteId(invite.id);
                      void (async () => {
                        try {
                          await respondFreeAgentInvite(invite.id, true);
                          const [invites, post] = await Promise.all([
                            listMyPendingFreeAgentInvites(),
                            getMyFreeAgentPost(),
                          ]);
                          setFreeAgentInvites(invites);
                          setMyFreeAgentPost(post);
                          navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL, {
                            activityId: invite.activity_id,
                          });
                        } catch (error: unknown) {
                          Alert.alert(
                            'Could not accept',
                            error instanceof Error ? error.message : 'Try again.'
                          );
                        } finally {
                          setBusyInviteId(null);
                        }
                      })();
                    }}
                    disabled={busyInviteId === invite.id}
                  />
                  <Button
                    title="Decline"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setBusyInviteId(invite.id);
                      void (async () => {
                        try {
                          await respondFreeAgentInvite(invite.id, false);
                          setFreeAgentInvites(await listMyPendingFreeAgentInvites());
                        } catch (error: unknown) {
                          Alert.alert(
                            'Could not decline',
                            error instanceof Error ? error.message : 'Try again.'
                          );
                        } finally {
                          setBusyInviteId(null);
                        }
                      })();
                    }}
                    disabled={busyInviteId === invite.id}
                  />
                </View>
              </View>
            ))}
            {fillInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>
                  @{invite.host_username} · {invite.sport_type} (fill-in)
                </Text>
                <Text style={styles.hint}>
                  {formatActivityTime(invite.start_time)}
                  {invite.location_name ? ` · ${invite.location_name}` : ''}
                </Text>
                <View style={styles.inviteActions}>
                  <Button
                    title={busyInviteId === invite.id ? '…' : 'Accept'}
                    size="sm"
                    onPress={() => {
                      setBusyInviteId(invite.id);
                      void (async () => {
                        try {
                          await respondFillInvite(invite.id, true);
                          setFillInvites(await listMyPendingFillInvites());
                          navigation.getParent()?.navigate(ROUTES.ACTIVITY.DETAIL, {
                            activityId: invite.activity_id,
                          });
                        } catch (error: unknown) {
                          Alert.alert(
                            'Could not accept',
                            error instanceof Error ? error.message : 'Try again.'
                          );
                        } finally {
                          setBusyInviteId(null);
                        }
                      })();
                    }}
                    disabled={busyInviteId === invite.id}
                  />
                  <Button
                    title="Decline"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setBusyInviteId(invite.id);
                      void (async () => {
                        try {
                          await respondFillInvite(invite.id, false);
                          setFillInvites(await listMyPendingFillInvites());
                        } catch (error: unknown) {
                          Alert.alert(
                            'Could not decline',
                            error instanceof Error ? error.message : 'Try again.'
                          );
                        } finally {
                          setBusyInviteId(null);
                        }
                      })();
                    }}
                    disabled={busyInviteId === invite.id}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {myFreeAgentPost ? (
          <View style={styles.paymentEditor}>
            <Text style={styles.trustHero}>{PRODUCT_COPY.availabilityPosted}</Text>
            <Text style={styles.hint}>
              {myFreeAgentPost.sport} · until{' '}
              {new Date(myFreeAgentPost.expires_at).toLocaleDateString()}
            </Text>
            <Button
              title="Remove from board"
              variant="ghost"
              size="sm"
              onPress={() => {
                void (async () => {
                  try {
                    await cancelFreeAgentPost(myFreeAgentPost.id);
                    setMyFreeAgentPost(null);
                  } catch (error: unknown) {
                    Alert.alert(
                      'Could not remove',
                      error instanceof Error ? error.message : 'Try again.'
                    );
                  }
                })();
              }}
            />
          </View>
        ) : (
          <>
            <ProfileSettingsRow
              label={PRODUCT_COPY.postAvailability}
              value={showFreeAgentForm ? 'Editing…' : 'Your area'}
              onPress={() => setShowFreeAgentForm((v) => !v)}
            />
            {showFreeAgentForm ? (
              <View style={styles.paymentEditor}>
                <Text style={styles.fieldLabel}>Sport</Text>
                <View style={styles.quietRow}>
                  {(['Badminton', 'Pickleball'] as const).map((sport) => {
                    const selected = freeAgentSport === sport;
                    return (
                      <TouchableOpacity
                        key={sport}
                        style={[styles.quietChip, selected && styles.quietChipSelected]}
                        onPress={() => setFreeAgentSport(sport)}
                      >
                        <Text
                          style={[styles.quietChipText, selected && styles.quietChipTextSelected]}
                        >
                          {sport}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.fieldLabel}>Usually available</Text>
                <View style={styles.quietRow}>
                  {(['weeknights', 'weekends', 'flexible'] as const).map((preset) => {
                    const selected = freeAgentPreset === preset;
                    const label =
                      preset === 'weeknights'
                        ? 'Weeknights'
                        : preset === 'weekends'
                          ? 'Weekends'
                          : 'Flexible';
                    return (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.quietChip, selected && styles.quietChipSelected]}
                        onPress={() => setFreeAgentPreset(preset)}
                      >
                        <Text
                          style={[styles.quietChipText, selected && styles.quietChipTextSelected]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.fieldLabel}>Note (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={freeAgentNote}
                  onChangeText={setFreeAgentNote}
                  placeholder="Level, areas, doubles vs singles…"
                  maxLength={120}
                />
                <Button
                  title={savingFreeAgent ? 'Posting…' : 'Post for 2 weeks'}
                  size="sm"
                  onPress={() => {
                    setSavingFreeAgent(true);
                    void (async () => {
                      try {
                        await createFreeAgentPost({
                          sport: freeAgentSport,
                          availabilityPreset: freeAgentPreset,
                          note: freeAgentNote,
                        });
                        setMyFreeAgentPost(await getMyFreeAgentPost(freeAgentSport));
                        setShowFreeAgentForm(false);
                        Alert.alert(PRODUCT_COPY.availabilityPosted, PRODUCT_COPY.freeAgentsHint);
                      } catch (error: unknown) {
                        Alert.alert(
                          'Could not post',
                          error instanceof Error ? error.message : 'Try again.'
                        );
                      } finally {
                        setSavingFreeAgent(false);
                      }
                    })();
                  }}
                  disabled={savingFreeAgent}
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      {BETA_OPS_SURFACES_ENABLED ? (
      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>{PRODUCT_COPY.concierge}</Text>
        <Text style={styles.hint}>{PRODUCT_COPY.conciergeHint}</Text>
        <ProfileSettingsRow
          label="Request a match"
          value={showConciergeForm ? 'Editing…' : 'Los Angeles'}
          onPress={() => setShowConciergeForm((v) => !v)}
        />
        {showConciergeForm ? (
          <View style={styles.paymentEditor}>
            <Text style={styles.fieldLabel}>Sport</Text>
            <View style={styles.quietRow}>
              {(['Badminton', 'Pickleball', 'Basketball'] as const).map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[styles.quietChip, conciergeSport === sport && styles.quietChipSelected]}
                  onPress={() => setConciergeSport(sport)}
                >
                  <Text
                    style={[
                      styles.quietChipText,
                      conciergeSport === sport && styles.quietChipTextSelected,
                    ]}
                  >
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={conciergeArea}
              onChangeText={setConciergeArea}
              placeholder="Area (e.g. West LA, Pasadena)"
            />
            <TextInput
              style={styles.input}
              value={conciergeAvailability}
              onChangeText={setConciergeAvailability}
              placeholder="When you can play (e.g. weeknights)"
            />
            <Button
              title={submittingConcierge ? 'Sending…' : 'Submit request'}
              size="sm"
              onPress={() => {
                setSubmittingConcierge(true);
                void (async () => {
                  try {
                    await submitConciergeRequest({
                      sport: conciergeSport,
                      areaNote: conciergeArea,
                      availabilityNote: conciergeAvailability,
                    });
                    setShowConciergeForm(false);
                    Alert.alert(PRODUCT_COPY.conciergeSent, PRODUCT_COPY.conciergeHint);
                  } catch (error: unknown) {
                    Alert.alert(
                      'Could not submit',
                      error instanceof Error ? error.message : 'Try again.'
                    );
                  } finally {
                    setSubmittingConcierge(false);
                  }
                })();
              }}
              disabled={submittingConcierge}
            />
          </View>
        ) : null}
      </View>
      ) : null}

      {BETA_OPS_SURFACES_ENABLED &&
      (captainStatus?.captains ?? []).some((c) => c.status === 'active') ? (
        <View style={styles.sectionCard}>
          <Text style={styles.groupLabel}>{PRODUCT_COPY.captainFeedback}</Text>
          <Text style={styles.hint}>{PRODUCT_COPY.captainFeedbackHint}</Text>
          <ProfileSettingsRow
            label="Send sport feedback"
            value={showCaptainFeedback ? 'Editing…' : 'Captains only'}
            onPress={() => setShowCaptainFeedback((v) => !v)}
          />
          {showCaptainFeedback ? (
            <View style={styles.paymentEditor}>
              <Text style={styles.fieldLabel}>Feature area</Text>
              <TextInput
                style={styles.input}
                value={feedbackArea}
                onChangeText={setFeedbackArea}
                placeholder="e.g. rotation, nudge, onboarding"
              />
              <Text style={styles.fieldLabel}>Friction (1 easy – 5 hard)</Text>
              <View style={styles.quietRow}>
                {([1, 2, 3, 4, 5] as const).map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[styles.quietChip, feedbackScore === score && styles.quietChipSelected]}
                    onPress={() => setFeedbackScore(score)}
                  >
                    <Text
                      style={[
                        styles.quietChipText,
                        feedbackScore === score && styles.quietChipTextSelected,
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={feedbackNote}
                onChangeText={setFeedbackNote}
                placeholder="What blocked your crew this week?"
                multiline
              />
              <Button
                title={submittingCaptainFeedback ? 'Sending…' : 'Send feedback'}
                size="sm"
                onPress={() => {
                  setSubmittingCaptainFeedback(true);
                  void (async () => {
                    try {
                      const activeSport =
                        (captainStatus?.captains ?? []).find((c) => c.status === 'active')
                          ?.sport ?? feedbackSport;
                      await submitCaptainFeedback({
                        sport: String(activeSport),
                        featureArea: feedbackArea,
                        frictionScore: feedbackScore,
                        note: feedbackNote,
                      });
                      setShowCaptainFeedback(false);
                      setFeedbackNote('');
                      Alert.alert(PRODUCT_COPY.captainFeedbackSent);
                    } catch (error: unknown) {
                      Alert.alert(
                        'Could not send',
                        error instanceof Error ? error.message : 'Try again.'
                      );
                    } finally {
                      setSubmittingCaptainFeedback(false);
                    }
                  })();
                }}
                disabled={submittingCaptainFeedback || !feedbackNote.trim()}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      </>
      ) : null}

      {profileTab === 'settings' ? (
      <>
      {showFamily && user ? <ProfileFamilySection students={students} /> : null}
      {showCoachTools && user ? <ProfileCoachToolsSection user={user} /> : null}
      {__DEV__ && CLASS_INBOX_ANNOUNCE ? (
        <View style={styles.sectionCard}>
          <Text style={styles.groupLabel}>Validator</Text>
          <ProfileSettingsRow
            label="Test class enroll picker"
            value="Child profile picker"
            onPress={() =>
              navigation.navigate(ROUTES.COACH_PARENT.CHILD_PICKER, {
                classTitle: 'Beginner Badminton',
              })
            }
          />
        </View>
      ) : null}
      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Payments</Text>
        <Text style={styles.hint}>
          Shown to players in your games (not on public Discover). Court fees, Venmo, Zelle, etc.
        </Text>
        <ProfileSettingsRow
          label="How to pay you"
          value={
            user?.payment_note
              ? `${formatPaymentLabel(user.preferred_payment)} · ${user.payment_note}`
              : 'Not set'
          }
          onPress={() => setShowPaymentEditor((v) => !v)}
        />
        {showPaymentEditor ? (
          <View style={styles.paymentEditor}>
            <Text style={styles.fieldLabel}>Method</Text>
            <View style={styles.quietRow}>
              {(['venmo', 'zelle', 'cash', 'paypal', 'other'] as const).map((method) => {
                const selected = preferredPayment === method;
                return (
                  <TouchableOpacity
                    key={method}
                    style={[styles.quietChip, selected && styles.quietChipSelected]}
                    onPress={() => setPreferredPayment(method)}
                  >
                    <Text
                      style={[styles.quietChipText, selected && styles.quietChipTextSelected]}
                    >
                      {formatPaymentLabel(method)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Handle or instructions</Text>
            <TextInput
              style={styles.input}
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="@you · Zelle email · cash at court"
              maxLength={80}
              autoCapitalize="none"
            />
            <Button
              title={savingPayment ? 'Saving…' : 'Save payment info'}
              size="sm"
              onPress={() => {
                if (!user?.id) {
                  return;
                }
                setSavingPayment(true);
                void (async () => {
                  try {
                    await setProfilePayment(paymentNote, preferredPayment);
                    await refreshUser();
                    setShowPaymentEditor(false);
                  } catch (error: unknown) {
                    Alert.alert(
                      'Could not save',
                      error instanceof Error ? error.message : 'Try again.'
                    );
                  } finally {
                    setSavingPayment(false);
                  }
                })();
              }}
              disabled={savingPayment}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Schedule</Text>
        <ProfileSettingsRow
          label="Time zone"
          value={savingTimezone ? 'Saving…' : timezoneLabel}
          onPress={pickTimezone}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Notifications</Text>
        <Text style={styles.hint}>Quiet hours (local time) — join pushes skipped during this window.</Text>
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
          Report or block from chat (Safety in the header) or a player profile. Long-press a group message to report.
        </Text>
        <ProfileSettingsRow
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

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Help</Text>
        <ProfileSettingsRow
          label="Send feedback"
          value="Questions or ideas"
          onPress={() =>
            navigation.navigate(ROUTES.FEEDBACK.MAIN)
          }
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.groupLabel}>Legal</Text>
        <ProfileSettingsRow
          label="Terms of use"
          onPress={() => setLegalModal({ title: 'Terms of use', body: TERMS_SUMMARY })}
        />
        <ProfileSettingsRow
          label="Activity waiver"
          onPress={() => setLegalModal({ title: 'Activity waiver', body: WAIVER_TEXT })}
        />
        <ProfileSettingsRow
          label="Location & privacy"
          onPress={() =>
            setLegalModal({ title: 'Location & privacy', body: PRIVACY_LOCATION_TEXT })
          }
        />
        <ProfileSettingsRow
          label="Delete account"
          value="Permanent — cannot be undone"
          onPress={handleDeleteAccount}
          destructive
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
      </>
      ) : null}

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
    </KeyboardSafeView>
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
    marginBottom: spacing.md,
  },
  heroCardFooter: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustCaption: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  reliabilityCaption: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
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
  statPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    flex: 1,
    minWidth: '46%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 4,
  },
  statPillRating: {
    backgroundColor: colors.primaryLight,
  },
  statPillReliability: {
    backgroundColor: colors.accentSoft,
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  paymentEditor: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  inviteCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
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

import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScheduleDateTimePicker } from '../../components/ScheduleDateTimePicker';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { sportSupportsMiniTournament } from '../../constants/sports';
import { useActivity } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import JoinRequestButton from '../../components/JoinRequestButton';
import {
  finalizeGameCommitment,
  setGameReady,
  leaveGame,
  getActivityCandidateLocations,
  getActivityJoinRequests,
  upsertParticipantPreference,
  approveJoinRequest,
  rejectJoinRequest,
  canOpenActivityChat,
  scheduleNextGameFromActivity,
  scheduleGroupNextGame,
  joinGameViaInvite,
  getActivityByInviteToken,
  updateActivity,
  setSessionNote,
} from '../../services/activityService';
import {
  createRegularGroupFromActivity,
  getRegularGroupById,
  isRegularGroupMember,
} from '../../services/regularGroupService';
import {
  createMiniTournament,
  getTournamentsForGroup,
} from '../../services/miniTournamentService';
import { MiniTournament } from '../../types/miniTournament';
import { GameCardDetailHero } from '../../components/game/GameCardDetailHero';
import { detailPresetForActivity, shareModeForViewer } from '../../config/gameCardLayouts';
import { shareGameInvite } from '../../services/inviteLinkService';
import { RegularGroup } from '../../types/regularGroup';
import { PlayerReviewForm } from '../../components/PlayerReviewForm';
import PlayerProfileModal, { PlayerProfilePreview } from '../../components/PlayerProfileModal';
import { getGameRecapIdForActivity } from '../../services/gameRecapService';
import { reportCourtIssue, CourtReportType } from '../../services/courtService';
import { supabase } from '../../services/api/supabase';
import {
  formatActivityTime,
  getActivityRosterMax,
  getActivityRosterMin,
  getApprovedParticipants,
  canHostScheduleNextGame,
  countReadyParticipants,
  getGameParticipantPreview,
  isGameChatReadOnly,
  isPastGameActivity,
  isTonightUrgency,
  canHostEditGameSchedule,
} from '../../utils/activityHelpers';
import { isActivityListingActive, isReviewWindowOpen, gameEndMs } from '../../utils/activityExpiry';
import { ActivityCandidateLocation, JoinRequest } from '../../types/activity';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROUTES } from '../../constants/routes';
import {
  ensureActivityGroupConversation,
} from '../../services/chatService';
import {
  getReviewsByReviewerForActivity,
  submitPlayerReview,
} from '../../services/reviewService';
import { getActivityDetailMatchingCopy } from '../../constants/sports';
import { trackProductEvent } from '../../services/analyticsService';
import { PRIMARY_COLOR, colors, radius, spacing } from '../../constants/theme';
import { KeyboardSafeView, keyboardAwareScrollProps } from '../../components/ui';
import CoachMark from '../../components/CoachMark';
import { ONBOARDING_FLAGS } from '../../constants/onboardingFlags';
import { InviteFriendsToGameSheet } from '../../components/game/InviteFriendsToGameSheet';
import { ChangeGameCourtSheet } from '../../components/game/ChangeGameCourtSheet';
import { ChangeGameTimeSheet } from '../../components/game/ChangeGameTimeSheet';
import {
  GameCardIconAction,
  GameCardIconActionBar,
} from '../../components/game/GameCardIconActionBar';
import { GameCardSection, gameCardPanelStyles } from '../../components/game/GameCardSection';
import { JoinRequestsSheet } from '../../components/game/JoinRequestsSheet';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: {
    activityId?: string;
    inviteToken?: string;
    hostInvite?: boolean;
    fromGameRoom?: boolean;
  };
  CreateActivity: undefined;
  PostGameAttendance: { activityId: string };
  ChatThread: { conversationId: string; title?: string; activityId?: string; groupId?: string };
  MiniTournament: { tournamentId: string };
  RegularsCrew: {
    groupId: string;
    initialTab?: 'chat' | 'play' | 'members';
    promptShareInvite?: boolean;
  };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ActivityDetail'>;

const ActivityDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId: routeActivityId, inviteToken, hostInvite, fromGameRoom } = route.params;
  const [resolvedActivityId, setResolvedActivityId] = useState<string | undefined>(routeActivityId);
  const activityId = resolvedActivityId || '';
  const { activity, loading, error, refetch } = useActivity(activityId);
  const { user } = useAuth();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submittingPreference, setSubmittingPreference] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [settingReady, setSettingReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [courtSheetOpen, setCourtSheetOpen] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [candidateLocations, setCandidateLocations] = useState<ActivityCandidateLocation[]>([]);
  const [preferredLocationId, setPreferredLocationId] = useState<string | null>(null);
  const [earliestStartText, setEarliestStartText] = useState('');
  const [latestStartText, setLatestStartText] = useState('');
  const [availabilityWeight, setAvailabilityWeight] = useState(3);
  const [friendliness, setFriendliness] = useState(3);
  const [physicality, setPhysicality] = useState(3);
  const [vibe, setVibe] = useState(3);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTargetUserId, setReviewTargetUserId] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedTargetIds, setReviewedTargetIds] = useState<Set<string>>(new Set());
  const [profilePlayer, setProfilePlayer] = useState<PlayerProfilePreview | null>(null);
  const [schedulingNext, setSchedulingNext] = useState(false);
  const [redeemingInvite, setRedeemingInvite] = useState(false);
  const [regularGroup, setRegularGroup] = useState<RegularGroup | null>(null);
  const [creatingRegularGroup, setCreatingRegularGroup] = useState(false);
  const [isGroupMember, setIsGroupMember] = useState(false);
  const [schedulePickerVisible, setSchedulePickerVisible] = useState(false);
  const [nextStartTime, setNextStartTime] = useState(() => new Date());
  const [costNoteDraft, setCostNoteDraft] = useState('');
  const [savingCostNote, setSavingCostNote] = useState(false);
  const [sessionNoteDraft, setSessionNoteDraft] = useState('');
  const [savingSessionNote, setSavingSessionNote] = useState(false);
  const [recapId, setRecapId] = useState<string | null>(null);
  const [groupTournaments, setGroupTournaments] = useState<MiniTournament[]>([]);
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false);
  const isHost = user && activity && user.id === activity.user_id;
  const myJoinRequest = useMemo(
    () => (activity?.join_requests || []).find((r) => r.user_id === user?.id),
    [activity?.join_requests, user?.id]
  );
  const isApprovedJoiner = myJoinRequest?.status === 'approved';
  const isFinalized = activity?.match_status === 'finalized';
  const iAmReady = Boolean(isHost || myJoinRequest?.ready_at);

  const approvedParticipants = useMemo(
    () => (activity ? getApprovedParticipants(activity) : []),
    [activity]
  );

  const { readyCount, rosterCount } = useMemo(
    () =>
      activity
        ? countReadyParticipants(activity, approvedParticipants)
        : { readyCount: 0, rosterCount: 0 },
    [activity, approvedParticipants]
  );
  const participantPreview = useMemo(
    () => (activity ? getGameParticipantPreview(activity) : { names: [], players: [], total: 0 }),
    [activity]
  );
  const pendingJoinItems = useMemo(
    () =>
      joinRequests.map((request) => ({
        key: request.id,
        username: request.user?.username?.trim() || 'Player',
        userId: request.user?.id ?? request.user_id,
        isPending: true,
      })),
    [joinRequests]
  );

  const canShowReviewForm = useMemo(
    () => Boolean(activity && isReviewWindowOpen(activity)),
    [activity]
  );

  useEffect(() => {
    if (!activity?.id || !user?.id) {
      setReviewedTargetIds(new Set());
      return;
    }
    getReviewsByReviewerForActivity(activity.id, user.id).then((rows) => {
      setReviewedTargetIds(new Set(rows.map((row) => row.reviewed_id)));
    });
  }, [activity?.id, user?.id]);

  const pendingReviewTargetIds = useMemo(() => {
    if (!activity || !user) {
      return [];
    }
    if (isHost) {
      return approvedParticipants
        .map((p) => p.user_id)
        .filter((id) => id !== user.id && !reviewedTargetIds.has(id));
    }
    if (
      activity.user_id &&
      activity.user_id !== user.id &&
      !reviewedTargetIds.has(activity.user_id)
    ) {
      return [activity.user_id];
    }
    return [];
  }, [activity, user, isHost, approvedParticipants, reviewedTargetIds]);

  useEffect(() => {
    if (!isHost || pendingReviewTargetIds.length === 0) {
      return;
    }
    if (!reviewTargetUserId || !pendingReviewTargetIds.includes(reviewTargetUserId)) {
      setReviewTargetUserId(pendingReviewTargetIds[0]);
    }
  }, [isHost, pendingReviewTargetIds, reviewTargetUserId]);

  const activeReviewTargetId = useMemo(() => {
    if (!activity || !user || pendingReviewTargetIds.length === 0) {
      return null;
    }
    if (isHost) {
      if (reviewTargetUserId && pendingReviewTargetIds.includes(reviewTargetUserId)) {
        return reviewTargetUserId;
      }
      return pendingReviewTargetIds[0];
    }
    return pendingReviewTargetIds[0];
  }, [activity, user, isHost, pendingReviewTargetIds, reviewTargetUserId]);

  const listingEndedForReview = useMemo(() => {
    if (!activity) {
      return false;
    }
    return (
      activity.status === 'completed' ||
      activity.status === 'cancelled' ||
      !isActivityListingActive(activity) ||
      Date.now() >= gameEndMs(activity)
    );
  }, [activity]);

  const showReviewForm = Boolean(
    canShowReviewForm &&
      pendingReviewTargetIds.length > 0 &&
      activeReviewTargetId &&
      user?.id !== activeReviewTargetId
  );

  const showReviewWaiting = Boolean(
    listingEndedForReview && !canShowReviewForm && pendingReviewTargetIds.length > 0
  );

  const openPlayerProfile = (
    player: { id: string; username: string; profile_photo_url?: string },
    roleLabel: string
  ) => {
    setProfilePlayer({
      id: player.id,
      username: player.username,
      profile_photo_url: player.profile_photo_url,
      roleLabel,
    });
  };

  const loadJoinRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const requests = await getActivityJoinRequests(activityId);
      setJoinRequests(requests);
    } catch (error) {
      console.error('Error loading join requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (isHost && activityId) {
      loadJoinRequests();
    }
  }, [isHost, activityId, loadJoinRequests]);

  useFocusEffect(
    useCallback(() => {
      if (isHost && activityId) {
        loadJoinRequests();
      }
    }, [isHost, activityId, loadJoinRequests])
  );

  useEffect(() => {
    if (!activityId) {
      return;
    }
    const channel = supabase
      .channel(`join-requests-sync-${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          if (isHost) {
            loadJoinRequests();
          }
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, isHost, loadJoinRequests, refetch]);

  const canGoBack = navigation.canGoBack();

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: canGoBack,
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() =>
            canGoBack ? navigation.goBack() : navigation.navigate('MainTabs' as never)
          }
          hitSlop={8}
          style={styles.headerCloseBtn}
          testID="activity-detail-close"
          accessibilityLabel={canGoBack ? 'Back' : 'Close'}
        >
          <Text style={styles.headerCloseText}>{canGoBack ? 'Back' : 'Close'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [canGoBack, navigation]);

  useEffect(() => {
    if (routeActivityId) {
      setResolvedActivityId(routeActivityId);
    }
  }, [routeActivityId]);

  const arrivedViaHostInvite = useRef(Boolean(hostInvite && inviteToken && !routeActivityId));
  const redirectedToRoom = useRef(false);
  const [resolvingInvite, setResolvingInvite] = useState(false);

  useEffect(() => {
    if (routeActivityId || !inviteToken || hostInvite) {
      return;
    }
    let cancelled = false;
    setResolvingInvite(true);
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setResolvingInvite(false);
        Alert.alert('Invite link', 'Could not open this invite. Try again.');
      }
    }, 10000);

    getActivityByInviteToken(inviteToken)
      .then((found) => {
        if (cancelled) {
          return;
        }
        if (!found?.id) {
          Alert.alert('Invite link', 'This invite is invalid or expired.');
          return;
        }
        setResolvedActivityId(found.id);
        navigation.setParams({ activityId: found.id, inviteToken: undefined });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          Alert.alert('Invite link', err.message || 'Could not open this invite.');
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setResolvingInvite(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [inviteToken, hostInvite, routeActivityId, navigation]);

  useEffect(() => {
    if (routeActivityId || !inviteToken || !hostInvite || !user?.id) {
      return;
    }
    setRedeemingInvite(true);
    joinGameViaInvite(inviteToken)
      .then((id) => {
        setResolvedActivityId(id);
        navigation.setParams({ activityId: id, inviteToken: undefined, hostInvite: undefined });
      })
      .catch((err: Error) => {
        Alert.alert('Invite link', err.message || 'Could not join from invite.');
      })
      .finally(() => setRedeemingInvite(false));
  }, [inviteToken, hostInvite, routeActivityId, user?.id, navigation]);

  // After redeeming an invite, send approved joiners straight into the Game Room
  // (the modal Details sheet is for settings/history, not day-of coordination).
  useEffect(() => {
    if (!arrivedViaHostInvite.current || redirectedToRoom.current) {
      return;
    }
    if (!activity || !user?.id || !canOpenActivityChat(activity, user.id)) {
      return;
    }
    redirectedToRoom.current = true;
    (async () => {
      try {
        const conversationId = await ensureActivityGroupConversation(activity.id);
        (navigation as any).replace(ROUTES.CHAT.THREAD, {
          conversationId,
          title: activity.location?.name || `${activity.sport_type} game`,
          activityId: activity.id,
        });
      } catch {
        redirectedToRoom.current = false;
      }
    })();
  }, [activity, user?.id, navigation]);

  useEffect(() => {
    if (!activity?.regular_group_id) {
      setRegularGroup(null);
      return;
    }
    let cancelled = false;
    getRegularGroupById(activity.regular_group_id)
      .then((group) => {
        if (!cancelled) {
          setRegularGroup(group);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRegularGroup(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activity?.regular_group_id]);

  useEffect(() => {
    const groupId = activity?.regular_group_id;
    if (!groupId || !user?.id) {
      setIsGroupMember(false);
      return;
    }
    let cancelled = false;
    isRegularGroupMember(groupId, user.id)
      .then((member) => {
        if (!cancelled) {
          setIsGroupMember(member);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsGroupMember(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activity?.regular_group_id, user?.id]);

  useEffect(() => {
    if (!regularGroup?.id) {
      setGroupTournaments([]);
      return;
    }
    let cancelled = false;
    getTournamentsForGroup(regularGroup.id)
      .then((rows) => {
        if (!cancelled) {
          setGroupTournaments(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroupTournaments([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [regularGroup?.id]);

  useEffect(() => {
    setCostNoteDraft(activity?.cost_note ?? '');
  }, [activity?.cost_note]);

  useEffect(() => {
    setSessionNoteDraft(activity?.session_note ?? '');
  }, [activity?.session_note]);

  const handleScheduleNextGame = () => {
    if (!activity || !isHost) {
      return;
    }
    const base = activity.start_time ? new Date(activity.start_time) : new Date();
    const suggested = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (suggested <= new Date()) {
      suggested.setDate(suggested.getDate() + 7);
    }
    setNextStartTime(suggested);
    setSchedulePickerVisible(true);
  };

  const confirmScheduleNextGame = async () => {
    if (!activity || !isHost) {
      return;
    }
    setSchedulingNext(true);
    try {
      const startIso = nextStartTime.toISOString();
      const rosterMax = getActivityRosterMax(activity);
      const rosterMin = getActivityRosterMin(activity);
      const newId = activity.regular_group_id
        ? await scheduleGroupNextGame(
            activity.regular_group_id,
            startIso,
            rosterMax,
            activity.duration,
            rosterMin
          )
        : await scheduleNextGameFromActivity(activity.id, startIso);
      setSchedulePickerVisible(false);
      if (activity.regular_group_id) {
        navigation.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
          groupId: activity.regular_group_id,
          initialTab: 'play',
        } as never);
      } else {
        (navigation as any).replace(ROUTES.ACTIVITY.DETAIL, { activityId: newId });
      }
    } catch (error: any) {
      Alert.alert('Schedule failed', error?.message || 'Could not schedule next game.');
    } finally {
      setSchedulingNext(false);
    }
  };

  const handleSaveCostNote = async () => {
    if (!activity || !isHost) {
      return;
    }
    const trimmed = costNoteDraft.trim() || null;
    const current = activity.cost_note?.trim() || null;
    if (trimmed === current) {
      return;
    }
    setSavingCostNote(true);
    try {
      await updateActivity(activity.id, { cost_note: trimmed });
      await refetch();
    } catch (error: any) {
      Alert.alert('Cost note', error?.message || 'Could not save.');
    } finally {
      setSavingCostNote(false);
    }
  };

  const handleSaveSessionNote = async () => {
    if (!activity || !isHost) {
      return;
    }
    const trimmed = sessionNoteDraft.trim() || null;
    const current = activity.session_note?.trim() || null;
    if (trimmed === current) {
      return;
    }
    setSavingSessionNote(true);
    try {
      await setSessionNote(activity.id, trimmed);
      await refetch();
    } catch (error: any) {
      Alert.alert('Session announcement', error?.message || 'Could not save.');
    } finally {
      setSavingSessionNote(false);
    }
  };

  const showPostGameAttendance = useMemo(() => {
    if (!activity || !isHost || activity.match_status !== 'finalized') {
      return false;
    }
    return gameEndMs(activity) <= Date.now();
  }, [activity, isHost]);

  useEffect(() => {
    if (!activity || !isPastGameActivity(activity)) {
      setRecapId(null);
      return;
    }
    void getGameRecapIdForActivity(activity.id).then(setRecapId);
  }, [activity?.id, activity?.status, activity?.start_time, activity?.duration, activity]);

  const handleShareInvite = async () => {
    if (!activity) {
      return;
    }
    try {
      const preset = detailPresetForActivity(activity);
      const shareMode = shareModeForViewer(preset, { isHost: Boolean(isHost) });
      await shareGameInvite(activity, { asHost: shareMode === 'host' });
    } catch {
      // User dismissed share sheet.
    }
  };

  const handleCreateMiniTournament = async () => {
    if (!regularGroup || (!isHost && !isGroupMember)) {
      return;
    }
    setCreatingTournament(true);
    try {
      const tournamentId = await createMiniTournament(regularGroup.id);
      navigation.navigate(ROUTES.TOURNAMENT.MINI as never, { tournamentId } as never);
    } catch (err: unknown) {
      Alert.alert(
        'Mini tournament',
        err instanceof Error ? err.message : 'Could not create tournament.'
      );
    } finally {
      setCreatingTournament(false);
    }
  };

  const handleCreateRegularGroup = () => {
    if (!activity || !isHost) {
      return;
    }
    Alert.alert(PRODUCT_COPY.saveAsRally, PRODUCT_COPY.saveAsRallyConfirmBody, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: async () => {
          setCreatingRegularGroup(true);
          try {
            const groupId = await createRegularGroupFromActivity(activity.id);
            navigation.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
              groupId,
              initialTab: 'chat',
              promptShareInvite: true,
            } as never);
          } catch (err: any) {
            Alert.alert('Could not create group', err?.message || 'Try again.');
          } finally {
            setCreatingRegularGroup(false);
          }
        },
      },
    ]);
  };

  const openMiniTournament = (tournamentId: string) => {
    navigation.navigate(ROUTES.TOURNAMENT.MINI as never, { tournamentId } as never);
  };

  const openRegularsCrew = () => {
    if (!regularGroup?.id) {
      return;
    }
    navigation.navigate(ROUTES.REGULAR_GROUP.CREW as never, {
      groupId: regularGroup.id,
    } as never);
  };

  const handleReportCourt = () => {
    if (!activity?.location_id) {
      return;
    }
    const options: { text: string; type: CourtReportType }[] = [
      { text: 'Court closed / gone', type: 'closed' },
      { text: 'Wrong sport', type: 'wrong_sport' },
      { text: 'Wrong location', type: 'wrong_location' },
      { text: 'Duplicate listing', type: 'duplicate' },
    ];
    Alert.alert(
      'Report court issue',
      activity.location?.name || 'This court',
      [
        { text: 'Cancel', style: 'cancel' },
        ...options.map((option) => ({
          text: option.text,
          onPress: async () => {
            try {
              await reportCourtIssue(activity.location_id!, option.type);
              Alert.alert(
                'Thanks',
                option.type === 'closed'
                  ? 'Report recorded. The court hides after a second closed report.'
                  : 'Report recorded — we use these to keep court data fresh.'
              );
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Could not submit report.';
              Alert.alert('Report failed', message);
            }
          },
        })),
      ]
    );
  };

  useEffect(() => {
    if (!activity?.id || activity.scheduling_mode !== 'flex') {
      setCandidateLocations([]);
      return;
    }

    getActivityCandidateLocations(activity.id)
      .then((rows) => {
        setCandidateLocations(rows);
        if (!preferredLocationId && rows.length > 0) {
          setPreferredLocationId(rows[0].location_id);
        }
      })
      .catch(() => {
        setCandidateLocations([]);
      });
  }, [activity?.id, activity?.scheduling_mode, preferredLocationId]);

  const handleApprove = async (requestId: string) => {
    try {
      await approveJoinRequest(requestId, activityId);
      await loadJoinRequests();
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectJoinRequest(requestId);
      await loadJoinRequests();
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  const handleSubmitAvailability = async () => {
    if (!user?.id || !activity) {
      return;
    }
    setSubmittingPreference(true);
    try {
      const now = new Date();
      const defaultEarly = new Date(now.getTime() + 30 * 60 * 1000);
      const defaultLate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const parsedEarly = earliestStartText ? new Date(earliestStartText) : defaultEarly;
      const parsedLate = latestStartText ? new Date(latestStartText) : defaultLate;

      await upsertParticipantPreference(activity.id, user.id, {
        earliest_start: parsedEarly.toISOString(),
        latest_start: parsedLate.toISOString(),
        preferred_duration: activity.duration,
        preferred_location_id: preferredLocationId || activity.location_id || null,
        availability_weight: availabilityWeight,
      });
      Alert.alert('Saved', 'Your availability preference was submitted.');
    } catch (error: any) {
      Alert.alert('Preference failed', error?.message || 'Could not submit preference.');
    } finally {
      setSubmittingPreference(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user?.id || !activity || !activeReviewTargetId || user.id === activeReviewTargetId) {
      return;
    }

    setSubmittingReview(true);
    try {
      await submitPlayerReview({
        activity_id: activity.id,
        reviewer_id: user.id,
        reviewed_id: activeReviewTargetId,
        friendliness_rating: friendliness,
        physicality_rating: physicality,
        overall_vibe_rating: vibe,
        comment: reviewComment.trim() || undefined,
      });
      setReviewedTargetIds((prev) => new Set([...prev, activeReviewTargetId]));
      setReviewComment('');
      setFriendliness(3);
      setPhysicality(3);
      setVibe(3);
      const remaining = pendingReviewTargetIds.filter((id) => id !== activeReviewTargetId);
      if (isHost && remaining.length > 0) {
        setReviewTargetUserId(remaining[0]);
        Alert.alert('Thanks', 'Rating saved. You can rate another player below.');
      } else {
        Alert.alert('Thanks', 'Your rating has been submitted.');
      }
    } catch (error: any) {
      Alert.alert('Rating failed', error?.message || 'Could not submit rating.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFinalizeMatch = async () => {
    if (!activity || !isHost) {
      return;
    }
    setFinalizing(true);
    try {
      await finalizeGameCommitment(activity.id);
      Alert.alert('Game finalized', 'Roster is locked. See you on court!');
      refetch();
    } catch (error: any) {
      Alert.alert('Finalize failed', error?.message || 'Could not finalize game.');
    } finally {
      setFinalizing(false);
    }
  };

  const applyReady = async (ready: boolean) => {
    if (!activity) {
      return;
    }
    setSettingReady(true);
    try {
      await setGameReady(activity.id, ready);
      await refetch();
    } catch (error: any) {
      Alert.alert('Ready failed', error?.message || 'Could not update commitment.');
    } finally {
      setSettingReady(false);
    }
  };

  const handleSetReady = () => {
    if (!activity || iAmReady) {
      return;
    }
    void applyReady(true);
  };

  const handleUndoReady = () => {
    if (!activity || !iAmReady) {
      return;
    }
    void applyReady(false);
  };

  const handleLeaveGame = () => {
    if (!activity || isHost || isFinalized) {
      return;
    }
    Alert.alert(
      PRODUCT_COPY.leaveBeforeLockTitle,
      iAmReady ? PRODUCT_COPY.leaveBeforeLockCommittedBody : PRODUCT_COPY.leaveBeforeLockBody,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveGame(activity.id);
              Alert.alert('Left game', 'You are no longer on this roster.');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Could not leave', error?.message || 'Try again.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenGroupChat = async () => {
    if (!activity) {
      return;
    }
    setOpeningChat(true);
    try {
      const conversationId = await ensureActivityGroupConversation(activity.id);
      setOpeningChat(false);
      navigation.navigate(ROUTES.CHAT.THREAD as any, {
        conversationId,
        title: activity.regular_group_id
          ? regularGroup?.name || `${activity.sport_type} crew`
          : activity.location?.name || `${activity.sport_type} game`,
        activityId: activity.id,
        groupId: activity.regular_group_id ?? undefined,
      });
      if (user?.id) {
        void trackProductEvent(
          'activity_chat_opened',
          { activity_id: activity.id, conversation_id: conversationId },
          user.id
        );
      }
    } catch (error: any) {
      setOpeningChat(false);
      Alert.alert('Chat unavailable', error?.message || 'Could not open game chat.');
    }
  };

  if (loading && !activity) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingLabel}>Loading game…</Text>
      </View>
    );
  }

  if (resolvingInvite || redeemingInvite || (loading && !activity && activityId)) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingLabel}>
          {redeemingInvite ? 'Joining game…' : resolvingInvite ? 'Opening invite…' : 'Loading game…'}
        </Text>
      </View>
    );
  }

  if (error && !activity) {
    return (
      <View style={[styles.container, styles.content]}>
        <Text style={styles.errorTitle}>Could not load game</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
        <TouchableOpacity style={styles.utilityButton} onPress={refetch}>
          <Text style={styles.utilityButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>Activity not found</Text>
      </View>
    );
  }

  const detailCopy = getActivityDetailMatchingCopy(
    activity.sport_type,
    activity.scheduling_mode
  );

  const timeLabel = formatActivityTime(activity.start_time, activity.duration);
  const showChat = canOpenActivityChat(activity, user?.id) || isGroupMember;
  const chatArchived = isGameChatReadOnly(activity);
  const wasOnGame =
    isHost || isApprovedJoiner || Boolean(myJoinRequest) || user?.id === activity.user_id;
  const isPastGame = isPastGameActivity(activity);
  const canScheduleNext =
    !isPastGame &&
    !activity.regular_group_id &&
    Boolean(isHost && canHostScheduleNextGame(activity, true));
  const showShareLink = Boolean(
    activity.invite_token &&
      ((activity.regular_group_id && isGroupMember) ||
        (!activity.regular_group_id && (isHost || isApprovedJoiner)))
  );
  const showInviteFriends = Boolean(
    (isHost || isApprovedJoiner) &&
      !isPastGame &&
      activity.status === 'active' &&
      activity.match_status !== 'finalized'
  );
  const showTonight = !isPastGame && isTonightUrgency(activity);
  const canEditSchedule =
    Boolean(isHost && activity && canHostEditGameSchedule(activity, approvedParticipants));
  const listingActive = isActivityListingActive(activity);
  const expiresLabel = activity.expires_at
    ? new Date(activity.expires_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;
  const isRallyGame = Boolean(activity.regular_group_id);
  const showHostToolsPanel = Boolean(
    !isPastGame &&
      ((showChat && !chatArchived && !fromGameRoom && !isRallyGame) ||
        canEditSchedule ||
        canScheduleNext ||
        showShareLink ||
        showInviteFriends ||
        (isHost &&
          !isRallyGame &&
          (activity.status === 'active' || activity.status === 'completed')))
  );

  const manageGameActions: GameCardIconAction[] = (() => {
    const actions: GameCardIconAction[] = [];
    if (canEditSchedule) {
      actions.push({
        id: 'time',
        label: 'Time',
        icon: 'calendar-outline',
        onPress: () => setTimeSheetOpen(true),
      });
      actions.push({
        id: 'court',
        label: 'Court',
        icon: 'location-outline',
        onPress: () => setCourtSheetOpen(true),
      });
    }
    if (showShareLink) {
      actions.push({
        id: 'link',
        label: isRallyGame ? 'Link' : 'Copy link',
        icon: 'link-outline',
        onPress: () => void handleShareInvite(),
      });
    }
    if (showInviteFriends) {
      actions.push({
        id: 'friends',
        label: 'Friends',
        icon: 'person-add-outline',
        onPress: () => setInviteFriendsOpen(true),
        primary: true,
      });
    }
    return actions;
  })();

  return (
    <KeyboardSafeView style={styles.container}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} {...keyboardAwareScrollProps}>
      <GameCardDetailHero
        activity={activity}
        timeLabel={timeLabel}
        isRallyGame={isRallyGame}
        isPastGame={isPastGame}
        isHost={Boolean(isHost)}
        isFinalized={isFinalized}
        wasOnGame={wasOnGame}
        fromGameRoom={fromGameRoom}
        canGoBack={canGoBack}
        showChat={showChat}
        showTonight={showTonight}
        listingActive={listingActive}
        regularGroup={regularGroup}
        recapId={recapId}
        rosterItems={participantPreview.players}
        rosterTotal={participantPreview.total}
        pendingItems={pendingJoinItems}
        pendingCount={joinRequests.length}
        readyCount={readyCount}
        rosterCount={rosterCount}
        statusSchedulingDescriptor={detailCopy.statusSchedulingDescriptor}
        statusDetailLine={detailCopy.statusDetailLine}
        collectingDeadlineLabel={detailCopy.collectingDeadlineLabel}
        preferenceDeadline={activity.preference_deadline}
        expiresLabel={expiresLabel}
        showPostGameAttendance={showPostGameAttendance}
        sessionNoteDraft={sessionNoteDraft}
        costNoteDraft={costNoteDraft}
        savingSessionNote={savingSessionNote}
        savingCostNote={savingCostNote}
        onOpenRegularGroup={openRegularsCrew}
        onReportCourt={handleReportCourt}
        onPendingPress={
          isHost && joinRequests.length > 0 ? () => setJoinRequestsOpen(true) : undefined
        }
        onPlayerPress={(player) => {
          if (!player.userId) {
            return;
          }
          openPlayerProfile(
            { id: player.userId, username: player.username },
            player.isHost ? 'Host' : player.isPending ? 'Requested to join' : 'Player'
          );
        }}
        onSessionNoteChange={setSessionNoteDraft}
        onSessionNoteBlur={() => void handleSaveSessionNote()}
        onCostNoteChange={setCostNoteDraft}
        onCostNoteBlur={() => void handleSaveCostNote()}
      />

      {showHostToolsPanel ? (
        <View style={gameCardPanelStyles.panel}>
          <Text style={gameCardPanelStyles.panelTitle}>
            {isHost ? 'Manage game' : 'Invite players'}
          </Text>

          {chatArchived && wasOnGame && !isRallyGame ? (
            <>
              <Text style={styles.gameRoomHint}>{PRODUCT_COPY.archivedRoomHint}</Text>
              <TouchableOpacity
                style={[styles.gameRoomButton, openingChat && styles.utilityButtonDisabled]}
                onPress={handleOpenGroupChat}
                disabled={openingChat}
              >
                <Text style={styles.utilityButtonText}>
                  {openingChat ? 'Opening…' : PRODUCT_COPY.viewArchivedChat}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {showChat && !chatArchived && !fromGameRoom && !isRallyGame ? (
            <TouchableOpacity
              style={[styles.gameRoomButton, openingChat && styles.utilityButtonDisabled]}
              onPress={handleOpenGroupChat}
              disabled={openingChat}
            >
              <Text style={styles.utilityButtonText}>
                {openingChat ? 'Opening…' : 'Open Game Room'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {manageGameActions.length > 0 ? (
            <>
              {canEditSchedule ? (
                <Text style={styles.manageHint}>{PRODUCT_COPY.editGameScheduleHint}</Text>
              ) : null}
              <GameCardIconActionBar actions={manageGameActions} />
            </>
          ) : null}

          {canScheduleNext ? (
            <>
              <View style={gameCardPanelStyles.divider} />
              <GameCardSection title="Schedule next game">
                <TouchableOpacity
                  style={[styles.secondaryButton, schedulingNext && styles.utilityButtonDisabled]}
                  onPress={handleScheduleNextGame}
                  disabled={schedulingNext}
                >
                  <Text style={styles.secondaryButtonText}>
                    {schedulingNext ? 'Scheduling…' : 'Pick next time'}
                  </Text>
                </TouchableOpacity>
                {schedulePickerVisible ? (
                  <View style={styles.schedulePickerBlock}>
                    <ScheduleDateTimePicker
                      visible={schedulePickerVisible}
                      value={nextStartTime}
                      onChange={setNextStartTime}
                    />
                    <View style={styles.schedulePickerRow}>
                      <TouchableOpacity onPress={() => setSchedulePickerVisible(false)}>
                        <Text style={styles.linkAction}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void confirmScheduleNextGame()}
                        disabled={schedulingNext}
                      >
                        <Text style={styles.linkActionPrimary}>
                          {schedulingNext ? 'Scheduling…' : 'Confirm time'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </GameCardSection>
            </>
          ) : null}

          {isHost &&
          !isRallyGame &&
          (activity.status === 'active' || activity.status === 'completed') ? (
            <TouchableOpacity
              style={styles.inlineActionLink}
              onPress={handleCreateRegularGroup}
              disabled={creatingRegularGroup}
              activeOpacity={0.85}
            >
              <Text style={styles.inlineLinkText}>
                <Text style={styles.inlineLinkMuted}>{PRODUCT_COPY.saveAsRallyHint} </Text>
                <Text style={styles.inlineLinkAction}>
                  {creatingRegularGroup ? 'Saving…' : `${PRODUCT_COPY.saveAsRallyAction} →`}
                </Text>
              </Text>
            </TouchableOpacity>
          ) : null}

          {regularGroup &&
          !isPastGame &&
          sportSupportsMiniTournament(regularGroup.sport_type) &&
          (isHost || isGroupMember) ? (
            <>
              <View style={gameCardPanelStyles.divider} />
              <GameCardSection
                title="Mini tournaments"
                hint="Private doubles round-robin for your Rally. Start when 4+ players join (even count)."
              >
                <TouchableOpacity
                  style={[styles.secondaryButton, creatingTournament && styles.utilityButtonDisabled]}
                  onPress={() => void handleCreateMiniTournament()}
                  disabled={creatingTournament}
                >
                  <Text style={styles.secondaryButtonText}>
                    {creatingTournament ? 'Creating…' : 'Start new mini tournament'}
                  </Text>
                </TouchableOpacity>
                {groupTournaments.map((tournament) => (
                  <TouchableOpacity
                    key={tournament.id}
                    style={styles.tournamentRow}
                    onPress={() => openMiniTournament(tournament.id)}
                  >
                    <Text style={styles.tournamentRowTitle}>{tournament.name}</Text>
                    <Text style={styles.tournamentRowMeta}>{tournament.status}</Text>
                  </TouchableOpacity>
                ))}
              </GameCardSection>
            </>
          ) : null}
        </View>
      ) : null}

      <CoachMark
        flag={ONBOARDING_FLAGS.COACH_REGULARS_SHOWN}
        active={Boolean(isHost && !isPastGame && activity.series_id && !activity.regular_group_id)}
        title="Make it official"
        body="Save these players as a Rally and share one link to invite everyone."
        actionLabel={PRODUCT_COPY.saveAsRallyAction}
        onAction={handleCreateRegularGroup}
      />

      {showReviewForm ? (
        <PlayerReviewForm
          subtitle={
            isHost
              ? `How did your players show up at ${activity.location?.name || 'this game'}?`
              : `How was the host for this match?`
          }
          players={
            isHost
              ? approvedParticipants
                  .filter((participant) =>
                    pendingReviewTargetIds.includes(participant.user_id)
                  )
                  .map((participant) => ({
                    userId: participant.user_id,
                    username: participant.user?.username || 'Player',
                  }))
              : activity.user
                ? [{ userId: activity.user.id, username: activity.user.username }]
                : []
          }
          selectedPlayerId={activeReviewTargetId}
          onSelectPlayer={isHost ? setReviewTargetUserId : undefined}
          friendliness={friendliness}
          physicality={physicality}
          vibe={vibe}
          onChangeFriendliness={setFriendliness}
          onChangePhysicality={setPhysicality}
          onChangeVibe={setVibe}
          comment={reviewComment}
          onChangeComment={setReviewComment}
          submitting={submittingReview}
          onSubmit={() => void handleSubmitReview()}
        />
      ) : null}

      {showReviewWaiting ? (
        <View style={styles.reviewPanel}>
          <Text style={styles.sectionTitle}>Rate Players</Text>
          <Text style={styles.reviewMeta}>
            Ratings open about 2 hours after the scheduled game ends.
          </Text>
        </View>
      ) : null}

      {!isHost && !isApprovedJoiner && (
        <View style={styles.ctaBlock}>
          <JoinRequestButton activity={activity} onRequestSent={refetch} />
        </View>
      )}

      {!isHost && isApprovedJoiner && !isFinalized && activity.regular_group_id ? (
        <Text style={styles.gameRoomHint}>
          Chat lives on the Rally Chat tab. Tap I'm in on Play when you can make it.
        </Text>
      ) : null}

      {!isHost && isApprovedJoiner && !isFinalized && !activity.regular_group_id && showChat ? (
        <Text style={styles.gameRoomHint}>
          Open Game Room to tap I'm in, chat with players, or leave this game.
        </Text>
      ) : null}

      {!isHost && isApprovedJoiner && !isFinalized && !showChat ? (
        <View style={styles.ctaRow}>
          {iAmReady ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                styles.ctaRowButton,
                settingReady && styles.utilityButtonDisabled,
              ]}
              onPress={handleUndoReady}
              disabled={settingReady}
            >
              <Text style={styles.secondaryButtonText}>
                {settingReady ? 'Saving...' : PRODUCT_COPY.undoImIn}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                styles.ctaRowButton,
                settingReady && styles.utilityButtonDisabled,
              ]}
              onPress={handleSetReady}
              disabled={settingReady}
            >
              <Text style={styles.secondaryButtonText}>
                {settingReady ? 'Saving...' : PRODUCT_COPY.imIn}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.leaveButton, styles.ctaRowButton, leaving && styles.utilityButtonDisabled]}
            onPress={handleLeaveGame}
            disabled={leaving}
          >
            <Text style={styles.leaveButtonText}>{leaving ? 'Leaving...' : 'Leave game'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isApprovedJoiner && !isHost && isFinalized && (
        <Text style={styles.inGameText}>{PRODUCT_COPY.afterLockCantLeave}</Text>
      )}

      {!isHost && activity.scheduling_mode === 'flex' && (
        <View style={styles.preferenceCard}>
          <Text style={styles.preferenceTitle}>{detailCopy.preferenceCardTitle}</Text>
          {!!detailCopy.preferenceCardSubtitle && (
            <Text style={styles.preferenceSubtitle}>{detailCopy.preferenceCardSubtitle}</Text>
          )}
          <TextInput
            style={styles.input}
            value={earliestStartText}
            onChangeText={setEarliestStartText}
            placeholder="Earliest start (ISO, optional)"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={latestStartText}
            onChangeText={setLatestStartText}
            placeholder="Latest start (ISO, optional)"
            autoCapitalize="none"
          />
          {candidateLocations.length > 0 && (
            <View style={styles.inlineRow}>
              {candidateLocations.slice(0, 3).map((candidate) => {
                const selected = preferredLocationId === candidate.location_id;
                return (
                  <TouchableOpacity
                    key={candidate.id}
                    style={[styles.inlineChip, selected && styles.inlineChipSelected]}
                    onPress={() => setPreferredLocationId(candidate.location_id)}
                  >
                    <Text style={[styles.inlineChipText, selected && styles.inlineChipTextSelected]}>
                      {candidate.location?.name || 'Option'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.inlineRow}>
            {[1, 2, 3, 4, 5].map((weight) => (
              <TouchableOpacity
                key={weight}
                style={[styles.inlineChip, availabilityWeight === weight && styles.inlineChipSelected]}
                onPress={() => setAvailabilityWeight(weight)}
              >
                <Text
                  style={[
                    styles.inlineChipText,
                    availabilityWeight === weight && styles.inlineChipTextSelected,
                  ]}
                >
                  Weight {weight}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.utilityButton, submittingPreference && styles.utilityButtonDisabled]}
            onPress={handleSubmitAvailability}
            disabled={submittingPreference}
          >
            <Text style={styles.utilityButtonText}>
              {submittingPreference ? 'Submitting...' : detailCopy.submitPreferenceButtonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isHost && !isFinalized && showChat ? (
        <Text style={styles.gameRoomHint}>
          Approve join requests and finalize the roster in Game Room.
        </Text>
      ) : null}

      {isHost && !isFinalized && !showChat ? (
        <TouchableOpacity
          style={[styles.utilityButton, finalizing && styles.utilityButtonDisabled]}
          onPress={handleFinalizeMatch}
          disabled={finalizing}
          testID="activity-detail-lock-roster"
          accessibilityLabel="Lock roster"
        >
          <Text style={styles.utilityButtonText}>
            {finalizing ? 'Locking...' : 'Lock roster'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isFinalized && (
        <Text style={styles.finalizedBanner} testID="activity-detail-roster-locked">
          Roster locked — game is finalized
        </Text>
      )}

      {showPostGameAttendance ? (
        <TouchableOpacity
          style={styles.utilityButton}
          onPress={() =>
            navigation.navigate(ROUTES.ACTIVITY.POST_GAME_ATTENDANCE as never, {
              activityId: activity!.id,
            } as never)
          }
        >
          <Text style={styles.utilityButtonText}>Record who showed up</Text>
        </TouchableOpacity>
      ) : null}

      <PlayerProfileModal
        visible={!!profilePlayer}
        player={profilePlayer}
        onClose={() => setProfilePlayer(null)}
        currentUserId={user?.id}
        contextType="activity"
        contextId={activityId}
        showNoShow={Boolean(isHost && canShowReviewForm)}
      />

      {activity ? (
        <>
          <InviteFriendsToGameSheet
            visible={inviteFriendsOpen}
            activity={activity}
            isRallyGame={Boolean(regularGroup)}
            onClose={() => setInviteFriendsOpen(false)}
          />
          <ChangeGameTimeSheet
            visible={timeSheetOpen}
            activity={activity}
            onClose={() => setTimeSheetOpen(false)}
            onUpdated={() => void refetch()}
          />
          <ChangeGameCourtSheet
            visible={courtSheetOpen}
            activity={activity}
            onClose={() => setCourtSheetOpen(false)}
            onUpdated={() => void refetch()}
          />
        </>
      ) : null}

      <JoinRequestsSheet
        visible={joinRequestsOpen}
        requests={joinRequests}
        loading={loadingRequests}
        gameLabel={
          activity
            ? `${activity.sport_type} · ${activity.location?.name || 'Court TBD'} · ${timeLabel}`
            : undefined
        }
        onClose={() => setJoinRequestsOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenProfile={(player) => {
          setJoinRequestsOpen(false);
          openPlayerProfile(player, 'Requested to join');
        }}
      />
    </ScrollView>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerCloseBtn: {
    marginLeft: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerCloseText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingLabel: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  gameRoomHint: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  manageHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  errorBody: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  ctaBlock: {
    marginBottom: 12,
  },
  statusDetailLine: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    lineHeight: 17,
  },
  deadlineText: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 12,
  },
  expiresText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  urgentText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#b42318',
  },
  tournamentRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tournamentRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  tournamentRowMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  costNoteText: {
    marginTop: 8,
    fontSize: 14,
    color: '#3d3418',
    backgroundColor: '#fff8e6',
    padding: 10,
    borderRadius: 8,
  },
  costNoteBlock: {
    marginTop: 10,
  },
  recapWrap: {
    marginTop: spacing.sm,
  },
  pastNotesBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  pastGameHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  costNoteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  costNoteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  costNoteHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    lineHeight: 18,
  },
  schedulePickerBlock: {
    marginTop: 8,
    marginBottom: 8,
  },
  schedulePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  linkAction: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  linkActionPrimary: {
    fontSize: 15,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  gameRoomButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: 0,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: 0,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  inlineActionLink: {
    marginTop: 0,
    paddingVertical: spacing.xs,
  },
  inlineLinkText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inlineLinkMuted: {
    color: colors.textSecondary,
  },
  inlineLinkAction: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  ctaRowButton: {
    flex: 1,
    marginTop: 0,
    marginHorizontal: 4,
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  finalizedBanner: {
    marginTop: 10,
    fontSize: 13,
    color: '#1a6535',
    fontWeight: '600',
    textAlign: 'center',
  },
  inGameText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1a6535',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 14,
  },
  utilityButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  utilityButtonDisabled: {
    opacity: 0.6,
  },
  utilityButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  preferenceCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  inlineChip: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  inlineChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  inlineChipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  inlineChipTextSelected: {
    color: '#fff',
  },
  reviewPanel: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reviewMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default ActivityDetailScreen;

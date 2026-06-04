import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScheduleDateTimePicker } from '../../components/ScheduleDateTimePicker';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { ensureCrewConversation } from '../../services/chatService';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  extendActivitySchedule,
  scheduleNextGameFromActivity,
  scheduleGroupNextGame,
  makeActivityRecurring,
  joinGameViaInvite,
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
import { buildGameInviteUrl, buildRegularGroupInviteUrl } from '../../navigation/deepLinking';
import { RegularGroup } from '../../types/regularGroup';
import { PlayerReviewForm } from '../../components/PlayerReviewForm';
import PlayerProfileModal, { PlayerProfilePreview } from '../../components/PlayerProfileModal';
import { PlayerTrustLine } from '../../components/PlayerTrustLine';
import { reportCourtIssue, CourtReportType } from '../../services/courtService';
import { supabase } from '../../services/api/supabase';
import {
  formatActivityTime,
  getApprovedParticipants,
  canHostScheduleNextGame,
  countReadyParticipants,
  getParticipantReadyState,
  isGameChatReadOnly,
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
import { activityListingHeadline, playIntentLabel } from '../../constants/playIntent';
import { getActivityDetailMatchingCopy } from '../../constants/sports';
import { trackProductEvent } from '../../services/analyticsService';
import { PRIMARY_COLOR, colors, radius, spacing } from '../../constants/theme';
import { Avatar } from '../../components/ui';
import CoachMark from '../../components/CoachMark';
import { ONBOARDING_FLAGS } from '../../constants/onboardingFlags';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId?: string; inviteToken?: string; fromGameRoom?: boolean };
  CreateActivity: undefined;
  PostGameAttendance: { activityId: string };
  ChatThread: { conversationId: string; title?: string; activityId?: string; groupId?: string };
  MiniTournament: { tournamentId: string };
  RegularsCrew: { groupId: string };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ActivityDetail'>;

const ActivityDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId: routeActivityId, inviteToken, fromGameRoom } = route.params;
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
  const [extendPickerVisible, setExtendPickerVisible] = useState(false);
  const [extendStartTime, setExtendStartTime] = useState(() => new Date());
  const [extending, setExtending] = useState(false);
  const [schedulingNext, setSchedulingNext] = useState(false);
  const [makingRecurring, setMakingRecurring] = useState(false);
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
  const [groupTournaments, setGroupTournaments] = useState<MiniTournament[]>([]);
  const [creatingTournament, setCreatingTournament] = useState(false);
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

  useEffect(() => {
    if (activity?.start_time) {
      setExtendStartTime(new Date(activity.start_time));
    }
  }, [activity?.start_time]);

  useEffect(() => {
    if (routeActivityId) {
      setResolvedActivityId(routeActivityId);
    }
  }, [routeActivityId]);

  const arrivedViaInvite = useRef(Boolean(inviteToken && !routeActivityId));
  const redirectedToRoom = useRef(false);

  useEffect(() => {
    if (routeActivityId || !inviteToken || !user?.id) {
      return;
    }
    setRedeemingInvite(true);
    joinGameViaInvite(inviteToken)
      .then((id) => {
        setResolvedActivityId(id);
        navigation.setParams({ activityId: id, inviteToken: undefined });
      })
      .catch((err: Error) => {
        Alert.alert('Invite link', err.message || 'Could not join from invite.');
      })
      .finally(() => setRedeemingInvite(false));
  }, [inviteToken, routeActivityId, user?.id, navigation]);

  // After redeeming an invite, send approved joiners straight into the Game Room
  // (the modal Details sheet is for settings/history, not day-of coordination).
  useEffect(() => {
    if (!arrivedViaInvite.current || redirectedToRoom.current) {
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

  const handleExtendGame = async (date: Date) => {
    if (!activity) {
      return;
    }
    setExtending(true);
    try {
      await extendActivitySchedule(activity.id, date);
      await refetch();
      Alert.alert('Extended', 'Start time and listing expiry were updated.');
    } catch (error: any) {
      Alert.alert('Could not extend', error?.message || 'Try again.');
    } finally {
      setExtending(false);
      setExtendPickerVisible(false);
    }
  };

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
      const capacity =
        Math.max(2, (activity.player_count ?? 1) + (activity.missing_players ?? 0)) || 8;
      const newId = activity.regular_group_id
        ? await scheduleGroupNextGame(
            activity.regular_group_id,
            startIso,
            capacity,
            activity.duration
          )
        : await scheduleNextGameFromActivity(activity.id, startIso);
      setSchedulePickerVisible(false);
      if (activity.regular_group_id) {
        const conversationId = await ensureCrewConversation(activity.regular_group_id);
        navigation.navigate(ROUTES.CHAT.THREAD as never, {
          conversationId,
          activityId: newId,
          groupId: activity.regular_group_id,
          title: regularGroup?.name
            ? PRODUCT_COPY.rallyChatTitle(regularGroup.name)
            : PRODUCT_COPY.rallyChat,
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
    setSavingCostNote(true);
    try {
      await updateActivity(activity.id, { cost_note: costNoteDraft.trim() || null });
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
    setSavingSessionNote(true);
    try {
      await setSessionNote(activity.id, sessionNoteDraft.trim() || null);
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

  const handleShareInvite = async () => {
    if (!activity?.invite_token) {
      return;
    }
    try {
      await Share.share({
        message: `Join my ${activity.sport_type} game on Rally: ${buildGameInviteUrl(activity.invite_token)}`,
      });
    } catch {
      // User dismissed share sheet.
    }
  };

  const handleCreateRegularGroup = () => {
    if (!activity || !isHost) {
      return;
    }
    Alert.alert(
      PRODUCT_COPY.saveAsRally,
      'Creates a named crew from this roster. Share the group link so friends join future games together.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            setCreatingRegularGroup(true);
            try {
              const groupId = await createRegularGroupFromActivity(activity.id);
              const group = await getRegularGroupById(groupId);
              setRegularGroup(group);
              await refetch();
              Alert.alert(
                PRODUCT_COPY.rallySaved,
                group?.name ? `"${group.name}" is ready. Share the group invite link next.` : 'Group is ready.'
              );
            } catch (err: any) {
              Alert.alert('Could not create group', err?.message || 'Try again.');
            } finally {
              setCreatingRegularGroup(false);
            }
          },
        },
      ]
    );
  };

  const handleShareGroupInvite = async () => {
    if (!regularGroup?.invite_token) {
      return;
    }
    try {
      await Share.share({
        message: `Join our ${regularGroup.sport_type} crew "${regularGroup.name}" and our next game on Rally — one tap to get in: ${buildRegularGroupInviteUrl(regularGroup.invite_token)}`,
      });
    } catch {
      // User dismissed share sheet.
    }
  };

  const handleCreateMiniTournament = async () => {
    if (!regularGroup || !isHost) {
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

  const handleMakeRecurring = () => {
    if (!activity || !isHost) {
      return;
    }
    Alert.alert(
      'Make weekly recurring?',
      'Future “Schedule next game” spins up invite-only games with this roster every week.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            setMakingRecurring(true);
            try {
              await makeActivityRecurring(activity.id);
              await refetch();
              Alert.alert('Recurring enabled', 'Use Schedule next game to spawn the next week.');
            } catch (err: any) {
              Alert.alert('Could not enable recurring', err?.message || 'Try again.');
            } finally {
              setMakingRecurring(false);
            }
          },
        },
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

  if (redeemingInvite || (loading && !activity && activityId)) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.heroMeta}>{redeemingInvite ? 'Opening invite…' : 'Loading game…'}</Text>
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
  const slotsLabel = (() => {
    const count = activity.player_count || 1;
    const openSpots = activity.missing_players ?? 0;
    if (openSpots > 0) {
      return `${count} player${count === 1 ? '' : 's'} · ${openSpots} spot${openSpots === 1 ? '' : 's'} open`;
    }
    return `${count} player${count === 1 ? '' : 's'}`;
  })();
  const showChat = canOpenActivityChat(activity, user?.id) || isGroupMember;
  const chatArchived = isGameChatReadOnly(activity);
  const wasOnGame =
    isHost || isApprovedJoiner || Boolean(myJoinRequest) || user?.id === activity.user_id;
  const canScheduleNext = Boolean(isHost && canHostScheduleNextGame(activity, true));
  const listingActive = isActivityListingActive(activity);
  const expiresLabel = activity.expires_at
    ? new Date(activity.expires_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroSport}>{activity.sport_type}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{activity.match_status || 'open'}</Text>
          </View>
        </View>
        {!activity.regular_group_id ? (
          <>
            <Text style={styles.heroListingTitle}>
              {activityListingHeadline(activity)}
            </Text>
            {playIntentLabel(activity.play_intent) ? (
              <Text style={styles.heroIntent}>{playIntentLabel(activity.play_intent)}</Text>
            ) : null}
          </>
        ) : null}
        <Text style={styles.heroTime}>{timeLabel}</Text>
        <Text style={styles.heroLocation}>{activity.location?.name || 'Court TBD'}</Text>
        {activity.location_id && (isHost || isApprovedJoiner) ? (
          <TouchableOpacity onPress={handleReportCourt}>
            <Text style={styles.courtReportLink}>Report court issue</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.heroMeta}>
          {slotsLabel} · {detailCopy.statusSchedulingDescriptor}
        </Text>
        {!!detailCopy.statusDetailLine && activity.scheduling_mode === 'flex' && (
          <Text style={styles.statusDetailLine}>{detailCopy.statusDetailLine}</Text>
        )}
        {!!activity.preference_deadline && activity.match_status === 'collecting' && (
          <Text style={styles.deadlineText}>
            {detailCopy.collectingDeadlineLabel}:{' '}
            {new Date(activity.preference_deadline).toLocaleString()}
          </Text>
        )}
        <Text style={styles.gameKindBadge}>
          {activity.regular_group_id ? PRODUCT_COPY.rallyGame : PRODUCT_COPY.publicGameShort}
        </Text>
        {activity.visibility === 'invite_only' ? (
          <Text style={styles.inviteOnlyText}>Invite-only · hidden from Discover</Text>
        ) : null}
        {activity.urgency_level === 'tonight' ? (
          <Text style={styles.urgentText}>Need players tonight</Text>
        ) : null}
        {activity.series_id ? (
          <Text style={styles.recurringText}>Part of a weekly recurring series</Text>
        ) : null}
        {regularGroup ? (
          <TouchableOpacity onPress={openRegularsCrew}>
            <Text style={styles.regularGroupText}>{PRODUCT_COPY.rallyLabel(regularGroup.name)} →</Text>
          </TouchableOpacity>
        ) : null}
        {!isHost && activity.cost_note ? (
          <Text style={styles.costNoteText}>Cost: {activity.cost_note}</Text>
        ) : null}
        {!isHost && activity.session_note ? (
          <Text style={styles.costNoteText}>Session: {activity.session_note}</Text>
        ) : null}
        {isHost ? (
          <View style={styles.costNoteBlock}>
            <Text style={styles.costNoteLabel}>Session announcement (optional)</Text>
            <TextInput
              style={styles.costNoteInput}
              value={sessionNoteDraft}
              onChangeText={setSessionNoteDraft}
              placeholder="e.g. Court 3 · bring cash for lights"
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.secondaryButton, savingSessionNote && styles.utilityButtonDisabled]}
              onPress={() => void handleSaveSessionNote()}
              disabled={savingSessionNote}
            >
              <Text style={styles.secondaryButtonText}>
                {savingSessionNote ? 'Saving…' : 'Save session announcement'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {isHost ? (
          <View style={styles.costNoteBlock}>
            <Text style={styles.costNoteLabel}>Cost note (optional)</Text>
            <TextInput
              style={styles.costNoteInput}
              value={costNoteDraft}
              onChangeText={setCostNoteDraft}
              placeholder="e.g. ~$8/person court · BYO drinks"
              maxLength={120}
            />
            <TouchableOpacity
              style={[styles.secondaryButton, savingCostNote && styles.utilityButtonDisabled]}
              onPress={() => void handleSaveCostNote()}
              disabled={savingCostNote}
            >
              <Text style={styles.secondaryButtonText}>
                {savingCostNote ? 'Saving…' : 'Save cost note'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.costNoteHint}>
              Shown in Details and Game Room. Pin a chat announcement from the Game Room.
            </Text>
          </View>
        ) : null}
        {expiresLabel ? (
          <Text style={styles.expiresText}>
            {listingActive ? 'Listing open until' : 'Listing ended'}: {expiresLabel}
          </Text>
        ) : null}
        {chatArchived && wasOnGame && !activity.regular_group_id ? (
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
        {showChat && !chatArchived && !fromGameRoom ? (
          <TouchableOpacity
            style={[styles.gameRoomButton, openingChat && styles.utilityButtonDisabled]}
            onPress={handleOpenGroupChat}
            disabled={openingChat}
          >
            <Text style={styles.utilityButtonText}>
              {openingChat
                ? 'Opening…'
                : activity.regular_group_id
                  ? PRODUCT_COPY.openRallyChat
                  : 'Open Game Room'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {showChat && fromGameRoom ? (
          <Text style={styles.gameRoomHint}>Swipe down or tap back to return to the game room.</Text>
        ) : null}
        {canScheduleNext ? (
          <>
            <TouchableOpacity
              style={[styles.secondaryButton, schedulingNext && styles.utilityButtonDisabled]}
              onPress={handleScheduleNextGame}
              disabled={schedulingNext}
            >
              <Text style={styles.secondaryButtonText}>
                {schedulingNext
                  ? 'Scheduling…'
                  : activity.regular_group_id
                    ? 'Post next game for crew'
                    : 'Schedule next game'}
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
          </>
        ) : null}
        {isHost && !activity.series_id && activity.status === 'active' ? (
          <TouchableOpacity
            style={[styles.secondaryButton, makingRecurring && styles.utilityButtonDisabled]}
            onPress={handleMakeRecurring}
            disabled={makingRecurring}
          >
            <Text style={styles.secondaryButtonText}>
              {makingRecurring ? 'Saving…' : 'Make weekly recurring'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {isHost &&
        !activity.regular_group_id &&
        (activity.status === 'active' || activity.status === 'completed') ? (
          <TouchableOpacity
            style={[styles.secondaryButton, creatingRegularGroup && styles.utilityButtonDisabled]}
            onPress={handleCreateRegularGroup}
            disabled={creatingRegularGroup}
          >
            <Text style={styles.secondaryButtonText}>
              {creatingRegularGroup ? 'Saving…' : PRODUCT_COPY.saveAsRallyAction}
            </Text>
          </TouchableOpacity>
        ) : null}
        {regularGroup?.invite_token && (isHost || isApprovedJoiner) ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleShareGroupInvite()}>
            <Text style={styles.secondaryButtonText}>Share crew + next game link</Text>
          </TouchableOpacity>
        ) : null}
        {regularGroup && (isHost || isGroupMember) ? (
          <View style={styles.tournamentBlock}>
            <Text style={styles.tournamentTitle}>Mini tournaments</Text>
            <Text style={styles.tournamentHint}>
              Private doubles round-robin for your crew. Host starts when 4+ players join (even
              count).
            </Text>
            {isHost ? (
              <TouchableOpacity
                style={[styles.secondaryButton, creatingTournament && styles.utilityButtonDisabled]}
                onPress={() => void handleCreateMiniTournament()}
                disabled={creatingTournament}
              >
                <Text style={styles.secondaryButtonText}>
                  {creatingTournament ? 'Creating…' : 'Start new mini tournament'}
                </Text>
              </TouchableOpacity>
            ) : null}
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
          </View>
        ) : null}
        {activity.invite_token && (isHost || isApprovedJoiner) ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleShareInvite()}>
            <Text style={styles.secondaryButtonText}>
              {regularGroup ? 'Invite to just this game' : 'Share invite link'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {isHost && activity.status === 'active' && (
          <>
            <TouchableOpacity
              style={[styles.secondaryButton, extending && styles.utilityButtonDisabled]}
              onPress={() => setExtendPickerVisible(true)}
              disabled={extending}
            >
              <Text style={styles.secondaryButtonText}>
                {extending ? 'Updating…' : 'Extend start time'}
              </Text>
            </TouchableOpacity>
            {extendPickerVisible && (
              <DateTimePicker
                value={extendStartTime}
                mode="datetime"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    setExtendPickerVisible(false);
                  }
                  if (event.type === 'dismissed') {
                    setExtendPickerVisible(false);
                    return;
                  }
                  if (date) {
                    setExtendStartTime(date);
                    if (Platform.OS === 'android') {
                      handleExtendGame(date);
                    }
                  }
                }}
              />
            )}
            {Platform.OS === 'ios' && extendPickerVisible && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleExtendGame(extendStartTime)}
                disabled={extending}
              >
                <Text style={styles.secondaryButtonText}>Save new time</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <CoachMark
        flag={ONBOARDING_FLAGS.COACH_RECURRING_SHOWN}
        active={Boolean(
          isHost &&
            !activity.series_id &&
            activity.start_time &&
            new Date(activity.start_time).getTime() < Date.now()
        )}
        title="Played a good game?"
        body="Turn this into a weekly recurring game so your crew keeps the same slot."
        actionLabel="Make weekly recurring"
        onAction={handleMakeRecurring}
      />

      <CoachMark
        flag={ONBOARDING_FLAGS.COACH_REGULARS_SHOWN}
        active={Boolean(isHost && activity.series_id && !activity.regular_group_id)}
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

      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>Players</Text>
        {!isFinalized ? (
          <Text style={styles.readySummary}>
            {readyCount} of {rosterCount} marked ready
            {readyCount < rosterCount ? ' · amber dot = still waiting' : ''}
          </Text>
        ) : null}
        {activity.user && (
          <TouchableOpacity
            style={styles.participantRow}
            onPress={() => openPlayerProfile(activity.user!, 'Host')}
          >
            <Avatar
              name={activity.user.username}
              size="md"
              readyState={getParticipantReadyState({ isHost: true, isFinalized })}
            />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{activity.user.username}</Text>
              <Text style={styles.participantRole}>Host · Ready</Text>
            </View>
          </TouchableOpacity>
        )}
        {approvedParticipants.map((req) =>
          req.user ? (
            <TouchableOpacity
              key={req.id}
              style={styles.participantRow}
              onPress={() => openPlayerProfile(req.user!, 'Player')}
            >
              <Avatar
                name={req.user.username}
                size="md"
                readyState={getParticipantReadyState({
                  readyAt: req.ready_at,
                  isFinalized,
                  isApproved: true,
                })}
              />
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{req.user.username}</Text>
                <Text style={styles.participantRole}>
                  {req.ready_at ? "In ✓" : isFinalized ? 'Joined' : 'Tap I\'m in'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        )}
      </View>

      {!isHost && !isApprovedJoiner && (
        <View style={styles.ctaBlock}>
          <JoinRequestButton activity={activity} onRequestSent={refetch} />
        </View>
      )}

      {!isHost && isApprovedJoiner && !isFinalized && showChat ? (
        <Text style={styles.gameRoomHint}>
          Open Rally chat to tap I'm in, chat with your Rally, or leave this game.
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
        >
          <Text style={styles.utilityButtonText}>
            {finalizing ? 'Locking...' : 'Lock roster'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isFinalized && (
        <Text style={styles.finalizedBanner}>Roster locked — game is finalized</Text>
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

      {isHost && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Join Requests</Text>
          {loadingRequests ? (
            <ActivityIndicator color={PRIMARY_COLOR} />
          ) : joinRequests.length === 0 ? (
            <Text style={styles.emptyText}>
              No pending requests. New requests appear in real time while Game Room is open.
            </Text>
          ) : showChat ? (
            <Text style={styles.emptyText}>
              {joinRequests.length} pending request{joinRequests.length === 1 ? '' : 's'} — open
              Game Room to approve or reject.
            </Text>
          ) : (
            joinRequests.map((item) => (
              <View key={item.id} style={styles.requestItem}>
                <TouchableOpacity
                  style={styles.requestUserTap}
                  disabled={!item.user}
                  onPress={() => item.user && openPlayerProfile(item.user, 'Requested to join')}
                >
                  <Text style={styles.requestUser}>
                    {item.user?.username || 'Unknown user'}
                  </Text>
                  {item.user ? <PlayerTrustLine userId={item.user.id} /> : null}
                </TouchableOpacity>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <PlayerProfileModal
        visible={!!profilePlayer}
        player={profilePlayer}
        onClose={() => setProfilePlayer(null)}
        currentUserId={user?.id}
        contextType="activity"
        contextId={activityId}
        showNoShow={Boolean(isHost && canShowReviewForm)}
      />
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
    paddingBottom: spacing.xxxl,
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSport: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  heroListingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  heroIntent: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  heroTime: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  heroLocation: {
    marginTop: spacing.xs + 2,
    fontSize: 15,
    color: colors.textSecondary,
  },
  courtReportLink: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  heroMeta: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
  },
  participantsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readySummary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  participantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  participantRole: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  gameKindBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  inviteOnlyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  urgentText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#b42318',
  },
  recurringText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a6535',
  },
  regularGroupText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  tournamentBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tournamentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  tournamentHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  tournamentRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tournamentRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
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
    color: '#666',
    fontWeight: '600',
  },
  linkActionPrimary: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
  },
  gameRoomButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
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
    color: colors.primary,
    fontWeight: '600',
  },
  utilityButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  utilityButtonDisabled: {
    opacity: 0.6,
  },
  utilityButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  requestsSection: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  requestUserTap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  requestUser: {
    fontSize: 16,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ActivityDetailScreen;

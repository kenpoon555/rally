import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  makeActivityRecurring,
  setGameRsvp,
  joinGameViaInvite,
} from '../../services/activityService';
import {
  createRegularGroupFromActivity,
  getRegularGroupById,
} from '../../services/regularGroupService';
import { buildGameInviteUrl, buildRegularGroupInviteUrl } from '../../navigation/deepLinking';
import { RegularGroup } from '../../types/regularGroup';
import GameRsvpBar from '../../components/GameRsvpBar';
import { GameRsvpStatus } from '../../types/activity';
import { supabase } from '../../services/api/supabase';
import PlayerProfileModal, { PlayerProfilePreview } from '../../components/PlayerProfileModal';
import { formatActivityTime, getApprovedParticipants, canHostScheduleNextGame } from '../../utils/activityHelpers';
import { isActivityListingActive, isReviewWindowOpen } from '../../utils/activityExpiry';
import { ActivityCandidateLocation, JoinRequest } from '../../types/activity';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROUTES } from '../../constants/routes';
import {
  ensureActivityGroupConversation,
} from '../../services/chatService';
import {
  canViewProfileIdentity,
  getProfileReviewStats,
  submitPlayerReview,
} from '../../services/reviewService';
import { ProfileReviewStats } from '../../types/review';
import { getActivityDetailMatchingCopy } from '../../constants/sports';
import { trackProductEvent } from '../../services/analyticsService';
import { PRIMARY_COLOR } from '../../constants/theme';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId?: string; inviteToken?: string };
  CreateActivity: undefined;
  ChatThread: { conversationId: string; title?: string };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ActivityDetail'>;

const ActivityDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId: routeActivityId, inviteToken } = route.params;
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
  const [canSeeHostIdentity, setCanSeeHostIdentity] = useState(false);
  const [reviewStats, setReviewStats] = useState<ProfileReviewStats | null>(null);
  const [friendliness, setFriendliness] = useState(3);
  const [physicality, setPhysicality] = useState(3);
  const [vibe, setVibe] = useState(3);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTargetUserId, setReviewTargetUserId] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [profilePlayer, setProfilePlayer] = useState<PlayerProfilePreview | null>(null);
  const [extendPickerVisible, setExtendPickerVisible] = useState(false);
  const [extendStartTime, setExtendStartTime] = useState(() => new Date());
  const [extending, setExtending] = useState(false);
  const [schedulingNext, setSchedulingNext] = useState(false);
  const [makingRecurring, setMakingRecurring] = useState(false);
  const [rsvpSaving, setRsvpSaving] = useState(false);
  const [redeemingInvite, setRedeemingInvite] = useState(false);
  const [regularGroup, setRegularGroup] = useState<RegularGroup | null>(null);
  const [creatingRegularGroup, setCreatingRegularGroup] = useState(false);

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

  const canShowReviewForm = useMemo(
    () => Boolean(activity && isReviewWindowOpen(activity)),
    [activity]
  );

  const activeReviewTargetId = useMemo(() => {
    if (!activity || !user) {
      return null;
    }
    if (isHost) {
      const fallback = approvedParticipants[0]?.user_id || null;
      if (reviewTargetUserId && approvedParticipants.some((p) => p.user_id === reviewTargetUserId)) {
        return reviewTargetUserId;
      }
      return fallback;
    }
    return activity.user_id;
  }, [activity, user, isHost, approvedParticipants, reviewTargetUserId]);

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
    Alert.alert(
      'Schedule next game?',
      'Creates an invite-only game next week with this roster. Hidden from Discover.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: async () => {
            setSchedulingNext(true);
            try {
              const newId = await scheduleNextGameFromActivity(activity.id);
              (navigation as any).replace(ROUTES.ACTIVITY.DETAIL, { activityId: newId });
            } catch (error: any) {
              Alert.alert('Schedule failed', error?.message || 'Could not schedule next game.');
            } finally {
              setSchedulingNext(false);
            }
          },
        },
      ]
    );
  };

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
      'Save as Regulars group?',
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
                'Regulars group saved',
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
        message: `Join our ${regularGroup.sport_type} crew "${regularGroup.name}" on Rally: ${buildRegularGroupInviteUrl(regularGroup.invite_token)}`,
      });
    } catch {
      // User dismissed share sheet.
    }
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

  const handleSetRsvp = async (status: GameRsvpStatus) => {
    if (!activity) {
      return;
    }
    setRsvpSaving(true);
    try {
      await setGameRsvp(activity.id, status);
      await refetch();
    } catch (err: any) {
      Alert.alert('RSVP failed', err?.message || 'Could not save RSVP.');
    } finally {
      setRsvpSaving(false);
    }
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

  useEffect(() => {
    if (!activity?.user_id || !activity?.id) {
      setCanSeeHostIdentity(false);
      return;
    }
    canViewProfileIdentity(activity.user_id, activity.id)
      .then(setCanSeeHostIdentity)
      .catch(() => setCanSeeHostIdentity(activity.match_status === 'finalized'));
  }, [activity?.id, activity?.user_id, activity?.match_status]);

  useEffect(() => {
    if (!activity?.user_id) {
      setReviewStats(null);
      return;
    }
    getProfileReviewStats(activity.user_id)
      .then(setReviewStats)
      .catch(() => setReviewStats(null));
  }, [activity?.user_id]);

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
      Alert.alert('Thanks', 'Your review has been submitted.');
      const updatedStats = await getProfileReviewStats(activeReviewTargetId);
      setReviewStats(updatedStats);
      setReviewComment('');
      if (isHost) {
        setReviewTargetUserId(null);
      }
    } catch (error: any) {
      Alert.alert('Review failed', error?.message || 'Could not submit review.');
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

  const handleSetReady = async () => {
    if (!activity || iAmReady) {
      return;
    }
    setSettingReady(true);
    try {
      await setGameReady(activity.id, true);
      await refetch();
    } catch (error: any) {
      Alert.alert('Ready failed', error?.message || 'Could not mark ready.');
    } finally {
      setSettingReady(false);
    }
  };

  const handleLeaveGame = () => {
    if (!activity || isHost || isFinalized) {
      return;
    }
    Alert.alert('Leave this game?', 'You will be removed from the roster and game chat.', [
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
    ]);
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
        title: activity.location?.name || `${activity.sport_type} game`,
        activityId: activity.id,
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
  const showChat = canOpenActivityChat(activity, user?.id);
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
        <Text style={styles.heroTime}>{timeLabel}</Text>
        <Text style={styles.heroLocation}>{activity.location?.name || 'Court TBD'}</Text>
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
          <Text style={styles.regularGroupText}>Regulars: {regularGroup.name}</Text>
        ) : null}
        {expiresLabel ? (
          <Text style={styles.expiresText}>
            {listingActive ? 'Listing open until' : 'Listing ended'}: {expiresLabel}
          </Text>
        ) : null}
        {showChat ? (
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
        {canScheduleNext ? (
          <TouchableOpacity
            style={[styles.secondaryButton, schedulingNext && styles.utilityButtonDisabled]}
            onPress={handleScheduleNextGame}
            disabled={schedulingNext}
          >
            <Text style={styles.secondaryButtonText}>
              {schedulingNext ? 'Scheduling…' : 'Schedule next game'}
            </Text>
          </TouchableOpacity>
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
        {isHost && !activity.regular_group_id && activity.status === 'active' ? (
          <TouchableOpacity
            style={[styles.secondaryButton, creatingRegularGroup && styles.utilityButtonDisabled]}
            onPress={handleCreateRegularGroup}
            disabled={creatingRegularGroup}
          >
            <Text style={styles.secondaryButtonText}>
              {creatingRegularGroup ? 'Saving…' : 'Save as Regulars group'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {regularGroup?.invite_token && (isHost || isApprovedJoiner) ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleShareGroupInvite()}>
            <Text style={styles.secondaryButtonText}>Share group invite link</Text>
          </TouchableOpacity>
        ) : null}
        {activity.invite_token && (isHost || isApprovedJoiner) ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleShareInvite()}>
            <Text style={styles.secondaryButtonText}>Share invite link</Text>
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

      {activity.status === 'active' ? (
        <GameRsvpBar
          activity={activity}
          userId={user?.id}
          saving={rsvpSaving}
          onSetRsvp={(status) => void handleSetRsvp(status)}
        />
      ) : null}

      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>Players</Text>
        {activity.user && (
          <TouchableOpacity
            style={styles.participantRow}
            onPress={() =>
              canSeeHostIdentity || isHost
                ? openPlayerProfile(activity.user!, 'Host')
                : undefined
            }
            disabled={!canSeeHostIdentity && !isHost}
          >
            <View style={styles.participantAvatar}>
              <Text style={styles.participantAvatarText}>
                {(canSeeHostIdentity || isHost ? activity.user.username : '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {canSeeHostIdentity || isHost ? activity.user.username : 'Host'}
              </Text>
              <Text style={styles.participantRole}>Host</Text>
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
              <View style={styles.participantAvatar}>
                <Text style={styles.participantAvatarText}>
                  {req.user.username.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{req.user.username}</Text>
                <Text style={styles.participantRole}>
                  Joined{req.ready_at ? ' · Ready' : ''}
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
          Open Game Room to mark ready, chat with your crew, or leave this game.
        </Text>
      ) : null}

      {!isHost && isApprovedJoiner && !isFinalized && !showChat ? (
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              styles.ctaRowButton,
              (iAmReady || settingReady) && styles.utilityButtonDisabled,
            ]}
            onPress={handleSetReady}
            disabled={iAmReady || settingReady}
          >
            <Text style={styles.secondaryButtonText}>
              {iAmReady ? 'Ready ✓' : settingReady ? 'Saving...' : 'Mark Ready'}
            </Text>
          </TouchableOpacity>
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
        <Text style={styles.inGameText}>You're in this game (finalized)</Text>
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
            {finalizing ? 'Finalizing...' : 'Finalize game (lock roster)'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isFinalized && (
        <Text style={styles.finalizedBanner}>Roster locked — game is finalized</Text>
      )}

      <View style={styles.reviewPanel}>
        <Text style={styles.sectionTitle}>Host Review Snapshot</Text>
        <Text style={styles.reviewMeta}>
          Reviews: {reviewStats?.review_count || 0}
          {typeof reviewStats?.visible_score === 'number'
            ? ` • Score: ${reviewStats.visible_score.toFixed(2)}`
            : ' • Score hidden until 5 reviews'}
        </Text>
        {canShowReviewForm && activeReviewTargetId && user?.id !== activeReviewTargetId && (
          <>
            {isHost && approvedParticipants.length > 1 && (
              <View style={styles.inlineRow}>
                {approvedParticipants.map((participant) => (
                  <TouchableOpacity
                    key={participant.user_id}
                    style={[
                      styles.inlineChip,
                      activeReviewTargetId === participant.user_id && styles.inlineChipSelected,
                    ]}
                    onPress={() => setReviewTargetUserId(participant.user_id)}
                  >
                    <Text
                      style={[
                        styles.inlineChipText,
                        activeReviewTargetId === participant.user_id &&
                          styles.inlineChipTextSelected,
                      ]}
                    >
                      {participant.user?.username || 'Player'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.reviewMeta}>
              {isHost ? 'Rate your player after the match:' : 'Rate host vibe after the match:'}
            </Text>
            <View style={styles.inlineRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={`f-${value}`}
                  style={[styles.inlineChip, friendliness === value && styles.inlineChipSelected]}
                  onPress={() => setFriendliness(value)}
                >
                  <Text
                    style={[
                      styles.inlineChipText,
                      friendliness === value && styles.inlineChipTextSelected,
                    ]}
                  >
                    Friendly {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inlineRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={`p-${value}`}
                  style={[styles.inlineChip, physicality === value && styles.inlineChipSelected]}
                  onPress={() => setPhysicality(value)}
                >
                  <Text
                    style={[
                      styles.inlineChipText,
                      physicality === value && styles.inlineChipTextSelected,
                    ]}
                  >
                    Physical {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inlineRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={`v-${value}`}
                  style={[styles.inlineChip, vibe === value && styles.inlineChipSelected]}
                  onPress={() => setVibe(value)}
                >
                  <Text style={[styles.inlineChipText, vibe === value && styles.inlineChipTextSelected]}>
                    Vibe {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Optional review comment"
            />
            <TouchableOpacity
              style={[styles.utilityButton, submittingReview && styles.utilityButtonDisabled]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              <Text style={styles.utilityButtonText}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {activity && !canShowReviewForm && activity.status === 'completed' && (
          <Text style={styles.reviewMeta}>
            Reviews open about 2 hours after the scheduled game ends.
          </Text>
        )}
      </View>

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
                    {isHost || activity.match_status === 'finalized'
                      ? item.user?.username || 'Unknown user'
                      : 'Anonymous player'}
                  </Text>
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
    backgroundColor: '#f2f4f7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  gameRoomHint: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    backgroundColor: '#eef4ff',
    padding: 12,
    borderRadius: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111',
  },
  errorBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSport: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  statusBadge: {
    backgroundColor: '#e8f1ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0057c2',
    textTransform: 'capitalize',
  },
  heroTime: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  heroLocation: {
    marginTop: 6,
    fontSize: 15,
    color: '#444',
  },
  heroMeta: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  participantsSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
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
  gameRoomButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
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
    color: '#007AFF',
    fontWeight: '600',
  },
  utilityButton: {
    backgroundColor: '#1a73e8',
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
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
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

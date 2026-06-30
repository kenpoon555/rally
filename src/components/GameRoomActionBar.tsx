import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScheduleDateTimePicker } from './ScheduleDateTimePicker';
import { useActivity } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import {
  approveJoinRequest,
  getActivityJoinRequests,
  hostTransferAndExit,
  leaveGame,
  rejectJoinRequest,
  scheduleNextGameFromActivity,
  scheduleGroupNextGame,
  updateActivity,
  removeFromRoster,
} from '../services/activityService';
import { isRegularGroupMember } from '../services/regularGroupService';
import {
  confirmLockRoster,
  confirmUndoImIn,
  joinCrewGameWithFeedback,
  lockGameRoster,
  nudgeGameRoster,
  setGameReadyState,
  showNudgeSent,
} from '../services/gameCardSessionActions';
import { supabase } from '../services/api/supabase';
import { JoinRequest } from '../types/activity';
import {
  formatActivityTime,
  getActivityRosterMax,
  getActivityRosterMin,
  getApprovedParticipants,
  getGameStatusLabel,
  canHostScheduleNextGame,
  isPostGameActivity,
  isGameChatReadOnly,
  isGameChatInPostGameGrace,
  activityHasOpenSpots,
  sortApprovedRosterParticipants,
  pickNextHostCandidate,
} from '../utils/activityHelpers';
import { PRODUCT_COPY } from '../constants/productCopy';
import { colors, radius, spacing } from '../constants/theme';
import { GAME_CHAT_ARCHIVE_GRACE_HOURS } from '../constants/gameChat';
import { getRegularGroupById } from '../services/regularGroupService';
import { setFocusedGameRoomActivityId } from '../utils/gameRoomFocus';
import PlayerProfileModal, { PlayerProfilePreview } from './PlayerProfileModal';
import { PlayerTrustLine } from './PlayerTrustLine';
import { StatusGroupedRoster } from './game/StatusGroupedRoster';
import { SessionRotationPanel } from './SessionRotationPanel';
import { SportIconForSurface } from './SportIconForSurface';
import { sportSupportsRotation } from '../constants/sports';
import {
  createNeedPlayerPost,
  getOpenNeedPostForActivity,
  listNeedPlayerRequestsForActivity,
  respondNeedPlayerRequest,
} from '../services/needPlayersService';
import { NeedPlayerRequest, OpenNeedPostSummary } from '../types/needPlayer';
import { inviteFillIn, suggestFillIns } from '../services/fillInService';
import { FillInSuggestion } from '../types/fillIn';
import { FillInSuggestionCard } from './FillInSuggestionCard';
import { ROUTES } from '../constants/routes';

type GameRoomContextValue = {
  activityId: string;
  activity: ReturnType<typeof useActivity>['activity'];
  loading: boolean;
  refetch: () => Promise<void>;
  groupName: string | null;
  isHost: boolean;
  isApprovedJoiner: boolean;
  isPendingJoiner: boolean;
  isFinalized: boolean;
  isPostGame: boolean;
  isChatReadOnly: boolean;
  iAmReady: boolean;
  readyCount: number;
  rosterCount: number;
  pendingRequests: JoinRequest[];
  loadingRequests: boolean;
  requestsError: string | null;
  approvedParticipants: JoinRequest[];
  sortedApprovedParticipants: JoinRequest[];
  nextHostCandidate: JoinRequest | undefined;
  hostUsername: string;
  hostUser: { id: string; username: string; profile_photo_url?: string } | null;
  openPlayerProfile: (
    player: { id: string; username: string; profile_photo_url?: string },
    roleLabel: string
  ) => void;
  courtName: string;
  timeLabel: string;
  statusLabel: string;
  finalizing: boolean;
  settingReady: boolean;
  leaving: boolean;
  transferring: boolean;
  onLeftGame?: () => void;
  onOpenDetails?: () => void;
  onOpenRallyHub?: () => void;
  handlePublishToDiscover: () => void;
  publishingToDiscover: boolean;
  handleApprove: (requestId: string) => Promise<void>;
  handleReject: (requestId: string) => Promise<void>;
  handleSetReady: () => void;
  handleUndoReady: () => void;
  handleLeaveGame: () => void;
  handleHostExit: () => void;
  handleCloseGameRoom: () => void;
  handleFinalize: () => void;
  handleNudgeRoster: () => void;
  canNudgeRoster: boolean;
  nudging: boolean;
  handleScheduleNextGame: () => void;
  canScheduleNext: boolean;
  schedulingNext: boolean;
  viewerId?: string;
  participantReady: (req: JoinRequest) => boolean;
  isGroupMember: boolean;
  isCrewGame: boolean;
  joiningCrew: boolean;
  handleJoinCrewGame: () => Promise<void>;
  handleRemovePlayer: (userId: string, username: string) => void;
  schedulePickerVisible: boolean;
  nextStartTime: Date;
  setSchedulePickerVisible: (visible: boolean) => void;
  setNextStartTime: (date: Date) => void;
  confirmScheduleNext: () => Promise<void>;
  detailsExpanded: boolean;
  setDetailsExpanded: (expanded: boolean) => void;
};

const GameRoomContext = createContext<GameRoomContextValue | null>(null);

export function useOptionalGameRoom(): GameRoomContextValue | null {
  return useContext(GameRoomContext);
}

function useGameRoomContext(): GameRoomContextValue {
  const ctx = useContext(GameRoomContext);
  if (!ctx) {
    throw new Error('GameRoom components must be used within GameRoomProvider');
  }
  return ctx;
}

type ProviderProps = {
  activityId: string;
  onOpenDetails?: () => void;
  onOpenRallyHub?: () => void;
  onLeftGame?: () => void;
  onScheduledNextGame?: (newActivityId: string) => void;
  children: React.ReactNode;
};

export const GameRoomProvider: React.FC<ProviderProps> = ({
  activityId,
  onOpenDetails,
  onOpenRallyHub,
  onLeftGame,
  onScheduledNextGame,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activity, loading, refetch } = useActivity(activityId);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const pendingRequestOps = useRef(new Set<string>());
  const [finalizing, setFinalizing] = useState(false);
  const [settingReady, setSettingReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [schedulingNext, setSchedulingNext] = useState(false);
  const [publishingToDiscover, setPublishingToDiscover] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [isGroupMember, setIsGroupMember] = useState(false);
  const [schedulePickerVisible, setSchedulePickerVisible] = useState(false);
  const [nextStartTime, setNextStartTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [profilePlayer, setProfilePlayer] = useState<PlayerProfilePreview | null>(null);
  const [joiningCrew, setJoiningCrew] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [readyOverride, setReadyOverride] = useState<boolean | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const openPlayerProfile = useCallback(
    (
      player: { id: string; username: string; profile_photo_url?: string },
      roleLabel: string
    ) => {
      setProfilePlayer({
        id: player.id,
        username: player.username,
        profile_photo_url: player.profile_photo_url,
        roleLabel,
      });
    },
    []
  );

  useEffect(() => {
    const groupId = activity?.regular_group_id;
    if (!groupId) {
      setGroupName(null);
      return;
    }
    let cancelled = false;
    getRegularGroupById(groupId)
      .then((group) => {
        if (!cancelled) {
          setGroupName(group?.name ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroupName(null);
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

  const isHost = Boolean(user && activity && user.id === activity.user_id);
  const myJoinRequest = useMemo(
    () => (activity?.join_requests || []).find((r) => r.user_id === user?.id),
    [activity?.join_requests, user?.id]
  );
  const isApprovedJoiner = myJoinRequest?.status === 'approved';
  const isPendingJoiner = myJoinRequest?.status === 'pending';
  const isFinalized = activity?.match_status === 'finalized';
  const isPostGame = activity ? isPostGameActivity(activity) : false;
  const isChatReadOnly = activity ? isGameChatReadOnly(activity) : false;
  const serverReady = Boolean(isHost || myJoinRequest?.ready_at);
  const iAmReady = readyOverride ?? serverReady;

  useEffect(() => {
    setFocusedGameRoomActivityId(activityId);
    return () => setFocusedGameRoomActivityId(null);
  }, [activityId]);

  useEffect(() => {
    if (readyOverride === null) {
      return;
    }
    if (Boolean(myJoinRequest?.ready_at) === readyOverride || isHost) {
      setReadyOverride(null);
    }
  }, [myJoinRequest?.ready_at, readyOverride, isHost]);
  const approvedParticipants = useMemo(
    () => (activity ? getApprovedParticipants(activity) : []),
    [activity]
  );
  const sortedApprovedParticipants = useMemo(
    () => sortApprovedRosterParticipants(approvedParticipants),
    [approvedParticipants]
  );
  const nextHostCandidate = useMemo(
    () => (activity ? pickNextHostCandidate(activity) : undefined),
    [activity]
  );
  const participantReady = useCallback(
    (req: JoinRequest) => {
      if (user?.id && req.user_id === user.id && readyOverride !== null) {
        return readyOverride;
      }
      return Boolean(req.ready_at);
    },
    [readyOverride, user?.id]
  );
  const readyCount =
    approvedParticipants.filter((p) => participantReady(p)).length + (isHost ? 1 : 0);
  const rosterCount = approvedParticipants.length + 1;
  const needsNudgeCount = approvedParticipants.filter((p) => !participantReady(p)).length;
  const canNudgeRoster = Boolean(isHost && !isFinalized && needsNudgeCount > 0);
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

  const loadJoinRequests = useCallback(async () => {
    if (!isHost) {
      setJoinRequests([]);
      setRequestsError(null);
      return;
    }
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      setJoinRequests(await getActivityJoinRequests(activityId));
    } catch (err) {
      setJoinRequests([]);
      setRequestsError(err instanceof Error ? err.message : 'Could not load join requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, [activityId, isHost]);

  useEffect(() => {
    void loadJoinRequests();
  }, [loadJoinRequests]);

  useEffect(() => {
    const channel = supabase
      .channel(`game-room-join-${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          void loadJoinRequests();
          void refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, loadJoinRequests, refetch]);

  const isCrewGame = Boolean(activity?.regular_group_id);

  const handleJoinCrewGame = async () => {
    if (!activity || !isCrewGame || !isGroupMember) {
      return;
    }
    setJoiningCrew(true);
    try {
      await joinCrewGameWithFeedback(activity.id);
      await refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not join game.';
      Alert.alert('Join failed', message);
    } finally {
      setJoiningCrew(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (pendingRequestOps.current.has(requestId)) {
      return;
    }
    pendingRequestOps.current.add(requestId);
    try {
      await approveJoinRequest(requestId, activityId);
      await loadJoinRequests();
      await refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve request';
      Alert.alert('Error', message);
    } finally {
      pendingRequestOps.current.delete(requestId);
    }
  };

  const handleReject = async (requestId: string) => {
    if (pendingRequestOps.current.has(requestId)) {
      return;
    }
    pendingRequestOps.current.add(requestId);
    try {
      await rejectJoinRequest(requestId);
      await loadJoinRequests();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject request';
      Alert.alert('Error', message);
    } finally {
      pendingRequestOps.current.delete(requestId);
    }
  };

  const applyReady = async (ready: boolean) => {
    if (!activity || isHost) {
      return;
    }
    setReadyOverride(ready);
    setSettingReady(true);
    try {
      await setGameReadyState(activity.id, ready);
      await refetch();
    } catch (error: unknown) {
      setReadyOverride(null);
      const message = error instanceof Error ? error.message : 'Could not confirm.';
      Alert.alert("Couldn't save", message);
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
    if (!activity || !iAmReady || isHost) {
      return;
    }
    confirmUndoImIn(() => {
      void applyReady(false);
    });
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

  const confirmScheduleNext = async () => {
    if (!activity || !isHost) {
      return;
    }
    setSchedulingNext(true);
    try {
      const startIso = nextStartTime.toISOString();
      const rosterMax = getActivityRosterMax(activity);
      const rosterMin = getActivityRosterMin(activity);
      let newId: string;
      if (activity.regular_group_id) {
        newId = await scheduleGroupNextGame(
          activity.regular_group_id,
          startIso,
          rosterMax,
          activity.duration,
          rosterMin
        );
      } else {
        newId = await scheduleNextGameFromActivity(activity.id, startIso);
      }
      setSchedulePickerVisible(false);
      onScheduledNextGame?.(newId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not schedule next game.';
      Alert.alert('Schedule failed', message);
    } finally {
      setSchedulingNext(false);
    }
  };

  const handleHostExit = () => {
    if (!activity) {
      return;
    }
    const next = nextHostCandidate;
    const body = next?.user?.username
      ? PRODUCT_COPY.hostExitTransferBody(next.user.username)
      : PRODUCT_COPY.hostExitCancelBody;
    Alert.alert(PRODUCT_COPY.hostExitTitle, body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: PRODUCT_COPY.exitGameRoom,
        style: 'destructive',
        onPress: () => {
          setTransferring(true);
          void (async () => {
            try {
              const result = await hostTransferAndExit(activity.id);
              if (result.cancelled) {
                Alert.alert(PRODUCT_COPY.hostExitDoneCancel);
              } else if (result.new_host_username) {
                Alert.alert(PRODUCT_COPY.hostExitDoneTransfer(result.new_host_username));
              }
              onLeftGame?.();
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : 'Could not transfer host.';
              Alert.alert('Exit failed', message);
            } finally {
              setTransferring(false);
            }
          })();
        },
      },
    ]);
  };

  const handleCloseGameRoom = () => {
    onLeftGame?.();
  };

  const handleLeaveGame = () => {
    if (!activity) {
      return;
    }
    Alert.alert(
      PRODUCT_COPY.leaveBeforeLockTitle,
      isApprovedJoiner && iAmReady
        ? PRODUCT_COPY.leaveBeforeLockCommittedBody
        : PRODUCT_COPY.leaveBeforeLockBody,
      [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setLeaving(true);
            try {
              await leaveGame(activity.id);
              onLeftGame?.();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Could not leave game.';
              Alert.alert('Leave failed', message);
            } finally {
              setLeaving(false);
            }
          })();
        },
      },
    ]);
  };

  const handleFinalize = () => {
    if (!activity || !isHost) {
      return;
    }
    if (approvedParticipants.length === 0) {
      Alert.alert(
        'Need players first',
        'Approve at least one joiner (or wait for Rally members to join) before locking the roster.'
      );
      return;
    }
    confirmLockRoster(async () => {
      setFinalizing(true);
      try {
        await lockGameRoster(activity.id);
        await refetch();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Could not lock roster.';
        Alert.alert('Lock failed', message);
      } finally {
        setFinalizing(false);
      }
    });
  };

  const courtName = activity?.location?.name || 'Court TBD';
  const timeLabel = activity
    ? formatActivityTime(activity.start_time, activity.duration)
    : '';
  const statusLabel = activity ? getGameStatusLabel(activity) : '';
  const hostUsername = activity?.user?.username || 'Host';
  const hostUser = useMemo(() => {
    if (!activity?.user_id) {
      return null;
    }
    return {
      id: activity.user_id,
      username: activity.user?.username || 'Host',
      profile_photo_url: activity.user?.profile_photo_url,
    };
  }, [activity?.user_id, activity?.user?.username, activity?.user?.profile_photo_url]);
  const canScheduleNext = Boolean(activity && canHostScheduleNextGame(activity, isHost));

  const handlePublishToDiscover = useCallback(() => {
    if (!activity || !isHost || activity.visibility !== 'invite_only') {
      return;
    }
    const openSpots = activity.missing_players ?? 0;
    Alert.alert(
      'List on Discover?',
      `Anyone nearby can request to join (${openSpots} spot${openSpots === 1 ? '' : 's'} open). You can still approve who gets in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'List on Discover',
          onPress: async () => {
            setPublishingToDiscover(true);
            try {
              await updateActivity(activity.id, { visibility: 'nearby' });
              await refetch();
              Alert.alert(
                'Listed on Discover',
                'Your game now appears on Discover for players nearby. Share the invite link if you want to fill spots faster.'
              );
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : 'Could not update visibility.';
              Alert.alert('Could not list game', message);
            } finally {
              setPublishingToDiscover(false);
            }
          },
        },
      ]
    );
  }, [activity, isHost, refetch]);

  const handleRemovePlayer = useCallback(
    (userId: string, username: string) => {
      if (!activity || !isHost || isFinalized) {
        return;
      }
      Alert.alert(
        'Remove from roster?',
        `${username} can re-join if spots open. No penalty before lock.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await removeFromRoster(activity.id, userId);
                  await loadJoinRequests();
                  await refetch();
                } catch (error: unknown) {
                  Alert.alert(
                    'Could not remove',
                    error instanceof Error ? error.message : 'Try again.'
                  );
                }
              })();
            },
          },
        ]
      );
    },
    [activity, isHost, isFinalized, loadJoinRequests, refetch]
  );

  const handleNudgeRoster = useCallback(() => {
    if (!activity || !canNudgeRoster) {
      return;
    }
    setNudging(true);
    void (async () => {
      try {
        const count = await nudgeGameRoster(activity.id);
        showNudgeSent(count);
      } catch (error: unknown) {
        Alert.alert(
          'Could not nudge',
          error instanceof Error ? error.message : 'Try again.'
        );
      } finally {
        setNudging(false);
      }
    })();
  }, [activity, canNudgeRoster]);

  const value: GameRoomContextValue = {
    activityId,
    activity,
    loading,
    refetch,
    groupName,
    isHost,
    isApprovedJoiner,
    isPendingJoiner,
    isFinalized,
    isPostGame,
    isChatReadOnly,
    iAmReady,
    readyCount,
    rosterCount,
    pendingRequests,
    loadingRequests,
    requestsError,
    approvedParticipants,
    sortedApprovedParticipants,
    nextHostCandidate,
    hostUsername,
    hostUser,
    openPlayerProfile,
    courtName,
    timeLabel,
    statusLabel,
    finalizing,
    settingReady,
    leaving,
    transferring,
    onLeftGame,
    onOpenDetails,
    onOpenRallyHub,
    handlePublishToDiscover,
    publishingToDiscover,
    handleApprove,
    handleReject,
    handleSetReady,
    handleUndoReady,
    handleLeaveGame,
    handleHostExit,
    handleCloseGameRoom,
    handleFinalize,
    handleNudgeRoster,
    canNudgeRoster,
    nudging,
    handleScheduleNextGame,
    canScheduleNext,
    schedulingNext,
    viewerId: user?.id,
    participantReady,
    isGroupMember,
    schedulePickerVisible,
    nextStartTime,
    setSchedulePickerVisible,
    setNextStartTime,
    confirmScheduleNext,
    isCrewGame,
    joiningCrew,
    handleJoinCrewGame,
    handleRemovePlayer,
    detailsExpanded,
    setDetailsExpanded,
  };

  return (
    <GameRoomContext.Provider value={value}>
      {children}
      {schedulePickerVisible && activity && isHost ? (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!schedulingNext) {
              setSchedulePickerVisible(false);
            }
          }}
        >
          <View style={styles.schedulePickerModal}>
            <Pressable
              style={styles.schedulePickerBackdrop}
              onPress={() => {
                if (!schedulingNext) {
                  setSchedulePickerVisible(false);
                }
              }}
            />
            <View style={[styles.schedulePickerSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <ScheduleDateTimePicker
                visible={schedulePickerVisible}
                value={nextStartTime}
                onChange={setNextStartTime}
                title="Next game start time"
              />
              <View style={styles.schedulePickerActions}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.schedulePickerActionBtn]}
                  onPress={() => setSchedulePickerVisible(false)}
                  disabled={schedulingNext}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    styles.schedulePickerActionBtn,
                    schedulingNext && styles.btnDisabled,
                  ]}
                  onPress={() => void confirmScheduleNext()}
                  disabled={schedulingNext}
                >
                  <Text style={styles.primaryBtnText}>
                    {schedulingNext
                      ? 'Scheduling…'
                      : activity.regular_group_id
                        ? 'Post for crew'
                        : 'Schedule next game'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      <PlayerProfileModal
        visible={!!profilePlayer}
        player={profilePlayer}
        onClose={() => setProfilePlayer(null)}
        currentUserId={user?.id}
        contextType="activity"
        contextId={activityId}
        showNoShow={Boolean(isHost && activity && activity.status !== 'cancelled')}
      />
    </GameRoomContext.Provider>
  );
};

function statusStyle(label: string) {
  if (label === 'Finalized') {
    return styles.statusFinalized;
  }
  if (label === 'Open') {
    return styles.statusOpen;
  }
  return styles.statusDefault;
}

function RosterAvatar({
  label,
  ready,
  waiting,
  role,
  compact,
  onPress,
  onLongPress,
}: {
  label: string;
  ready: boolean;
  waiting?: boolean;
  role?: string;
  compact?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const size = compact ? 34 : 40;
  const content = (
    <>
      <View
        style={[
          styles.avatar,
          compact && styles.avatarCompact,
          { width: size, height: size, borderRadius: size / 2 },
          ready && styles.avatarReady,
        ]}
      >
        <Text style={[styles.avatarText, compact && styles.avatarTextCompact]}>
          {label.slice(0, 1).toUpperCase()}
        </Text>
        {ready ? (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>✓</Text>
          </View>
        ) : null}
        {!ready && waiting ? <View style={styles.waitingDot} /> : null}
      </View>
      <Text style={[styles.avatarName, compact && styles.avatarNameCompact]} numberOfLines={1}>
        {label}
      </Text>
      {role ? <Text style={styles.avatarRole}>{role}</Text> : null}
    </>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={styles.avatarWrap}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.avatarWrap}>{content}</View>;
}

const GameRoomExitRow: React.FC = () => {
  const {
    activity,
    isHost,
    isApprovedJoiner,
    isFinalized,
    isPostGame,
    isChatReadOnly,
    transferring,
    leaving,
    handleHostExit,
    handleCloseGameRoom,
  } = useGameRoomContext();

  if (!activity) {
    return null;
  }

  if (isPostGame && !isChatReadOnly) {
    return null;
  }

  if (isChatReadOnly) {
    return (
      <View style={styles.exitRowWrap}>
        <Text style={styles.exitRowHint}>{PRODUCT_COPY.archivedRoomHint}</Text>
        <TouchableOpacity style={styles.exitRowBtn} onPress={handleCloseGameRoom}>
          <Text style={styles.exitRowText}>{PRODUCT_COPY.backToChats}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFinalized) {
    return (
      <View style={styles.exitRowWrap}>
        <Text style={styles.exitRowHint}>{PRODUCT_COPY.postLockRoomHint}</Text>
        <TouchableOpacity style={styles.exitRowBtn} onPress={handleCloseGameRoom}>
          <Text style={styles.exitRowText}>{PRODUCT_COPY.backToChats}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isHost) {
    return (
      <TouchableOpacity
        style={[styles.exitRowBtn, (transferring || leaving) && styles.btnDisabled]}
        onPress={handleHostExit}
        disabled={transferring || leaving}
      >
        <Text style={styles.exitRowTextDestructive}>
          {transferring ? 'Leaving…' : PRODUCT_COPY.exitGameRoom}
        </Text>
      </TouchableOpacity>
    );
  }

  if (isApprovedJoiner) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.exitRowBtn} onPress={handleCloseGameRoom}>
      <Text style={styles.exitRowText}>{PRODUCT_COPY.exitGameRoom}</Text>
    </TouchableOpacity>
  );
};

const GameCardLink: React.FC<{
  onPress: () => void;
  variant?: 'header' | 'footer';
}> = ({ onPress, variant = 'footer' }) => (
  <TouchableOpacity
    style={[styles.gameCardBtn, variant === 'header' && styles.gameCardBtnHeader]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <MaterialCommunityIcons
      name="card-text-outline"
      size={variant === 'header' ? 15 : 16}
      color={colors.primary}
    />
    <Text style={styles.gameCardBtnText}>{PRODUCT_COPY.gameCard}</Text>
  </TouchableOpacity>
);

const HeaderFoldButton: React.FC<{
  expanded: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}> = ({ expanded, onPress, accessibilityLabel }) => (
  <TouchableOpacity
    style={styles.headerFoldBtn}
    onPress={onPress}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <MaterialCommunityIcons
      name={expanded ? 'chevron-up' : 'chevron-down'}
      size={18}
      color={colors.textSecondary}
    />
  </TouchableOpacity>
);

export const GameRoomHeader: React.FC = () => {
  const {
    activity,
    loading,
    isHost,
    isFinalized,
    readyCount,
    rosterCount,
    sortedApprovedParticipants,
    hostUsername,
    hostUser,
    openPlayerProfile,
    handleRemovePlayer,
    participantReady,
    groupName,
    courtName,
    timeLabel,
    statusLabel,
    onOpenDetails,
    onOpenRallyHub,
    detailsExpanded,
    setDetailsExpanded,
  } = useGameRoomContext();

  if (loading && !activity) {
    return (
      <View style={styles.headerLoading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!activity) {
    return null;
  }

  const displayTitle = groupName || courtName;
  const isRallyGame = Boolean(activity.regular_group_id);
  const onTitlePress =
    isRallyGame && onOpenRallyHub ? onOpenRallyHub : onOpenDetails;
  const metaParts = [
    groupName ? courtName : null,
    timeLabel,
    `${readyCount}/${rosterCount} ready`,
    isFinalized ? 'Locked' : null,
  ].filter(Boolean);
  const collapsedSummary = [displayTitle, ...metaParts].filter(Boolean).join(' · ');

  if (!detailsExpanded) {
    return (
      <TouchableOpacity
        style={styles.collapsedBar}
        onPress={() => {
          Keyboard.dismiss();
          setDetailsExpanded(true);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Expand game details"
      >
        <SportIconForSurface sport={activity.sport_type} surface="gameRoomCollapsed" />
        <Text style={styles.collapsedBarText} numberOfLines={1}>
          {collapsedSummary}
        </Text>
        <View style={styles.headerFoldBtn} pointerEvents="none">
          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  }

  const showRotation =
    isFinalized &&
    Boolean(activity.regular_group_id) &&
    sportSupportsRotation(activity.sport_type);
  const hasLinks = Boolean(activity.cost_note?.trim() || onOpenDetails);

  return (
    <View style={styles.header}>
      <View style={styles.compactTop}>
        <SportIconForSurface sport={activity.sport_type} surface="gameRoomCollapsed" />
        <TouchableOpacity
          style={styles.compactCopy}
          onPress={onTitlePress}
          disabled={!onTitlePress}
          activeOpacity={onTitlePress ? 0.85 : 1}
        >
          <View style={styles.compactTitleRow}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            <View style={[styles.statusPill, statusStyle(statusLabel)]}>
              <Text style={styles.statusPillText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.compactMeta} numberOfLines={1}>
            {metaParts.join(' · ')}
          </Text>
        </TouchableOpacity>
        <HeaderFoldButton
          expanded
          onPress={() => {
            Keyboard.dismiss();
            setDetailsExpanded(false);
          }}
          accessibilityLabel="Collapse game details"
        />
      </View>

      {hasLinks ? (
        <View
          style={[
            styles.compactLinks,
            !activity.cost_note?.trim() && styles.compactLinksLeading,
          ]}
        >
          {activity.cost_note?.trim() ? (
            <View style={styles.costChip}>
              <Text style={styles.costChipText}>{activity.cost_note.trim()}</Text>
            </View>
          ) : null}
          {onOpenDetails ? (
            <GameCardLink onPress={onOpenDetails} variant="header" />
          ) : null}
        </View>
      ) : null}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rosterStripCompact}
        data={sortedApprovedParticipants}
        keyExtractor={(req) => req.id}
        ListHeaderComponent={
          <RosterAvatar
            label={hostUsername}
            ready={isHost || isFinalized}
            role="Host"
            compact
            onPress={hostUser ? () => openPlayerProfile(hostUser, 'Host') : undefined}
          />
        }
        renderItem={({ item: req }) => (
          <RosterAvatar
            label={req.user?.username || 'Player'}
            ready={participantReady(req)}
            waiting={!isFinalized && !participantReady(req)}
            compact
            role={undefined}
            onPress={
              req.user ? () => openPlayerProfile(req.user!, 'Player') : undefined
            }
            onLongPress={
              isHost && !isFinalized && req.user
                ? () => handleRemovePlayer(req.user_id, req.user!.username)
                : undefined
            }
          />
        )}
      />

      {showRotation ? (
        <SessionRotationPanel
          activityId={activity.id}
          isHost={isHost}
          canUseRotation={showRotation}
        />
      ) : null}
    </View>
  );
};

export const GameRoomFooter: React.FC = () => {
  const {
    activity,
    isHost,
    isApprovedJoiner,
    isPendingJoiner,
    isFinalized,
    isPostGame,
    isChatReadOnly,
    iAmReady,
    pendingRequests,
    loadingRequests,
    requestsError,
    finalizing,
    settingReady,
    onOpenDetails,
    isCrewGame,
    isGroupMember,
    joiningCrew,
    handleJoinCrewGame,
    handlePublishToDiscover,
    publishingToDiscover,
    handleApprove,
    handleReject,
    handleSetReady,
    handleUndoReady,
    handleLeaveGame,
    leaving,
    handleFinalize,
    handleNudgeRoster,
    canNudgeRoster,
    nudging,
    handleScheduleNextGame,
    canScheduleNext,
    schedulingNext,
    openPlayerProfile,
    viewerId,
    refetch,
    detailsExpanded,
  } = useGameRoomContext();

  const [pendingExpanded, setPendingExpanded] = useState(pendingRequests.length > 0);
  const [needRequests, setNeedRequests] = useState<NeedPlayerRequest[]>([]);
  const [openNeedPost, setOpenNeedPost] = useState<OpenNeedPostSummary | null>(null);
  const [loadingNeedRequests, setLoadingNeedRequests] = useState(false);
  const [postingNeed, setPostingNeed] = useState(false);
  const [needExpanded, setNeedExpanded] = useState(false);
  const navigation = useNavigation();
  const [fillIns, setFillIns] = useState<FillInSuggestion[]>([]);
  const [loadingFillIns, setLoadingFillIns] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [fillInsExpanded, setFillInsExpanded] = useState(false);

  const reloadFillIns = useCallback(async () => {
    if (!activity?.id || !isHost || isCrewGame) {
      setFillIns([]);
      return;
    }
    setLoadingFillIns(true);
    try {
      const suggestions = await suggestFillIns(activity.id);
      setFillIns(suggestions);
      if (suggestions.length > 0) {
        setFillInsExpanded(true);
      }
    } catch {
      setFillIns([]);
    } finally {
      setLoadingFillIns(false);
    }
  }, [activity?.id, isHost, isCrewGame]);

  const reloadNeedBoard = useCallback(async () => {
    if (!activity?.id || !isHost) {
      setNeedRequests([]);
      setOpenNeedPost(null);
      return;
    }
    setLoadingNeedRequests(true);
    try {
      const [post, requests] = await Promise.all([
        getOpenNeedPostForActivity(activity.id),
        listNeedPlayerRequestsForActivity(activity.id),
      ]);
      setOpenNeedPost(post);
      setNeedRequests(requests);
      if (requests.length > 0) {
        setNeedExpanded(true);
      }
    } catch {
      setNeedRequests([]);
    } finally {
      setLoadingNeedRequests(false);
    }
  }, [activity?.id, isHost]);

  useEffect(() => {
    void reloadNeedBoard();
  }, [reloadNeedBoard]);

  useEffect(() => {
    void reloadFillIns();
  }, [reloadFillIns]);

  useEffect(() => {
    if (pendingRequests.length > 0) {
      setPendingExpanded(true);
    }
  }, [pendingRequests.length]);

  const myJoinRequest = useMemo(
    () => (activity?.join_requests || []).find((r) => r.user_id === viewerId),
    [activity?.join_requests, viewerId]
  );
  const isWaitlistedJoiner = myJoinRequest?.status === 'waitlisted';

  if (!activity) {
    return null;
  }

  const hasOpenSpots = activityHasOpenSpots(activity);
  const crewGameFull = !hasOpenSpots && !isHost && !isApprovedJoiner;

  if (isPostGame && !isChatReadOnly) {
    return (
      <View style={styles.footer}>
        {isGameChatInPostGameGrace(activity) ? (
          <View style={styles.graceStrip}>
            <Text style={styles.graceText}>
              Post-game chat — {GAME_CHAT_ARCHIVE_GRACE_HOURS}h to schedule the next game.
            </Text>
          </View>
        ) : null}
        {isHost && canScheduleNext ? (
          <TouchableOpacity
            style={[styles.primaryBtn, schedulingNext && styles.btnDisabled]}
            onPress={handleScheduleNextGame}
            disabled={schedulingNext}
          >
            <Text style={styles.primaryBtnText}>
              {schedulingNext ? 'Scheduling…' : 'Schedule next game'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (isChatReadOnly) {
    return (
      <View style={styles.footer}>
        <View style={styles.archivedStrip}>
          <Text style={styles.archivedText}>
            Chat archived after {GAME_CHAT_ARCHIVE_GRACE_HOURS}h — plan rematches before then, or
            schedule the next game.
          </Text>
        </View>
        {canScheduleNext ? (
          <TouchableOpacity
            style={[styles.primaryBtn, schedulingNext && styles.btnDisabled]}
            onPress={handleScheduleNextGame}
            disabled={schedulingNext}
          >
            <Text style={styles.primaryBtnText}>
              {schedulingNext ? 'Scheduling…' : 'Schedule next game'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <GameRoomExitRow />
      </View>
    );
  }

  const showScheduleNext = canScheduleNext;

  const showPlayerActions = !isFinalized && !isHost && isApprovedJoiner;
  const showHostFinalize = !isFinalized && isHost;
  const showPending = isHost && !isFinalized && !isCrewGame && pendingRequests.length > 0;
  const showListOnDiscover =
    isHost &&
    !isFinalized &&
    activity.visibility === 'invite_only' &&
    (activity.missing_players ?? 0) > 0;
  const showPostNeedPlayers =
    isHost &&
    !isFinalized &&
    !isCrewGame &&
    (activity.missing_players ?? 0) > 0 &&
    !openNeedPost;
  const showNeedRequests = isHost && !isFinalized && needRequests.length > 0;
  const showFillIns =
    isHost && !isFinalized && !isCrewGame && (activity.missing_players ?? 0) > 0;
  const openDiscoverForPlayers = () => {
    navigation.navigate('MainTabs', {
      screen: ROUTES.HOME.MAIN,
      params: {
        sportFilter: activity.sport_type,
        highlightOpenSpots: true,
      },
    });
  };

  const handleInviteFillIn = (suggestion: FillInSuggestion) => {
    setInvitingUserId(suggestion.user_id);
    void (async () => {
      try {
        await inviteFillIn(
          activity.id,
          suggestion.user_id,
          suggestion.source,
          suggestion.post_id
        );
        await reloadFillIns();
        Alert.alert(
          PRODUCT_COPY.freeAgentInviteSent,
          `@${suggestion.username} can accept from Profile.`
        );
      } catch (error: unknown) {
        Alert.alert(
          'Could not invite',
          error instanceof Error ? error.message : 'Try again.'
        );
      } finally {
        setInvitingUserId(null);
      }
    })();
  };

  const handlePostNeedPlayers = () => {
    setPostingNeed(true);
    void (async () => {
      try {
        await createNeedPlayerPost(activity.id);
        await reloadNeedBoard();
        Alert.alert(PRODUCT_COPY.postOpenSpotsDone, PRODUCT_COPY.needPlayersHint);
      } catch (error: unknown) {
        Alert.alert(
          'Could not post',
          error instanceof Error ? error.message : 'Try again.'
        );
      } finally {
        setPostingNeed(false);
      }
    })();
  };

  const handleRespondNeedRequest = (requestId: string, accept: boolean) => {
    void (async () => {
      try {
        await respondNeedPlayerRequest(requestId, accept);
        await refetch();
        await reloadNeedBoard();
      } catch (error: unknown) {
        Alert.alert(
          accept ? 'Could not accept' : 'Could not decline',
          error instanceof Error ? error.message : 'Try again.'
        );
      }
    })();
  };

  if (!detailsExpanded) {
    return null;
  }

  if (isFinalized) {
    return (
      <View style={styles.footer}>
        <View style={styles.finalizedStrip}>
          <Text style={styles.finalizedText}>Roster locked — see you on court!</Text>
          <Text style={styles.finalizedSubtext}>{PRODUCT_COPY.postLockRoomHint}</Text>
        </View>
        <GameRoomExitRow />
      </View>
    );
  }

  if (!showPlayerActions && !showHostFinalize && !showPending && isPendingJoiner && !isCrewGame) {
    return (
      <View style={styles.footer}>
        <View style={styles.waitingStrip}>
          <Text style={styles.waitingText}>Waiting for the host to approve your join request.</Text>
          {onOpenDetails ? <GameCardLink onPress={onOpenDetails} /> : null}
        </View>
        <GameRoomExitRow />
      </View>
    );
  }

  const showCrewJoin =
    isCrewGame &&
    isGroupMember &&
    !isHost &&
    !isApprovedJoiner &&
    !isPendingJoiner &&
    !isWaitlistedJoiner &&
    !isFinalized;

  if (isCrewGame && isWaitlistedJoiner && !isFinalized) {
    return (
      <View style={styles.footer}>
        <View style={styles.waitingStrip}>
          <Text style={styles.waitingText}>{PRODUCT_COPY.onWaitlist}</Text>
          <Text style={styles.waitingSubtext}>{PRODUCT_COPY.onWaitlistHint}</Text>
        </View>
        <TouchableOpacity
          style={[styles.exitRowBtn, leaving && styles.btnDisabled]}
          onPress={handleLeaveGame}
          disabled={leaving}
        >
          <Text style={styles.exitRowTextDestructive}>
            {leaving ? 'Leaving…' : 'Leave waitlist'}
          </Text>
        </TouchableOpacity>
        <GameRoomExitRow />
      </View>
    );
  }

  if (showCrewJoin) {
    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, joiningCrew && styles.btnDisabled]}
          onPress={() => void handleJoinCrewGame()}
          disabled={joiningCrew}
        >
          <Text style={styles.primaryBtnText}>
            {joiningCrew ? 'Joining…' : crewGameFull ? PRODUCT_COPY.joinWaitlist : 'Join game'}
          </Text>
        </TouchableOpacity>
        <GameRoomExitRow />
      </View>
    );
  }

  if (!showPlayerActions && !showHostFinalize && !showPending) {
    return (
      <View style={styles.footer}>
        <GameRoomExitRow />
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      {isGameChatInPostGameGrace(activity) ? (
        <View style={styles.graceStrip}>
          <Text style={styles.graceText}>
            Post-game chat — {GAME_CHAT_ARCHIVE_GRACE_HOURS}h to coordinate the next game.
          </Text>
        </View>
      ) : null}
      {showListOnDiscover ? (
        <TouchableOpacity
          style={[styles.primaryBtn, styles.scheduleBtn, publishingToDiscover && styles.btnDisabled]}
          onPress={handlePublishToDiscover}
          disabled={publishingToDiscover}
        >
          <Text style={styles.primaryBtnText}>
            {publishingToDiscover
              ? 'Listing…'
              : `List on Discover (${activity.missing_players} spot${
                  activity.missing_players === 1 ? '' : 's'
                } open)`}
          </Text>
        </TouchableOpacity>
      ) : null}
      {showPostNeedPlayers ? (
        <TouchableOpacity
          style={[styles.secondaryBtn, styles.scheduleBtn, postingNeed && styles.btnDisabled]}
          onPress={handlePostNeedPlayers}
          disabled={postingNeed}
        >
          <Text style={styles.secondaryBtnText}>
            {postingNeed ? 'Posting…' : PRODUCT_COPY.postOpenSpots}
          </Text>
        </TouchableOpacity>
      ) : openNeedPost ? (
        <View style={styles.graceStrip}>
          <Text style={styles.graceText}>{PRODUCT_COPY.postOpenSpotsDone}</Text>
        </View>
      ) : null}
      {showFillIns ? (
        <TouchableOpacity
          style={[styles.secondaryBtn, styles.scheduleBtn]}
          onPress={openDiscoverForPlayers}
        >
          <Text style={styles.secondaryBtnText}>
            {PRODUCT_COPY.findPlayers} ({activity.missing_players} spot
            {activity.missing_players === 1 ? '' : 's'})
          </Text>
        </TouchableOpacity>
      ) : null}
      {showFillIns && fillIns.length > 0 ? (
        <View style={styles.pendingCard}>
          <TouchableOpacity
            style={styles.pendingHeader}
            onPress={() => setFillInsExpanded((v) => !v)}
          >
            <Text style={styles.pendingTitle}>
              {fillIns.length} suggested fill-in{fillIns.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.pendingToggle}>{fillInsExpanded ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
          {fillInsExpanded ? (
            loadingFillIns ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.pendingLoader} />
            ) : (
              fillIns.map((suggestion) => (
                <FillInSuggestionCard
                  key={`${suggestion.source}-${suggestion.user_id}`}
                  suggestion={suggestion}
                  inviting={invitingUserId === suggestion.user_id}
                  onInvite={() => handleInviteFillIn(suggestion)}
                />
              ))
            )
          ) : null}
        </View>
      ) : null}
      {showNeedRequests ? (
        <View style={styles.pendingCard}>
          <TouchableOpacity
            style={styles.pendingHeader}
            onPress={() => setNeedExpanded((v) => !v)}
          >
            <Text style={styles.pendingTitle}>
              {needRequests.length} Need Players request{needRequests.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.pendingToggle}>{needExpanded ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
          {needExpanded ? (
            loadingNeedRequests ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.pendingLoader} />
            ) : (
              needRequests.map((req) => (
                <View key={req.id} style={styles.pendingRow}>
                  <TouchableOpacity
                    style={styles.pendingUserTap}
                    disabled={!req.username}
                    onPress={() =>
                      openPlayerProfile(
                        {
                          id: req.user_id,
                          username: req.username,
                          profile_photo_url: req.profile_photo_url ?? undefined,
                        },
                        'Player'
                      )
                    }
                  >
                    <Text style={styles.pendingName}>@{req.username}</Text>
                    {req.message ? (
                      <Text style={styles.pendingNote}>{req.message}</Text>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleRespondNeedRequest(req.id, true)}
                    >
                      <Text style={styles.approveBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleRespondNeedRequest(req.id, false)}
                    >
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : null}
        </View>
      ) : null}
      {showScheduleNext ? (
        <TouchableOpacity
          style={[styles.secondaryBtn, styles.scheduleBtn, schedulingNext && styles.btnDisabled]}
          onPress={handleScheduleNextGame}
          disabled={schedulingNext}
        >
          <Text style={styles.secondaryBtnText}>
            {schedulingNext ? 'Scheduling…' : 'Schedule next game'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {showPending ? (
        <View style={styles.pendingCard}>
          <TouchableOpacity
            style={styles.pendingHeader}
            onPress={() => setPendingExpanded((v) => !v)}
          >
            <Text style={styles.pendingTitle}>
              {pendingRequests.length} join request{pendingRequests.length === 1 ? '' : 's'}
              {!hasOpenSpots ? ' · roster full' : ''}
            </Text>
            <Text style={styles.pendingToggle}>{pendingExpanded ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
          {pendingExpanded ? (
            loadingRequests ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.pendingLoader} />
            ) : requestsError ? (
              <Text style={styles.requestsErrorText}>{requestsError}</Text>
            ) : (
              pendingRequests.map((req) => (
                <View key={req.id} style={styles.pendingRow}>
                  <TouchableOpacity
                    style={styles.pendingUserTap}
                    disabled={!req.user}
                    onPress={() =>
                      req.user && openPlayerProfile(req.user, 'Requested to join')
                    }
                  >
                    <Text style={styles.pendingName}>{req.user?.username || 'Player'}</Text>
                    {req.user ? <PlayerTrustLine userId={req.user.id} /> : null}
                  </TouchableOpacity>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={[styles.approveBtn, !hasOpenSpots && styles.btnDisabled]}
                      onPress={() => void handleApprove(req.id)}
                      disabled={!hasOpenSpots}
                    >
                      <Text style={styles.approveBtnText}>
                        {hasOpenSpots ? 'Approve' : 'Full'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => void handleReject(req.id)}
                    >
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : null}
        </View>
      ) : null}

      {showPlayerActions && !isCrewGame ? (
        <View style={styles.playerRosterBlock}>
          <StatusGroupedRoster
            activity={activity}
            onPlayerPress={(member) =>
              member.userId
                ? openPlayerProfile({ id: member.userId, username: member.name }, 'Player')
                : undefined
            }
          />
        </View>
      ) : null}

      {showPlayerActions || showHostFinalize ? (
        <View style={styles.actionRow}>
          {showPlayerActions ? (
            <>
              {iAmReady ? (
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.flexBtn, settingReady && styles.btnDisabled]}
                  onPress={handleUndoReady}
                  disabled={settingReady}
                >
                  <Text style={styles.secondaryBtnText}>
                    {settingReady ? 'Saving…' : PRODUCT_COPY.undoImIn}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    styles.flexBtn,
                    settingReady && styles.btnDisabled,
                  ]}
                  onPress={() => void handleSetReady()}
                  disabled={settingReady}
                >
                  <Text style={styles.primaryBtnText}>
                    {settingReady ? 'Saving…' : PRODUCT_COPY.imIn}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.leaveLinkBtn, leaving && styles.btnDisabled]}
                onPress={handleLeaveGame}
                disabled={leaving}
              >
                <Text style={styles.leaveLinkText}>
                  {leaving ? '…' : 'Leave'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
          {showHostFinalize ? (
            <>
              {canNudgeRoster ? (
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.flexBtn, nudging && styles.btnDisabled]}
                  onPress={handleNudgeRoster}
                  disabled={nudging}
                >
                  <Text style={styles.secondaryBtnText}>
                    {nudging ? 'Sending…' : PRODUCT_COPY.nudgeRoster}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.primaryBtn, styles.flexBtn, finalizing && styles.btnDisabled]}
                onPress={handleFinalize}
                disabled={finalizing}
              >
                <Text style={styles.primaryBtnText}>
                  {finalizing ? 'Locking…' : 'Lock roster'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : null}
      <GameRoomExitRow />
    </View>
  );
};

const styles = StyleSheet.create({
  headerLoading: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  collapsedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  collapsedBarText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  headerFoldBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  compactMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  compactLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  compactLinksLeading: {
    justifyContent: 'flex-start',
  },
  costChip: {
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  costChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rosterStripCompact: {
    paddingTop: spacing.sm,
    paddingBottom: 2,
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  courtName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  timeLabel: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  intentPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  intentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  gameCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11, 122, 94, 0.18)',
  },
  gameCardBtnHeader: {
    marginTop: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  gameCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusOpen: {
    backgroundColor: colors.primaryLight,
  },
  statusFinalized: {
    backgroundColor: colors.successSoft,
  },
  statusDefault: {
    backgroundColor: colors.background,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  rosterSummary: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rosterStrip: {
    paddingTop: 10,
    paddingBottom: 4,
    gap: 12,
  },
  avatarCompact: {
    backgroundColor: colors.primaryLight,
  },
  avatarTextCompact: {
    fontSize: 14,
  },
  avatarNameCompact: {
    maxWidth: 44,
    fontSize: 9,
  },
  avatarWrap: {
    width: 52,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarReady: {
    borderColor: '#34C759',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334',
  },
  readyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 11,
  },
  waitingDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarName: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    maxWidth: 52,
    textAlign: 'center',
  },
  avatarRole: {
    fontSize: 9,
    color: '#888',
  },
  footer: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  exitRowWrap: {
    marginTop: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  exitRowHint: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  exitRowBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  exitRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exitRowTextDestructive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b42318',
  },
  finalizedStrip: {
    backgroundColor: '#ecfdf3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  finalizedText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#1a6535',
  },
  finalizedSubtext: {
    textAlign: 'center',
    fontSize: 12,
    color: '#3d6b4f',
    lineHeight: 17,
    marginTop: 6,
  },
  archivedStrip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  archivedText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  graceStrip: {
    backgroundColor: '#fff8e6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  graceText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#7a5b00',
  },
  waitingStrip: {
    backgroundColor: '#fff8e6',
    borderRadius: 10,
    padding: 12,
  },
  waitingSubtext: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    lineHeight: 16,
  },
  waitingText: {
    fontSize: 13,
    color: '#6b4e00',
    lineHeight: 18,
  },
  scheduleBtn: {
    marginBottom: 8,
    alignItems: 'center',
  },
  pendingCard: {
    backgroundColor: '#f8f9fb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  pendingToggle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  pendingLoader: {
    marginVertical: 6,
  },
  requestsErrorText: {
    fontSize: 12,
    color: colors.error,
    marginVertical: 6,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pendingUserTap: {
    flex: 1,
    marginRight: 8,
  },
  pendingName: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  pendingNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rejectBtnText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  playerRosterBlock: {
    marginBottom: spacing.sm,
  },
  flexBtn: {
    flex: 1,
    alignItems: 'center',
  },
  leaveLinkBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  leaveLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  schedulePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  schedulePickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  schedulePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  schedulePickerActionBtn: {
    flex: 1,
  },
  schedulePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  schedulePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

/** @deprecated Use GameRoomProvider + GameRoomHeader + GameRoomFooter */
const GameRoomActionBar: React.FC<{
  activityId: string;
  onOpenDetails?: () => void;
  onLeftGame?: () => void;
}> = (props) => (
  <GameRoomProvider {...props}>
    <GameRoomHeader />
    <GameRoomFooter />
  </GameRoomProvider>
);

export default GameRoomActionBar;

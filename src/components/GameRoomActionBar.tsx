import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useActivity } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import {
  approveJoinRequest,
  finalizeGameCommitment,
  getActivityJoinRequests,
  leaveGame,
  rejectJoinRequest,
  scheduleNextGameFromActivity,
  scheduleGroupNextGame,
  setGameReady,
  updateActivity,
} from '../services/activityService';
import { isRegularGroupMember } from '../services/regularGroupService';
import { supabase } from '../services/api/supabase';
import { JoinRequest } from '../types/activity';
import {
  formatActivityTime,
  getApprovedParticipants,
  getGameStatusLabel,
  canHostScheduleNextGame,
  isGameChatReadOnly,
  isGameChatInPostGameGrace,
  activityHasOpenSpots,
} from '../utils/activityHelpers';
import { colors, spacing } from '../constants/theme';
import { GAME_CHAT_ARCHIVE_GRACE_HOURS } from '../constants/gameChat';
import { getRegularGroupById } from '../services/regularGroupService';
import PlayerProfileModal, { PlayerProfilePreview } from './PlayerProfileModal';
import { PlayerTrustLine } from './PlayerTrustLine';

type GameRoomContextValue = {
  activityId: string;
  activity: ReturnType<typeof useActivity>['activity'];
  loading: boolean;
  groupName: string | null;
  isHost: boolean;
  isApprovedJoiner: boolean;
  isPendingJoiner: boolean;
  isFinalized: boolean;
  isChatReadOnly: boolean;
  iAmReady: boolean;
  readyCount: number;
  rosterCount: number;
  pendingRequests: JoinRequest[];
  loadingRequests: boolean;
  approvedParticipants: JoinRequest[];
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
  onOpenDetails?: () => void;
  handlePublishToDiscover: () => void;
  publishingToDiscover: boolean;
  handleApprove: (requestId: string) => Promise<void>;
  handleReject: (requestId: string) => Promise<void>;
  handleSetReady: () => Promise<void>;
  handleLeaveGame: () => void;
  handleFinalize: () => void;
  handleScheduleNextGame: () => void;
  canScheduleNext: boolean;
  schedulingNext: boolean;
  viewerId?: string;
  isGroupMember: boolean;
  schedulePickerVisible: boolean;
  nextStartTime: Date;
  setSchedulePickerVisible: (visible: boolean) => void;
  setNextStartTime: (date: Date) => void;
  confirmScheduleNext: () => Promise<void>;
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
  onLeftGame?: () => void;
  onScheduledNextGame?: (newActivityId: string) => void;
  children: React.ReactNode;
};

export const GameRoomProvider: React.FC<ProviderProps> = ({
  activityId,
  onOpenDetails,
  onLeftGame,
  onScheduledNextGame,
  children,
}) => {
  const { user } = useAuth();
  const { activity, loading, refetch } = useActivity(activityId);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [settingReady, setSettingReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
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
  const isChatReadOnly = activity ? isGameChatReadOnly(activity) : false;
  const iAmReady = Boolean(isHost || myJoinRequest?.ready_at);
  const approvedParticipants = useMemo(
    () => (activity ? getApprovedParticipants(activity) : []),
    [activity]
  );
  const readyCount = approvedParticipants.filter((p) => p.ready_at).length + (isHost ? 1 : 0);
  const rosterCount = approvedParticipants.length + 1;
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

  const loadJoinRequests = useCallback(async () => {
    if (!isHost) {
      setJoinRequests([]);
      return;
    }
    setLoadingRequests(true);
    try {
      setJoinRequests(await getActivityJoinRequests(activityId));
    } catch {
      setJoinRequests([]);
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

  const handleApprove = async (requestId: string) => {
    try {
      await approveJoinRequest(requestId, activityId);
      await loadJoinRequests();
      await refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve request';
      Alert.alert('Error', message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectJoinRequest(requestId);
      await loadJoinRequests();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject request';
      Alert.alert('Error', message);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not mark ready.';
      Alert.alert('Ready failed', message);
    } finally {
      setSettingReady(false);
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

  const confirmScheduleNext = async () => {
    if (!activity || !isHost) {
      return;
    }
    setSchedulingNext(true);
    try {
      const startIso = nextStartTime.toISOString();
      const capacity =
        Math.max(2, (activity.player_count ?? 1) + (activity.missing_players ?? 0)) || 8;
      let newId: string;
      if (activity.regular_group_id) {
        newId = await scheduleGroupNextGame(
          activity.regular_group_id,
          startIso,
          capacity,
          activity.duration
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

  const handleLeaveGame = () => {
    if (!activity) {
      return;
    }
    Alert.alert(
      'Leave game?',
      isApprovedJoiner
        ? 'Leaving before finalize counts as a flake on your reliability record. You can re-request to join if spots open.'
        : 'You can re-request to join if the host has open spots.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
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
        },
      },
    ]);
  };

  const handleFinalize = () => {
    if (!activity || !isHost) {
      return;
    }
    Alert.alert(
      'Finalize game?',
      'Roster will lock. Only confirmed players can stay in the lobby.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            setFinalizing(true);
            try {
              await finalizeGameCommitment(activity.id);
              await refetch();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Could not finalize game.';
              Alert.alert('Finalize failed', message);
            } finally {
              setFinalizing(false);
            }
          },
        },
      ]
    );
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

  const value: GameRoomContextValue = {
    activityId,
    activity,
    loading,
    groupName,
    isHost,
    isApprovedJoiner,
    isPendingJoiner,
    isFinalized,
    isChatReadOnly,
    iAmReady,
    readyCount,
    rosterCount,
    pendingRequests,
    loadingRequests,
    approvedParticipants,
    hostUsername,
    hostUser,
    openPlayerProfile,
    courtName,
    timeLabel,
    statusLabel,
    finalizing,
    settingReady,
    leaving,
    onOpenDetails,
    handlePublishToDiscover,
    publishingToDiscover,
    handleApprove,
    handleReject,
    handleSetReady,
    handleLeaveGame,
    handleFinalize,
    handleScheduleNextGame,
    canScheduleNext,
    schedulingNext,
    viewerId: user?.id,
    isGroupMember,
    schedulePickerVisible,
    nextStartTime,
    setSchedulePickerVisible,
    setNextStartTime,
    confirmScheduleNext,
  };

  return (
    <GameRoomContext.Provider value={value}>
      {children}
      {schedulePickerVisible && activity && isHost ? (
        <View style={styles.schedulePickerSheet}>
          <Text style={styles.schedulePickerTitle}>Next game start time</Text>
          <DateTimePicker
            value={nextStartTime}
            mode="datetime"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              if (date) {
                setNextStartTime(date);
              }
            }}
          />
          <View style={styles.schedulePickerActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setSchedulePickerVisible(false)}
              disabled={schedulingNext}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, schedulingNext && styles.btnDisabled]}
              onPress={() => void confirmScheduleNext()}
              disabled={schedulingNext}
            >
              <Text style={styles.primaryBtnText}>
                {schedulingNext
                  ? 'Scheduling…'
                  : activity.regular_group_id
                    ? 'Post for crew'
                    : 'Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  onPress,
}: {
  label: string;
  ready: boolean;
  waiting?: boolean;
  role?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.avatar, ready && styles.avatarReady]}>
        <Text style={styles.avatarText}>{label.slice(0, 1).toUpperCase()}</Text>
        {ready ? <View style={styles.readyDot} /> : null}
        {!ready && waiting ? <View style={styles.waitingDot} /> : null}
      </View>
      <Text style={styles.avatarName} numberOfLines={1}>
        {label}
      </Text>
      {role ? <Text style={styles.avatarRole}>{role}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.avatarWrap} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.avatarWrap}>{content}</View>;
}

export const GameRoomHeader: React.FC = () => {
  const {
    activity,
    loading,
    isHost,
    isFinalized,
    readyCount,
    rosterCount,
    approvedParticipants,
    hostUsername,
    hostUser,
    openPlayerProfile,
    groupName,
    courtName,
    timeLabel,
    statusLabel,
    onOpenDetails,
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

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerCopy}>
          <Text style={styles.courtName} numberOfLines={1}>
            {groupName || courtName}
          </Text>
          <Text style={styles.timeLabel}>
            {groupName ? `${courtName} · ${timeLabel}` : timeLabel}
          </Text>
        </View>
        <View style={styles.headerBadges}>
          <View style={[styles.statusPill, statusStyle(statusLabel)]}>
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
          {onOpenDetails ? (
            <TouchableOpacity onPress={onOpenDetails} style={styles.moreBtn}>
              <Text style={styles.moreBtnText}>Details</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Text style={styles.rosterSummary}>
        {rosterCount} players · {readyCount} ready
        {isFinalized ? ' · Locked' : ''}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rosterStrip}
      >
        <RosterAvatar
          label={hostUsername}
          ready={isHost || isFinalized}
          role="Host"
          onPress={
            hostUser
              ? () => openPlayerProfile(hostUser, 'Host')
              : undefined
          }
        />
        {approvedParticipants.map((req) =>
          req.user ? (
            <RosterAvatar
              key={req.id}
              label={req.user.username}
              ready={Boolean(req.ready_at)}
              waiting={!isFinalized && !req.ready_at}
              onPress={() => openPlayerProfile(req.user!, 'Player')}
            />
          ) : null
        )}
      </ScrollView>
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
    isChatReadOnly,
    iAmReady,
    pendingRequests,
    loadingRequests,
    finalizing,
    settingReady,
    leaving,
    onOpenDetails,
    handlePublishToDiscover,
    publishingToDiscover,
    handleApprove,
    handleReject,
    handleSetReady,
    handleLeaveGame,
    handleFinalize,
    handleScheduleNextGame,
    canScheduleNext,
    schedulingNext,
    openPlayerProfile,
  } = useGameRoomContext();

  const [pendingExpanded, setPendingExpanded] = useState(pendingRequests.length > 0);

  useEffect(() => {
    if (pendingRequests.length > 0) {
      setPendingExpanded(true);
    }
  }, [pendingRequests.length]);

  if (!activity) {
    return null;
  }

  const hasOpenSpots = activityHasOpenSpots(activity);

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
      </View>
    );
  }

  const showScheduleNext = canScheduleNext;

  const showPlayerActions = !isFinalized && !isHost && isApprovedJoiner;
  const showHostFinalize = !isFinalized && isHost;
  const showPending = isHost && !isFinalized && pendingRequests.length > 0;
  const showListOnDiscover =
    isHost &&
    !isFinalized &&
    activity.visibility === 'invite_only' &&
    (activity.missing_players ?? 0) > 0;

  if (isFinalized) {
    return (
      <View style={styles.footer}>
        <View style={styles.finalizedStrip}>
          <Text style={styles.finalizedText}>Roster locked — see you on court!</Text>
        </View>
      </View>
    );
  }

  if (!showPlayerActions && !showHostFinalize && !showPending && isPendingJoiner) {
    return (
      <View style={styles.footer}>
        <View style={styles.waitingStrip}>
          <Text style={styles.waitingText}>
            Waiting for the host to approve your join request.
          </Text>
          {onOpenDetails ? (
            <TouchableOpacity onPress={onOpenDetails} style={styles.waitingDetailsBtn}>
              <Text style={styles.waitingDetailsText}>View game details</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  if (!showPlayerActions && !showHostFinalize && !showPending) {
    return null;
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

      {(showPlayerActions || showHostFinalize) && (
        <View style={styles.actionRow}>
          {showPlayerActions ? (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  styles.flexBtn,
                  (iAmReady || settingReady) && styles.btnDisabled,
                ]}
                onPress={() => void handleSetReady()}
                disabled={iAmReady || settingReady}
              >
                <Text style={styles.primaryBtnText}>
                  {iAmReady ? 'Ready ✓' : settingReady ? 'Saving…' : 'Mark Ready'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, leaving && styles.btnDisabled]}
                onPress={handleLeaveGame}
                disabled={leaving}
              >
                <Text style={styles.secondaryBtnText}>{leaving ? '…' : 'Leave'}</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {showHostFinalize ? (
            <TouchableOpacity
              style={[styles.primaryBtn, styles.flexBtn, finalizing && styles.btnDisabled]}
              onPress={handleFinalize}
              disabled={finalizing}
            >
              <Text style={styles.primaryBtnText}>
                {finalizing ? 'Finalizing…' : 'Finalize roster'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
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
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    paddingRight: 10,
  },
  courtName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  timeLabel: {
    marginTop: 2,
    fontSize: 13,
    color: '#555',
  },
  headerBadges: {
    alignItems: 'flex-end',
    gap: 6,
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
  moreBtn: {
    paddingVertical: 2,
  },
  moreBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  rosterSummary: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  rosterStrip: {
    paddingTop: 10,
    paddingBottom: 4,
    gap: 12,
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
  readyDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
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
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
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
  waitingText: {
    fontSize: 13,
    color: '#6b4e00',
    lineHeight: 18,
  },
  waitingDetailsBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  waitingDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
  flexBtn: {
    flex: 1,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: 72,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  schedulePickerSheet: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
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
    marginTop: 8,
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

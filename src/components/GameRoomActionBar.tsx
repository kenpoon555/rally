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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useActivity } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import {
  approveJoinRequest,
  finalizeGameCommitment,
  getActivityJoinRequests,
  leaveGame,
  rejectJoinRequest,
  scheduleNextGameFromActivity,
  setGameReady,
} from '../services/activityService';
import { supabase } from '../services/api/supabase';
import { JoinRequest } from '../types/activity';
import {
  formatActivityTime,
  getApprovedParticipants,
  getGameStatusLabel,
  canHostScheduleNextGame,
  isGameChatReadOnly,
  isGameChatInPostGameGrace,
} from '../utils/activityHelpers';
import { GAME_CHAT_ARCHIVE_GRACE_HOURS } from '../constants/gameChat';
import { getRegularGroupById } from '../services/regularGroupService';

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
  courtName: string;
  timeLabel: string;
  statusLabel: string;
  finalizing: boolean;
  settingReady: boolean;
  leaving: boolean;
  onOpenDetails?: () => void;
  onFindPlayers?: (sportType: string) => void;
  handleApprove: (requestId: string) => Promise<void>;
  handleReject: (requestId: string) => Promise<void>;
  handleSetReady: () => Promise<void>;
  handleLeaveGame: () => void;
  handleFinalize: () => void;
  handleScheduleNextGame: () => void;
  canScheduleNext: boolean;
  schedulingNext: boolean;
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
  onFindPlayers?: (sportType: string) => void;
  onLeftGame?: () => void;
  onScheduledNextGame?: (newActivityId: string) => void;
  children: React.ReactNode;
};

export const GameRoomProvider: React.FC<ProviderProps> = ({
  activityId,
  onOpenDetails,
  onFindPlayers,
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
  const [groupName, setGroupName] = useState<string | null>(null);

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
              onScheduledNextGame?.(newId);
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : 'Could not schedule next game.';
              Alert.alert('Schedule failed', message);
            } finally {
              setSchedulingNext(false);
            }
          },
        },
      ]
    );
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
  const canScheduleNext = Boolean(activity && canHostScheduleNextGame(activity, isHost));

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
    courtName,
    timeLabel,
    statusLabel,
    finalizing,
    settingReady,
    leaving,
    onOpenDetails,
    onFindPlayers,
    handleApprove,
    handleReject,
    handleSetReady,
    handleLeaveGame,
    handleFinalize,
    handleScheduleNextGame,
    canScheduleNext,
    schedulingNext,
  };

  return <GameRoomContext.Provider value={value}>{children}</GameRoomContext.Provider>;
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
  role,
}: {
  label: string;
  ready: boolean;
  role?: string;
}) {
  return (
    <View style={styles.avatarWrap}>
      <View style={[styles.avatar, ready && styles.avatarReady]}>
        <Text style={styles.avatarText}>{label.slice(0, 1).toUpperCase()}</Text>
        {ready ? <View style={styles.readyDot} /> : null}
      </View>
      <Text style={styles.avatarName} numberOfLines={1}>
        {label}
      </Text>
      {role ? <Text style={styles.avatarRole}>{role}</Text> : null}
    </View>
  );
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
    groupName,
    courtName,
    timeLabel,
    statusLabel,
    onOpenDetails,
  } = useGameRoomContext();

  if (loading && !activity) {
    return (
      <View style={styles.headerLoading}>
        <ActivityIndicator size="small" color="#007AFF" />
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
        <RosterAvatar label={hostUsername} ready={isHost || isFinalized} role="Host" />
        {approvedParticipants.map((req) =>
          req.user ? (
            <RosterAvatar
              key={req.id}
              label={req.user.username}
              ready={Boolean(req.ready_at)}
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
    onFindPlayers,
    handleApprove,
    handleReject,
    handleSetReady,
    handleLeaveGame,
    handleFinalize,
    handleScheduleNextGame,
    canScheduleNext,
    schedulingNext,
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
  const showFindPlayers =
    isHost && !isFinalized && (activity.missing_players ?? 0) > 0 && Boolean(onFindPlayers);

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
      {showFindPlayers ? (
        <TouchableOpacity
          style={[styles.primaryBtn, styles.scheduleBtn]}
          onPress={() => onFindPlayers?.(activity.sport_type)}
        >
          <Text style={styles.primaryBtnText}>
            Find players ({activity.missing_players} spot
            {activity.missing_players === 1 ? '' : 's'} open)
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
            </Text>
            <Text style={styles.pendingToggle}>{pendingExpanded ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
          {pendingExpanded ? (
            loadingRequests ? (
              <ActivityIndicator size="small" color="#007AFF" style={styles.pendingLoader} />
            ) : (
              pendingRequests.map((req) => (
                <View key={req.id} style={styles.pendingRow}>
                  <Text style={styles.pendingName}>{req.user?.username || 'Player'}</Text>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => void handleApprove(req.id)}
                    >
                      <Text style={styles.approveBtnText}>Approve</Text>
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
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
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
    backgroundColor: '#e8f1ff',
  },
  statusFinalized: {
    backgroundColor: '#ddf8e8',
  },
  statusDefault: {
    backgroundColor: '#f0f0f0',
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
    color: '#007AFF',
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
    color: '#007AFF',
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
    color: '#007AFF',
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
  pendingName: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    marginRight: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useActivity } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import JoinRequestButton from '../../components/JoinRequestButton';
import {
  finalizeFlexibleActivity,
  getActivityCandidateLocations,
  getActivityJoinRequests,
  upsertParticipantPreference,
  approveJoinRequest,
  rejectJoinRequest,
} from '../../services/activityService';
import { ActivityCandidateLocation, JoinRequest } from '../../types/activity';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROUTES } from '../../constants/routes';
import {
  createActivityGroupConversation,
  getActivityGroupConversationId,
} from '../../services/chatService';
import {
  canViewProfileIdentity,
  getProfileReviewStats,
  submitPlayerReview,
} from '../../services/reviewService';
import { ProfileReviewStats } from '../../types/review';

type MainStackParamList = {
  MainTabs: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
  ChatThread: { conversationId: string; title?: string };
};

type Props = NativeStackScreenProps<MainStackParamList, 'ActivityDetail'>;

const ActivityDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId } = route.params;
  const { activity, loading, refetch } = useActivity(activityId);
  const { user } = useAuth();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submittingPreference, setSubmittingPreference] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
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
  const [submittingReview, setSubmittingReview] = useState(false);

  const isHost = user && activity && user.id === activity.user_id;

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
      alert(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectJoinRequest(requestId);
      await loadJoinRequests();
    } catch (error: any) {
      alert(error.message || 'Failed to reject request');
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
    if (!user?.id || !activity?.user_id || user.id === activity.user_id) {
      return;
    }

    setSubmittingReview(true);
    try {
      await submitPlayerReview({
        activity_id: activity.id,
        reviewer_id: user.id,
        reviewed_id: activity.user_id,
        friendliness_rating: friendliness,
        physicality_rating: physicality,
        overall_vibe_rating: vibe,
        comment: reviewComment.trim() || undefined,
      });
      Alert.alert('Thanks', 'Your review has been submitted.');
      const updatedStats = await getProfileReviewStats(activity.user_id);
      setReviewStats(updatedStats);
      setReviewComment('');
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
      const result = await finalizeFlexibleActivity(activity.id, activity.location_id || undefined);
      Alert.alert(
        'Activity finalized',
        `Start: ${new Date(result.final_start_time).toLocaleString()}`
      );
      refetch();
    } catch (error: any) {
      Alert.alert('Finalize failed', error?.message || 'Could not finalize activity.');
    } finally {
      setFinalizing(false);
    }
  };

  const handleOpenGroupChat = async () => {
    if (!activity) {
      return;
    }
    setOpeningChat(true);
    try {
      let conversationId = await getActivityGroupConversationId(activity.id);
      if (!conversationId) {
        conversationId = await createActivityGroupConversation(activity.id);
      }
      navigation.navigate(ROUTES.CHAT.THREAD as any, {
        conversationId,
        title: 'Activity Chat',
      });
    } catch (error: any) {
      Alert.alert('Chat unavailable', error?.message || 'Could not open activity chat.');
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activity.sport_type}</Text>
      <Text style={styles.location}>
        {activity.location?.name || 'Unknown location'}
      </Text>
      <Text style={styles.players}>
        {activity.player_count} players
        {activity.missing_players && ` (${activity.missing_players} needed)`}
      </Text>
      {activity.user && (
        <Text style={styles.host}>
          Host:{' '}
          {canSeeHostIdentity ? activity.user.username : 'Anonymous player'}
        </Text>
      )}
      <Text style={styles.statusText}>
        Match status: {activity.match_status || 'open'} ({activity.scheduling_mode || 'fixed'})
      </Text>
      {!!activity.preference_deadline && activity.match_status === 'collecting' && (
        <Text style={styles.deadlineText}>
          Preference deadline: {new Date(activity.preference_deadline).toLocaleString()}
        </Text>
      )}

      {!isHost && <JoinRequestButton activity={activity} onRequestSent={refetch} />}

      {!isHost && activity.scheduling_mode === 'flex' && (
        <View style={styles.preferenceCard}>
          <Text style={styles.preferenceTitle}>Submit Your Preference</Text>
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
              {submittingPreference ? 'Submitting...' : 'Submit Availability'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isHost && activity.scheduling_mode === 'flex' && activity.match_status !== 'finalized' && (
        <TouchableOpacity
          style={[styles.utilityButton, finalizing && styles.utilityButtonDisabled]}
          onPress={handleFinalizeMatch}
          disabled={finalizing}
        >
          <Text style={styles.utilityButtonText}>
            {finalizing ? 'Finalizing...' : 'Finalize Best Match'}
          </Text>
        </TouchableOpacity>
      )}

      {activity.match_status === 'finalized' && (
        <TouchableOpacity
          style={[styles.utilityButton, openingChat && styles.utilityButtonDisabled]}
          onPress={handleOpenGroupChat}
          disabled={openingChat}
        >
          <Text style={styles.utilityButtonText}>
            {openingChat ? 'Opening...' : 'Open Activity Chat'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.reviewPanel}>
        <Text style={styles.sectionTitle}>Host Review Snapshot</Text>
        <Text style={styles.reviewMeta}>
          Reviews: {reviewStats?.review_count || 0}
          {typeof reviewStats?.visible_score === 'number'
            ? ` • Score: ${reviewStats.visible_score.toFixed(2)}`
            : ' • Score hidden until 5 reviews'}
        </Text>
        {!isHost && (
          <>
            <Text style={styles.reviewMeta}>Rate host vibe after the match:</Text>
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
      </View>

      {isHost && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Join Requests</Text>
          {loadingRequests ? (
            <Text>Loading requests...</Text>
          ) : joinRequests.length === 0 ? (
            <Text style={styles.emptyText}>No pending requests</Text>
          ) : (
            <FlatList
              data={joinRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <Text style={styles.requestUser}>
                    {activity.match_status === 'finalized'
                      ? item.user?.username || 'Unknown user'
                      : 'Anonymous player'}
                  </Text>
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
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  players: {
    fontSize: 16,
    marginBottom: 8,
  },
  host: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  deadlineText: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 12,
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
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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

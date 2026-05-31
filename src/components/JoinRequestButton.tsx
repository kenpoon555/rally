import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Activity } from '../types/activity';
import { useAuth } from '../hooks/useAuth';
import { createJoinRequest } from '../services/activityService';

interface JoinRequestButtonProps {
  activity: Activity;
  onRequestSent?: () => void;
}

const JoinRequestButton: React.FC<JoinRequestButtonProps> = ({
  activity,
  onRequestSent,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>(
    'none'
  );

  useEffect(() => {
    if (!user) {
      setJoinStatus('none');
      return;
    }
    const mine = activity.join_requests?.find((r) => r.user_id === user.id);
    if (!mine) {
      setJoinStatus('none');
      return;
    }
    if (mine.status === 'approved') {
      setJoinStatus('approved');
    } else if (mine.status === 'rejected') {
      setJoinStatus('rejected');
    } else {
      setJoinStatus('pending');
    }
  }, [activity.join_requests, user]);

  const handleJoin = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      await createJoinRequest(activity.id, user.id);
      setJoinStatus('pending');
      onRequestSent?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send join request';
      Alert.alert('Could not join', message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === activity.user_id) {
    return null;
  }

  if (activity.match_status === 'finalized' || activity.match_status === 'cancelled') {
    const mine = activity.join_requests?.find((r) => r.user_id === user.id);
    if (mine?.status === 'approved') {
      return (
        <View style={styles.container}>
          <Text style={styles.approvedText}>You're in this game</Text>
        </View>
      );
    }
    return null;
  }

  if (joinStatus === 'approved') {
    return (
      <View style={styles.container}>
        <Text style={styles.approvedText}>You're in this game</Text>
      </View>
    );
  }

  if (joinStatus === 'pending') {
    return (
      <View style={styles.container}>
        <Text style={styles.requestedText}>Join request sent — waiting for host</Text>
      </View>
    );
  }

  if (joinStatus === 'rejected') {
    return (
      <View style={styles.container}>
        <Text style={styles.rejectedText}>Host declined your request</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleJoin}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Request to Join</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestedText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  approvedText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectedText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default JoinRequestButton;

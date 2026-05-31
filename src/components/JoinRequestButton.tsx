import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Activity } from '../types/activity';
import { useAuth } from '../hooks/useAuth';
import { createJoinRequest } from '../services/activityService';
import { activityHasOpenSpots } from '../utils/activityHelpers';
import { Button } from './ui';
import { colors, spacing, typography } from '../constants/theme';

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

  if (!activityHasOpenSpots(activity)) {
    return (
      <View style={styles.container}>
        <Text style={styles.fullText}>Game full — check back if someone leaves</Text>
      </View>
    );
  }

  return (
    <Button
      title="Request to Join"
      onPress={handleJoin}
      loading={loading}
      fullWidth
      style={styles.button}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
  requestedText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  approvedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectedText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fullText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default JoinRequestButton;

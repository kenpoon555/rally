import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
  const [requested, setRequested] = useState(false);

  const handleJoin = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await createJoinRequest(activity.id, user.id);
      setRequested(true);
      onRequestSent?.();
    } catch (error: any) {
      console.error('Error creating join request:', error);
      alert(error.message || 'Failed to send join request');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === activity.user_id) {
    return null; // Don't show for activity host
  }

  if (requested) {
    return (
      <View style={styles.container}>
        <Text style={styles.requestedText}>Join request sent</Text>
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
});

export default JoinRequestButton;

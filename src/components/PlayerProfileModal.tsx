import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { getProfileReviewStats } from '../services/reviewService';
import { ProfileReviewStats } from '../types/review';
import SafetyActionsSheet from './SafetyActionsSheet';
import { ProfileTrustStats, ReportContextType } from '../types/safety';
import { getProfileTrustStats } from '../services/safetyService';
import { colors } from '../constants/theme';

export interface PlayerProfilePreview {
  id: string;
  username: string;
  profile_photo_url?: string;
  roleLabel?: string;
}

interface PlayerProfileModalProps {
  visible: boolean;
  player: PlayerProfilePreview | null;
  onClose: () => void;
  currentUserId?: string;
  contextType?: ReportContextType;
  contextId?: string;
  showNoShow?: boolean;
  /** When set, shows a primary action (e.g. open DM from Friends). */
  onMessage?: () => void;
  /** When set, shows remove-friend (Friends list context). */
  onRemoveFriend?: () => void;
}

const AVATAR_COLORS = ['#b0c4de', '#c4b0de', '#b0deb0', '#deb0b0', '#b0d5de'];

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  visible,
  player,
  onClose,
  currentUserId,
  contextType = 'profile',
  contextId,
  showNoShow = false,
  onMessage,
  onRemoveFriend,
}) => {
  const [stats, setStats] = useState<ProfileReviewStats | null>(null);
  const [trustStats, setTrustStats] = useState<ProfileTrustStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

  useEffect(() => {
    if (!visible || !player?.id) {
      setStats(null);
      setTrustStats(null);
      return;
    }
    setLoading(true);
    Promise.all([
      getProfileReviewStats(player.id).catch(() => null),
      getProfileTrustStats(player.id).catch(() => null),
    ])
      .then(([review, trust]) => {
        setStats(review);
        setTrustStats(trust);
      })
      .finally(() => setLoading(false));
  }, [visible, player?.id]);

  if (!player) {
    return null;
  }

  const initials = (player.username || '?').slice(0, 2).toUpperCase();
  const avatarBg = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
          {player.profile_photo_url ? (
            <Image source={{ uri: player.profile_photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{player.username}</Text>
          {player.roleLabel ? <Text style={styles.role}>{player.roleLabel}</Text> : null}

          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.statsBox}>
              <Text style={styles.statsTitle}>Player ratings</Text>
              <Text style={styles.statsLine}>
                {stats?.review_count || 0} review{(stats?.review_count || 0) === 1 ? '' : 's'}
              </Text>
              <Text style={styles.statsLine}>
                {typeof stats?.visible_score === 'number'
                  ? `Rating: ${stats.visible_score.toFixed(1)} / 5`
                  : 'Public rating shows after 5 reviews'}
              </Text>
              {trustStats && trustStats.no_show_count > 0 ? (
                <Text style={styles.statsLine}>
                  Recorded no-shows: {trustStats.no_show_count}
                </Text>
              ) : null}
              {trustStats && trustStats.flake_count > 0 ? (
                <Text style={styles.statsLine}>
                  Late exits before finalize: {trustStats.flake_count}
                </Text>
              ) : null}
            </View>
          )}

          {onMessage ? (
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => {
                onClose();
                onMessage();
              }}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          ) : null}

          {onRemoveFriend ? (
            <TouchableOpacity style={styles.removeFriendButton} onPress={onRemoveFriend}>
              <Text style={styles.removeFriendButtonText}>Remove friend</Text>
            </TouchableOpacity>
          ) : null}

          {currentUserId && player.id !== currentUserId ? (
            <TouchableOpacity style={styles.safetyButton} onPress={() => setSafetyOpen(true)}>
              <Text style={styles.safetyButtonText}>Report or block</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>

      {currentUserId && player.id !== currentUserId ? (
        <SafetyActionsSheet
          visible={safetyOpen}
          onClose={() => setSafetyOpen(false)}
          currentUserId={currentUserId}
          targetUserId={player.id}
          targetUsername={player.username}
          contextType={contextType}
          contextId={contextId}
          showNoShow={showNoShow}
          onBlocked={onClose}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  role: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  statsBox: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#f5f8fc',
    borderRadius: 12,
    padding: 14,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  statsLine: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  messageButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  messageButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  removeFriendButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  removeFriendButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  safetyButton: {
    marginTop: 16,
    paddingVertical: 10,
  },
  safetyButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerProfileModal;

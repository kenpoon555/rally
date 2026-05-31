import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getActivityConversationAnnouncement,
  setGameRoomAnnouncement,
} from '../services/chatService';
import { colors } from '../constants/theme';

type Props = {
  activityId: string;
  isHost: boolean;
  costNote?: string | null;
};

const GameRoomAnnouncementBanner: React.FC<Props> = ({ activityId, isHost, costNote }) => {
  const [pinnedText, setPinnedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const row = await getActivityConversationAnnouncement(activityId);
      setPinnedText(row?.pinned_announcement ?? null);
    } catch {
      setPinnedText(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAnnouncement = async (text: string | null) => {
    setSaving(true);
    try {
      await setGameRoomAnnouncement(activityId, text);
      setPinnedText(text);
      setEditing(false);
      setDraft('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not update announcement.';
      Alert.alert('Announcement', message);
    } finally {
      setSaving(false);
    }
  };

  const showCost = Boolean(costNote?.trim());
  const showPinned = Boolean(pinnedText?.trim());
  const showBanner = showCost || showPinned;

  if (loading && !showCost) {
    return null;
  }

  if (!showBanner && !isHost) {
    return null;
  }

  if (editing) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>Pin announcement (stays at top until you remove it)</Text>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. BYO drinks · court ~$8/person"
          multiline
          maxLength={280}
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setEditing(false);
              setDraft('');
            }}
            disabled={saving}
          >
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={() => void saveAnnouncement(draft.trim() || null)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        {pinnedText ? (
          <TouchableOpacity onPress={() => void saveAnnouncement(null)} disabled={saving}>
            <Text style={styles.removeText}>Remove pinned announcement</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {showCost ? (
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Cost</Text>
          <Text style={styles.costText}>{costNote}</Text>
        </View>
      ) : null}
      {showPinned ? (
        <View style={styles.pinnedRow}>
          <Text style={styles.pinnedLabel}>Announcement</Text>
          <Text style={styles.pinnedText}>{pinnedText}</Text>
        </View>
      ) : null}
      {isHost ? (
        <TouchableOpacity
          onPress={() => {
            setDraft(pinnedText || costNote || '');
            setEditing(true);
          }}
          style={styles.editLink}
        >
          <Text style={styles.editLinkText}>
            {showPinned ? 'Edit announcement' : 'Pin announcement for chat'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff8e6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8d9a8',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  costRow: {
    marginBottom: 6,
  },
  costLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a6d1d',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  costText: {
    fontSize: 14,
    color: '#3d3418',
    lineHeight: 20,
  },
  pinnedRow: {
    marginBottom: 4,
  },
  pinnedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a6d1d',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  pinnedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1508',
    lineHeight: 20,
  },
  editLink: {
    marginTop: 6,
  },
  editLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    fontSize: 15,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  removeText: {
    marginTop: 10,
    fontSize: 13,
    color: '#b42318',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GameRoomAnnouncementBanner;

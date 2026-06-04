import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SportType } from '../constants/sports';
import { ActivityLocation } from '../types/location';
import { addCourtFromPlacesSearch } from '../services/courtService';
import { colors, radius, spacing } from '../constants/theme';

type Props = {
  visible: boolean;
  sportType: SportType;
  near?: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onAdded: (location: ActivityLocation) => void;
};

export function AddCourtSheet({ visible, sportType, near, onClose, onAdded }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const saved = await addCourtFromPlacesSearch(
        query,
        sportType,
        near ?? undefined
      );
      onAdded(saved);
      setQuery('');
      onClose();
      Alert.alert('Court added', `${saved.name} is ready — you can host a game there now.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not add court.';
      Alert.alert('Add court', message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Add a court</Text>
          <Text style={styles.subtitle}>
            Search by park, recreation center, or address. We save it for everyone nearby.
          </Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={`e.g. ${sportType} courts near me`}
            autoCapitalize="words"
            editable={!searching}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, searching && styles.btnDisabled]}
            onPress={() => void handleSearch()}
            disabled={searching || !query.trim()}
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Search and add</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={searching}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  input: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});

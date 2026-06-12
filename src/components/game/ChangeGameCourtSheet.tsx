import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { ActivityLocation } from '../../types/location';
import { hostUpdateGameCourt } from '../../services/activityService';
import { getNearbyActivityLocations } from '../../services/locationService';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { BETA_REGION } from '../../constants/betaRegion';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { KeyboardSafeView } from '../ui';

type Props = {
  visible: boolean;
  activity: Activity;
  onClose: () => void;
  onUpdated: () => void;
};

export function ChangeGameCourtSheet({ visible, activity, onClose, onUpdated }: Props) {
  const [courts, setCourts] = useState<ActivityLocation[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [savingCourtId, setSavingCourtId] = useState<string | null>(null);

  const courtCoords = useMemo(() => {
    if (activity.location) {
      return parseGeographyCoordinates(activity.location.location);
    }
    return [BETA_REGION.center.longitude, BETA_REGION.center.latitude] as const;
  }, [activity.location]);

  const loadCourts = useCallback(async () => {
    setLoadingCourts(true);
    try {
      const [lng, lat] = courtCoords;
      const nearby = await getNearbyActivityLocations(lat, lng, 25000);
      const sportMatches = nearby.filter(
        (row) => row.sport_type?.toLowerCase() === activity.sport_type.toLowerCase()
      );
      const list = sportMatches.length > 0 ? sportMatches : nearby;
      const currentId = activity.location_id;
      const merged =
        currentId && !list.some((row) => row.id === currentId) && activity.location
          ? [activity.location, ...list]
          : list;
      setCourts(merged.slice(0, 20));
    } catch {
      setCourts(activity.location ? [activity.location] : []);
    } finally {
      setLoadingCourts(false);
    }
  }, [activity.location, activity.location_id, activity.sport_type, courtCoords]);

  useEffect(() => {
    if (visible) {
      void loadCourts();
    }
  }, [visible, loadCourts]);

  const saveCourt = async (court: ActivityLocation) => {
    if (court.id === activity.location_id) {
      onClose();
      return;
    }
    setSavingCourtId(court.id);
    try {
      await hostUpdateGameCourt(activity.id, court.id, court.name);
      onUpdated();
      onClose();
      Alert.alert('Court updated', PRODUCT_COPY.gameScheduleChangePosted);
    } catch (error: unknown) {
      Alert.alert(
        'Could not update court',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setSavingCourtId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardSafeView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{PRODUCT_COPY.changeGameCourt}</Text>
            <Text style={styles.subtitle}>{PRODUCT_COPY.editGameScheduleHint}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loadingCourts ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {courts.map((court) => {
              const selected = court.id === activity.location_id;
              const busy = savingCourtId === court.id;
              return (
                <TouchableOpacity
                  key={court.id}
                  style={[styles.courtRow, selected && styles.courtRowSelected]}
                  onPress={() => void saveCourt(court)}
                  disabled={busy}
                >
                  <View style={styles.courtIcon}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={selected ? colors.primaryDark : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[styles.courtName, selected && styles.courtNameSelected]}
                    numberOfLines={2}
                  >
                    {court.name}
                  </Text>
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primaryDark} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  courtRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  courtIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  courtNameSelected: {
    color: colors.primaryDark,
  },
});

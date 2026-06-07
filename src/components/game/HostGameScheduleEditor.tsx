import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Activity } from '../../types/activity';
import { ActivityLocation } from '../../types/location';
import { ScheduleDateTimePicker } from '../ScheduleDateTimePicker';
import { hostUpdateGameCourt, hostUpdateGameStartTime } from '../../services/activityService';
import { getNearbyActivityLocations } from '../../services/locationService';
import { parseGeographyCoordinates } from '../../utils/activityLocationGeo';
import { BETA_REGION } from '../../constants/betaRegion';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  activity: Activity;
  onUpdated: () => void;
};

export const HostGameScheduleEditor: React.FC<Props> = ({ activity, onUpdated }) => {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [draftStartTime, setDraftStartTime] = useState(
    () => new Date(activity.start_time ?? Date.now())
  );
  const [savingTime, setSavingTime] = useState(false);
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
      setCourts(merged.slice(0, 12));
    } catch {
      setCourts(activity.location ? [activity.location] : []);
    } finally {
      setLoadingCourts(false);
    }
  }, [activity.location, activity.location_id, activity.sport_type, courtCoords]);

  useEffect(() => {
    void loadCourts();
  }, [loadCourts]);

  useEffect(() => {
    if (activity.start_time) {
      setDraftStartTime(new Date(activity.start_time));
    }
  }, [activity.start_time]);

  const saveTime = async (date: Date) => {
    setSavingTime(true);
    try {
      await hostUpdateGameStartTime(activity.id, date);
      setTimePickerVisible(false);
      onUpdated();
      Alert.alert('Time updated', PRODUCT_COPY.gameScheduleChangePosted);
    } catch (error: unknown) {
      Alert.alert(
        'Could not update time',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setSavingTime(false);
    }
  };

  const saveCourt = async (court: ActivityLocation) => {
    if (court.id === activity.location_id) {
      return;
    }
    setSavingCourtId(court.id);
    try {
      await hostUpdateGameCourt(activity.id, court.id, court.name);
      onUpdated();
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
    <View style={styles.block}>
      <Text style={styles.title}>{PRODUCT_COPY.editGameScheduleTitle}</Text>
      <Text style={styles.hint}>{PRODUCT_COPY.editGameScheduleHint}</Text>

      <TouchableOpacity
        style={[styles.secondaryButton, savingTime && styles.buttonDisabled]}
        onPress={() => setTimePickerVisible(true)}
        disabled={savingTime}
      >
        <Text style={styles.secondaryButtonText}>
          {savingTime ? 'Saving…' : PRODUCT_COPY.changeGameTime}
        </Text>
      </TouchableOpacity>

      {timePickerVisible ? (
        <>
          <ScheduleDateTimePicker
            visible
            autoOpen
            value={draftStartTime}
            title={PRODUCT_COPY.changeGameTime}
            onChange={(date) => {
              setDraftStartTime(date);
              if (Platform.OS === 'android') {
                setTimePickerVisible(false);
                void saveTime(date);
              }
            }}
            onDismiss={() => setTimePickerVisible(false)}
          />
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[styles.secondaryButton, savingTime && styles.buttonDisabled]}
              onPress={() => void saveTime(draftStartTime)}
              disabled={savingTime}
            >
              <Text style={styles.secondaryButtonText}>
                {savingTime ? 'Saving…' : 'Save new time'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}

      <Text style={styles.courtLabel}>{PRODUCT_COPY.changeGameCourt}</Text>
      {loadingCourts ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.courtLoader} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courtRow}
        >
          {courts.map((court) => {
            const selected = court.id === activity.location_id;
            const busy = savingCourtId === court.id;
            return (
              <TouchableOpacity
                key={court.id}
                style={[styles.courtChip, selected && styles.courtChipSelected]}
                onPress={() => void saveCourt(court)}
                disabled={busy || selected}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[styles.courtChipText, selected && styles.courtChipTextSelected]}
                    numberOfLines={2}
                  >
                    {court.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  courtLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  courtLoader: {
    alignSelf: 'flex-start',
    marginVertical: spacing.sm,
  },
  courtRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  courtChip: {
    maxWidth: 180,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  courtChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  courtChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  courtChipTextSelected: {
    color: colors.primary,
  },
});

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  defaultRallyGameStartTime,
  GameModeDefinition,
  PICKUP_GAME_MODE,
  resolveGameModesForSport,
} from '../../constants/gameModes';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { RegularGroup } from '../../types/regularGroup';
import {
  getDefaultDurationFromTemplate,
  getListingTitleHint,
  getSportTemplate,
} from '../../services/sportTemplateService';
import {
  clampRosterMax,
  clampRosterMin,
  formatRosterExpectation,
  getSportRosterDefaults,
} from '../../constants/sports';
import { scheduleGroupNextGame, updateActivity } from '../../services/activityService';
import { createMiniTournament } from '../../services/miniTournamentService';
import { supabase } from '../../services/api/supabase';
import { ScheduleDateTimePicker, snapDateToMinuteInterval } from '../ScheduleDateTimePicker';
import { Button, KeyboardSafeView, keyboardAwareScrollProps } from '../ui';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  group: RegularGroup;
  onClose: () => void;
  onCreated: (result: { kind: 'activity' | 'tournament'; id: string }) => void;
};

const RALLY_GAME_MINUTE_INTERVAL = 30;

export const CreateRallyGameSheet: React.FC<Props> = ({
  visible,
  group,
  onClose,
  onCreated,
}) => {
  const [modes, setModes] = useState<GameModeDefinition[]>([PICKUP_GAME_MODE]);
  const [selectedModeId, setSelectedModeId] = useState(PICKUP_GAME_MODE.id);
  const [startTime, setStartTime] = useState(() =>
    snapDateToMinuteInterval(defaultRallyGameStartTime(), RALLY_GAME_MINUTE_INTERVAL)
  );
  const [rosterMin, setRosterMin] = useState(4);
  const [rosterMax, setRosterMax] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [title, setTitle] = useState('');
  const [titleHint, setTitleHint] = useState<string | null>(null);
  const [courtLabel, setCourtLabel] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedMode = useMemo(
    () => modes.find((mode) => mode.id === selectedModeId) ?? PICKUP_GAME_MODE,
    [modes, selectedModeId]
  );
  const isPickup = selectedMode.kind === 'activity';

  const rosterDefaults = useMemo(
    () => getSportRosterDefaults(group.sport_type),
    [group.sport_type]
  );
  const rosterExpectationCopy = formatRosterExpectation(rosterMin, rosterMax);

  const resetForm = useCallback(async () => {
    setStartTime(
      snapDateToMinuteInterval(defaultRallyGameStartTime(), RALLY_GAME_MINUTE_INTERVAL)
    );
    setTitle('');
    setSelectedModeId(PICKUP_GAME_MODE.id);
    setLoadingTemplate(true);
    try {
      const template = await getSportTemplate(group.sport_type);
      const resolvedModes = resolveGameModesForSport(group.sport_type, template);
      setModes(resolvedModes);
      const defaults = getSportRosterDefaults(group.sport_type);
      setRosterMin(defaults.defaultMin);
      setRosterMax(defaults.defaultMax);
      setDurationMinutes(
        template?.default_duration_minutes ??
          (await getDefaultDurationFromTemplate(group.sport_type))
      );
      setTitleHint(await getListingTitleHint(group.sport_type));
    } catch {
      setModes(resolveGameModesForSport(group.sport_type, null));
      const defaults = getSportRosterDefaults(group.sport_type);
      setRosterMin(defaults.defaultMin);
      setRosterMax(defaults.defaultMax);
      setDurationMinutes(90);
      setTitleHint(null);
    } finally {
      setLoadingTemplate(false);
    }
  }, [group.sport_type]);

  const loadCourtLabel = useCallback(async () => {
    if (!group.default_location_id) {
      setCourtLabel(null);
      return;
    }
    const { data } = await supabase
      .from('activity_locations')
      .select('name')
      .eq('id', group.default_location_id)
      .maybeSingle();
    setCourtLabel(data?.name ?? null);
  }, [group.default_location_id]);

  useEffect(() => {
    if (visible) {
      void resetForm();
      void loadCourtLabel();
    }
  }, [visible, resetForm, loadCourtLabel]);

  const handleClose = () => {
    onClose();
  };

  const adjustRosterMin = (delta: number) => {
    setRosterMin((prev) => {
      const next = clampRosterMin(group.sport_type, prev + delta, rosterMax);
      if (next > rosterMax) {
        setRosterMax(next);
      }
      return next;
    });
  };

  const adjustRosterMax = (delta: number) => {
    setRosterMax((prev) => {
      const next = clampRosterMax(group.sport_type, prev + delta, rosterMin);
      if (next < rosterMin) {
        setRosterMin(next);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (startTime.getTime() <= Date.now()) {
      Alert.alert(PRODUCT_COPY.createGame, 'Pick a time in the future.');
      return;
    }

    setCreating(true);
    try {
      if (selectedMode.kind === 'tournament') {
        const tournamentId = await createMiniTournament(
          group.id,
          title.trim() || undefined
        );
        onCreated({ kind: 'tournament', id: tournamentId });
        onClose();
        return;
      }

      const activityId = await scheduleGroupNextGame(
        group.id,
        startTime.toISOString(),
        rosterMax,
        durationMinutes,
        rosterMin
      );

      const trimmedTitle = title.trim();
      if (trimmedTitle) {
        await updateActivity(activityId, { listing_title: trimmedTitle });
      }

      onCreated({ kind: 'activity', id: activityId });
      onClose();
    } catch (error: unknown) {
      Alert.alert(
        PRODUCT_COPY.createGame,
        error instanceof Error ? error.message : 'Could not create. Try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  const whenLabel = startTime.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardSafeView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{PRODUCT_COPY.createGame}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} {...keyboardAwareScrollProps}>
          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.modeRow}>
            {modes.map((mode) => {
              const selected = mode.id === selectedModeId;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.modeChip, selected && styles.modeChipSelected]}
                  onPress={() => setSelectedModeId(mode.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modeChipText, selected && styles.modeChipTextSelected]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.modeHint}>{selectedMode.description}</Text>

          {isPickup ? (
            <>
              <Text style={styles.sectionLabel}>When</Text>
              <View style={styles.fieldCard}>
                <ScheduleDateTimePicker
                  visible
                  value={startTime}
                  minuteInterval={RALLY_GAME_MINUTE_INTERVAL}
                  onChange={(date) =>
                    setStartTime(snapDateToMinuteInterval(date, RALLY_GAME_MINUTE_INTERVAL))
                  }
                />
                <Text style={styles.fieldMeta}>{whenLabel}</Text>
              </View>

              <Text style={styles.sectionLabel}>Where</Text>
              <View style={styles.fieldCard}>
                <View style={styles.fieldRow}>
                  <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.fieldValue}>
                    {courtLabel ?? PRODUCT_COPY.createGameCourtTbd}
                  </Text>
                </View>
                {!courtLabel ? (
                  <Text style={styles.fieldHint}>{PRODUCT_COPY.createGameCourtHint}</Text>
                ) : null}
              </View>

              <Text style={styles.sectionLabel}>{PRODUCT_COPY.rosterSection}</Text>
              <View style={styles.fieldCard}>
                <View style={styles.rosterRow}>
                  <Text style={styles.rosterRowLabel}>{PRODUCT_COPY.rosterLockAt}</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustRosterMin(-1)}
                      disabled={rosterMin <= rosterDefaults.floorMin}
                    >
                      <Ionicons name="remove" size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>
                      {rosterMin} player{rosterMin === 1 ? '' : 's'}
                    </Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustRosterMin(1)}
                      disabled={rosterMin >= rosterMax}
                    >
                      <Ionicons name="add" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.rosterRow}>
                  <Text style={styles.rosterRowLabel}>{PRODUCT_COPY.rosterUpTo}</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustRosterMax(-1)}
                      disabled={rosterMax <= rosterMin}
                    >
                      <Ionicons name="remove" size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>
                      {rosterMax} player{rosterMax === 1 ? '' : 's'}
                    </Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustRosterMax(1)}
                      disabled={rosterMax >= rosterDefaults.ceilingMax}
                    >
                      <Ionicons name="add" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.fieldMeta}>{rosterExpectationCopy}</Text>
                <Text style={styles.fieldHint}>{PRODUCT_COPY.rosterLockHint}</Text>
                <Text style={styles.fieldMeta}>
                  {durationMinutes} min · {group.sport_type}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Title (optional)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={titleHint ?? 'Saturday doubles'}
                placeholderTextColor={colors.textTertiary}
                maxLength={80}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={`${group.name} bracket`}
                placeholderTextColor={colors.textTertiary}
                maxLength={80}
              />
            </>
          )}

          <Button
            title={creating ? 'Creating…' : PRODUCT_COPY.createGame}
            onPress={() => void handleCreate()}
            loading={creating}
            disabled={creating || loadingTemplate}
            style={styles.createBtn}
          />
        </ScrollView>
      </KeyboardSafeView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: {
    ...typography.body,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.text,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeChipText: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  modeChipTextSelected: {
    color: colors.primaryDark,
  },
  modeHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  fieldCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  fieldMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flex: 1,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rosterRowLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    minWidth: 72,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepperValue: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  createBtn: {
    marginTop: spacing.xl,
  },
});

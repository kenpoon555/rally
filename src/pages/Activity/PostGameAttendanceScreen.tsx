import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useActivity } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import { submitGameAttendance } from '../../services/activityService';
import { getGameRecap, shareGameRecap } from '../../services/gameRecapService';
import { Button, ScreenHeader } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';
import { formatActivityTime, getApprovedParticipants } from '../../utils/activityHelpers';

export type PostGameAttendanceParams = {
  PostGameAttendance: { activityId: string };
};

type Props = NativeStackScreenProps<PostGameAttendanceParams, 'PostGameAttendance'>;

const PostGameAttendanceScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activityId } = route.params;
  const { user } = useAuth();
  const { activity, loading } = useActivity(activityId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const participants = activity ? getApprovedParticipants(activity) : [];
  const isHost = activity?.user_id === user?.id;

  useEffect(() => {
    if (!activity || !isHost) return;
    const readyIds = getApprovedParticipants(activity)
      .filter((p) => p.ready_at)
      .map((p) => p.user_id);
    setSelected(new Set(readyIds));
  }, [activity, isHost]);

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!activity) return;
    setSaving(true);
    try {
      const recapId = await submitGameAttendance(activity.id, Array.from(selected));
      if (recapId) {
        Alert.alert('Saved', 'Attendance recorded. Share the recap with your crew?', [
          {
            text: 'Share recap',
            onPress: () => {
              void (async () => {
                try {
                  const recap = await getGameRecap(recapId);
                  await shareGameRecap(recap);
                } catch {
                  // Share sheet dismissed or failed — still exit.
                }
                navigation.goBack();
              })();
            },
          },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Saved', 'Attendance recorded. Thanks for closing the loop.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: unknown) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setSaving(false);
    }
  }, [activity, navigation, selected]);

  if (loading && !activity) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activity || !isHost) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Only the host can submit attendance.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Who showed up?"
        subtitle={formatActivityTime(activity.start_time, activity.duration)}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>
          Tap players who attended. This updates reliability for games where they tapped
          I'm in before lock.
        </Text>
        <TouchableOpacity
          style={styles.hostRow}
          onPress={() => user?.id && toggle(user.id)}
        >
          <Text style={styles.check}>{selected.has(user!.id) ? '☑' : '☐'}</Text>
          <Text style={styles.name}>You (host)</Text>
        </TouchableOpacity>
        {participants.map((p) => (
          <TouchableOpacity
            key={p.user_id}
            style={styles.row}
            onPress={() => toggle(p.user_id)}
          >
            <Text style={styles.check}>{selected.has(p.user_id) ? '☑' : '☐'}</Text>
            <Text style={styles.name}>{p.user?.username ?? 'Player'}</Text>
            {p.ready_at ? (
              <Text style={styles.meta}>I'm in</Text>
            ) : (
              <Text style={styles.metaMuted}>Joined only</Text>
            )}
          </TouchableOpacity>
        ))}
        <Button
          title={saving ? 'Saving…' : 'Submit attendance'}
          onPress={() => void handleSubmit()}
          disabled={saving}
          style={styles.submit}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  check: { fontSize: 18, width: 32 },
  name: { ...typography.body, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.success },
  metaMuted: { ...typography.caption, color: colors.textSecondary },
  submit: { marginTop: spacing.xl },
  error: { ...typography.body, color: colors.textSecondary },
});

export default PostGameAttendanceScreen;

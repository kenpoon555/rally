import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getGameRecap, shareGameRecap } from '../services/gameRecapService';
import { trackProductEvent } from '../services/analyticsService';
import { GameRecap } from '../types/gameRecap';
import { formatActivityTime } from '../utils/activityHelpers';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  recapId: string;
};

export const GameRecapCard: React.FC<Props> = ({ recapId }) => {
  const [recap, setRecap] = useState<GameRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const viewedTracked = useRef(false);

  useEffect(() => {
    setLoading(true);
    getGameRecap(recapId)
      .then((row) => {
        setRecap(row);
        if (row && !viewedTracked.current) {
          viewedTracked.current = true;
          void trackProductEvent('recap_viewed', {
            recap_id: recapId,
            activity_id: row.activity_id,
            ...(row.group_id ? { group_id: row.group_id } : {}),
          });
        }
      })
      .catch(() => setRecap(null))
      .finally(() => setLoading(false));
  }, [recapId]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!recap) {
    return null;
  }

  const title = recap.group_name
    ? `${recap.group_name} recap`
    : `${recap.sport_type} recap`;
  const when = formatActivityTime(recap.start_time, recap.duration);

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>Game recap</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>{when}</Text>
      {recap.court_name ? <Text style={styles.meta}>📍 {recap.court_name}</Text> : null}
      <Text style={styles.attendees}>
        {recap.attendee_count} attended
        {recap.attendees.length > 0
          ? ` · ${recap.attendees.map((a) => `@${a.username}`).join(', ')}`
          : ''}
      </Text>
      {recap.streak_highlight && recap.streak_highlight.week_streak > 0 ? (
        <Text style={styles.streak}>
          🔥 @{recap.streak_highlight.username} — {recap.streak_highlight.week_streak} week streak
        </Text>
      ) : null}
      {recap.rotation_rounds && recap.rotation_rounds > 0 ? (
        <Text style={styles.meta}>{recap.rotation_rounds} rotation round(s)</Text>
      ) : null}
      <TouchableOpacity
        style={styles.shareBtn}
        disabled={sharing}
        onPress={() => {
          setSharing(true);
          void shareGameRecap(recap).finally(() => setSharing(false));
        }}
      >
        <Text style={styles.shareText}>{sharing ? 'Opening share…' : 'Share recap'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  badge: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  attendees: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  streak: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  shareBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  shareText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { PendingReviewPrompt } from '../../services/reviewService';

type Props = {
  prompts: PendingReviewPrompt[];
  onPress: (activityId: string) => void;
};

export function TodayPlayerReviewCard({ prompts, onPress }: Props) {
  const rateable = prompts.filter((p) => p.rateable);
  if (rateable.length === 0) {
    return null;
  }

  const next = rateable[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(next.activity_id)}
      accessibilityRole="button"
      accessibilityLabel={`Rate players, ${rateable.length} pending`}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="star-outline" size={22} color={colors.warning} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Rate your last game</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {rateable.length === 1
            ? `Rate ${next.reviewed_username} — ${next.court_name}`
            : `${rateable.length} players waiting for your rating`}
        </Text>
      </View>
      <Text style={styles.cta}>Rate →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cta: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});

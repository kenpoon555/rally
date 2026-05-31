import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { getProfileReviewStats } from '../services/reviewService';
import { getProfileTrustStats } from '../services/safetyService';
import { formatPlayerTrustPreview } from '../utils/playerTrustPreview';
import { colors } from '../constants/theme';

type Props = {
  userId: string;
  style?: ViewStyle;
};

/** Compact trust line (rating / reliability) for join-request rows. */
export function PlayerTrustLine({ userId, style }: Props) {
  const [line, setLine] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProfileReviewStats(userId).catch(() => null),
      getProfileTrustStats(userId).catch(() => null),
    ])
      .then(([review, trust]) => {
        if (!cancelled) {
          setLine(formatPlayerTrustPreview(review, trust));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="small" color={colors.textTertiary} style={style} />;
  }

  if (!line) {
    return null;
  }

  return <Text style={[styles.line, style]}>{line}</Text>;
}

const styles = StyleSheet.create({
  line: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSportIconName } from '../SportIcon';
import { getSportMetadata } from '../../constants/sports';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ProfileScorecardStats } from '../../utils/profileScorecardHelpers';

type Props = {
  username: string;
  profilePhotoUrl?: string | null;
  memberSinceLabel?: string | null;
  sports: string[];
  stats: ProfileScorecardStats;
  style?: ViewStyle;
};

function StatColumn({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ProfileScoreCard({
  username,
  profilePhotoUrl,
  memberSinceLabel,
  sports,
  stats,
  style,
}: Props) {
  const handle = username.startsWith('@') ? username : `@${username}`;
  const initial = (username.replace(/^@/, '').trim()[0] || '?').toUpperCase();

  return (
    <View style={[styles.card, style]}>
      <View style={styles.identityRow}>
        {profilePhotoUrl ? (
          <Image source={{ uri: profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarRing}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}

        <View style={styles.identityCol}>
          <Text style={styles.handle}>{handle}</Text>
          {memberSinceLabel ? (
            <Text style={styles.memberSince}>Rally member since {memberSinceLabel}</Text>
          ) : null}

          {sports.length > 0 ? (
            <View style={styles.sportRow}>
              {sports.map((sport) => {
                const label = getSportMetadata(sport)?.shortLabel ?? sport;
                return (
                  <View key={sport} style={styles.sportChip}>
                    <MaterialCommunityIcons
                      name={getSportIconName(sport)}
                      size={11}
                      color={colors.text}
                    />
                    <Text style={styles.sportLabel} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatColumn value={String(stats.games)} label="Games" />
        <View style={styles.statDivider} />
        <StatColumn value={String(stats.going)} label="Going" />
        <View style={styles.statDivider} />
        <StatColumn value={stats.attendanceLabel} label="Attendance" />
      </View>
    </View>
  );
}

const AVATAR_SIZE = 52;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  identityCol: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  handle: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 22,
  },
  memberSince: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sportLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
});

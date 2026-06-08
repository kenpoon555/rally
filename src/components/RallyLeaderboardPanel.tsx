import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRallyLeaderboard } from '../services/rallyLeaderboardService';
import { RallyLeaderboardEntry, RallyLeaderboardWindow } from '../types/rallyLeaderboard';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  groupId: string;
  viewerId?: string;
};

const WINDOW_OPTIONS: { id: RallyLeaderboardWindow; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: '90', label: '90 days' },
];

const LEADERBOARD_PREVIEW = 5;

export const RallyLeaderboardPanel: React.FC<Props> = ({ groupId, viewerId }) => {
  const [window, setWindow] = useState<RallyLeaderboardWindow>('all');
  const [entries, setEntries] = useState<RallyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getRallyLeaderboard(groupId, window);
      setEntries(rows);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, window]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setExpanded(false);
  }, [window, groupId]);

  const hasStats = entries.some(
    (e) =>
      e.sessions_attended > 0 ||
      e.games_played > 0 ||
      e.tournament_wins > 0 ||
      e.tournament_losses > 0
  );

  const canFold = entries.length > LEADERBOARD_PREVIEW;
  const viewerEntry = viewerId ? entries.find((e) => e.user_id === viewerId) : undefined;
  const viewerOutsidePreview =
    Boolean(viewerEntry && viewerEntry.rank > LEADERBOARD_PREVIEW && !expanded);
  const visibleEntries =
    expanded || !canFold ? entries : entries.slice(0, LEADERBOARD_PREVIEW);

  const renderEntry = (entry: RallyLeaderboardEntry) => {
    const isViewer = entry.user_id === viewerId;
    const tourneyLine =
      entry.tournament_wins + entry.tournament_losses > 0
        ? ` · Tourney ${entry.tournament_wins}–${entry.tournament_losses}`
        : '';
    return (
      <View key={entry.user_id} style={[styles.row, isViewer && styles.rowViewer]}>
        <Text style={styles.rank}>#{entry.rank}</Text>
        <View style={styles.rowBody}>
          <Text style={styles.name}>@{entry.username}</Text>
          <Text style={styles.stats}>
            {entry.sessions_attended} attended
            {entry.week_streak > 0 ? ` · ${entry.week_streak} wk streak` : ''}
            {entry.games_played > 0 ? ` · ${entry.games_played} locked games` : ''}
            {tourneyLine}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Leaderboard</Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      <View style={styles.windowRow}>
        {WINDOW_OPTIONS.map((opt) => {
          const active = window === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.windowChip, active && styles.windowChipActive]}
              onPress={() => setWindow(opt.id)}
            >
              <Text style={[styles.windowChipText, active && styles.windowChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!hasStats ? (
        <Text style={styles.hint}>
          Stats appear after hosts record post-game attendance and you play mini tournaments.
        </Text>
      ) : (
        <>
          {visibleEntries.map((entry) => renderEntry(entry))}
          {viewerOutsidePreview && viewerEntry ? (
            <>
              <Text style={styles.foldDivider}>···</Text>
              {renderEntry(viewerEntry)}
            </>
          ) : null}
          {canFold ? (
            <TouchableOpacity
              style={styles.foldToggle}
              onPress={() => setExpanded((value) => !value)}
            >
              <Text style={styles.foldToggleText}>
                {expanded ? 'Show top 5' : `Show all ${entries.length}`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  windowRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  windowChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  windowChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  windowChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  windowChipTextActive: {
    color: colors.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowViewer: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rank: {
    width: 28,
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  stats: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  foldDivider: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  foldToggle: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  foldToggleText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});

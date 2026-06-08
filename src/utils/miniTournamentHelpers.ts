import { MiniTournamentMember } from '../types/miniTournament';

export type TournamentWinnerSummary = {
  usernames: string[];
  points: number;
  wins: number;
};

export function pickTournamentWinners(
  members: MiniTournamentMember[]
): TournamentWinnerSummary | null {
  if (members.length === 0) {
    return null;
  }

  const sorted = [...members].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return a.losses - b.losses;
  });

  const top = sorted[0];
  if (top.points === 0 && top.wins === 0) {
    return null;
  }

  const tied = sorted.filter(
    (member) => member.points === top.points && member.wins === top.wins
  );

  return {
    usernames: tied.map((member) => member.user?.username ?? 'player'),
    points: top.points,
    wins: top.wins,
  };
}

export function formatTournamentWinnerMeta(summary: TournamentWinnerSummary | null): string {
  if (!summary) {
    return 'Completed';
  }

  const handles = summary.usernames.map((name) => `@${name.replace(/^@/, '')}`);
  const pointsLabel = `${summary.points} pt${summary.points === 1 ? '' : 's'}`;

  if (handles.length > 1) {
    return `Winners ${handles.join(' · ')} · ${pointsLabel}`;
  }

  return `Winner ${handles[0]} · ${pointsLabel}`;
}

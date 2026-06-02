import { supabase } from './api/supabase';
import {
  MiniTournament,
  MiniTournamentMatch,
  MiniTournamentMember,
} from '../types/miniTournament';

export const createMiniTournament = async (
  groupId: string,
  name?: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_regular_group_tournament', {
    p_group_id: groupId,
    p_name: name?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to create tournament');
  }
  return data as string;
};

export const joinMiniTournament = async (tournamentId: string): Promise<void> => {
  const { error } = await supabase.rpc('join_regular_group_tournament', {
    p_tournament_id: tournamentId,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const startMiniTournament = async (tournamentId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('start_regular_group_tournament', {
    p_tournament_id: tournamentId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return Number(data ?? 0);
};

export const recordMiniTournamentMatch = async (
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<void> => {
  const { error } = await supabase.rpc('record_regular_group_tournament_match', {
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const getTournamentsForGroup = async (groupId: string): Promise<MiniTournament[]> => {
  const { data, error } = await supabase
    .from('regular_group_tournaments')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as MiniTournament[];
};

export const getMiniTournamentById = async (
  tournamentId: string
): Promise<MiniTournament | null> => {
  const { data, error } = await supabase
    .from('regular_group_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as MiniTournament | null) ?? null;
};

export const getMiniTournamentMembers = async (
  tournamentId: string
): Promise<MiniTournamentMember[]> => {
  const { data, error } = await supabase
    .from('regular_group_tournament_members')
    .select('tournament_id, user_id, wins, losses, points, joined_at')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false })
    .order('wins', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }

  const members = (data ?? []) as MiniTournamentMember[];
  if (members.length === 0) {
    return [];
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .in(
      'id',
      members.map((member) => member.user_id)
    );
  if (profileError) {
    throw new Error(profileError.message);
  }

  const nameById = new Map(
    (profiles ?? []).map((row) => [row.id as string, row.username as string])
  );

  return members.map((member) => ({
    ...member,
    user: {
      id: member.user_id,
      username: nameById.get(member.user_id) ?? 'Player',
    },
  }));
};

export const getMiniTournamentMatches = async (
  tournamentId: string
): Promise<MiniTournamentMatch[]> => {
  const { data, error } = await supabase
    .from('regular_group_tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round_number')
    .order('created_at');
  if (error) {
    throw new Error(error.message);
  }

  const matches = (data ?? []) as MiniTournamentMatch[];
  if (matches.length === 0) {
    return [];
  }

  const userIds = new Set<string>();
  for (const match of matches) {
    userIds.add(match.home_user_1);
    userIds.add(match.away_user_1);
    if (match.home_user_2) {
      userIds.add(match.home_user_2);
    }
    if (match.away_user_2) {
      userIds.add(match.away_user_2);
    }
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', [...userIds]);
  if (profileError) {
    throw new Error(profileError.message);
  }

  const nameById = new Map(
    (profiles ?? []).map((row) => [row.id as string, row.username as string])
  );

  return matches.map((match) => ({
    ...match,
    home_users: [
      { username: nameById.get(match.home_user_1) ?? 'Player' },
      match.home_user_2
        ? { username: nameById.get(match.home_user_2) ?? 'Player' }
        : undefined,
    ].filter(Boolean) as { username: string }[],
    away_users: [
      { username: nameById.get(match.away_user_1) ?? 'Player' },
      match.away_user_2
        ? { username: nameById.get(match.away_user_2) ?? 'Player' }
        : undefined,
    ].filter(Boolean) as { username: string }[],
  }));
};

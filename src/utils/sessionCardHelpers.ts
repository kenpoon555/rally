import { Activity, JoinRequest } from '../types/activity';
import { SessionCardPayload } from '../types/sessionCard';

/** Minimal Activity shape for session card action handlers. */
export function activityFromSessionCard(card: SessionCardPayload): Activity {
  const join_requests: JoinRequest[] = card.roster
    .filter((m) => m.role !== 'host')
    .map((m) => ({
      id: `${card.activity_id}-${m.user_id}`,
      activity_id: card.activity_id,
      user_id: m.user_id,
      status: m.status,
      requested_at: card.start_time,
      ready_at: m.ready_at ?? null,
      user: { id: m.user_id, username: m.username, profile_photo_url: m.profile_photo_url },
    }));

  return {
    id: card.activity_id,
    user_id: card.host_user_id,
    sport_type: card.sport_type as Activity['sport_type'],
    start_time: card.start_time,
    duration: card.duration,
    status: card.status as Activity['status'],
    match_status: card.match_status as Activity['match_status'],
    player_count: card.player_count,
    missing_players: card.missing_players,
    session_note: card.session_note,
    cost_note: card.cost_note,
    location_id: card.location_id,
    regular_group_id: card.regular_group_id,
    listing_title: card.listing_title,
    location: card.location_name
      ? { id: card.location_id ?? '', name: card.location_name, sport_type: card.sport_type }
      : undefined,
    user: { id: card.host_user_id, username: card.host_username },
    join_requests,
  } as Activity;
}

export function sessionCardMetaLine(card: SessionCardPayload): string {
  const open =
    card.open_spots > 0 ? `${card.open_spots} open` : 'Full';
  const ready = `${card.ready_count} ready`;
  const waitlist =
    card.viewer.is_waitlisted && card.viewer.waitlist_position
      ? ` · Waitlist #${card.viewer.waitlist_position}`
      : '';
  const lock =
    card.viewer.is_finalized
      ? ' · Roster locked'
      : card.viewer.is_host && card.viewer.lock_readiness === 'ready'
        ? ' · Ready to lock'
        : '';
  return `${card.roster_count} in · ${open} · ${ready}${waitlist}${lock}`;
}

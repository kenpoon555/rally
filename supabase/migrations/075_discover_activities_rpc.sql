-- ADR-0001: Server-side discover RPC with PostGIS geo-filter and keyset pagination.
-- Replaces ~11 sequential client round-trips with a single RPC call.
-- Source: docs/eng-review/adr/0001-discover-read-path.md

CREATE OR REPLACE FUNCTION discover_activities(
  p_viewer uuid DEFAULT NULL,
  p_lat float8 DEFAULT NULL,
  p_lng float8 DEFAULT NULL,
  p_radius_m float8 DEFAULT 60000,
  p_sport text DEFAULT NULL,
  p_limit int DEFAULT 30,
  p_cursor_start_time timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE(activity jsonb, distance_m float8)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_point geography;
BEGIN
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;

  RETURN QUERY
  SELECT
    jsonb_build_object(
      'id', a.id,
      'user_id', a.user_id,
      'location_id', a.location_id,
      'sport_type', a.sport_type,
      'start_time', a.start_time,
      'duration', a.duration,
      'visibility', a.visibility,
      'player_count', a.player_count,
      'missing_players', a.missing_players,
      'status', a.status,
      'scheduling_mode', a.scheduling_mode,
      'preference_deadline', a.preference_deadline,
      'window_start', a.window_start,
      'window_end', a.window_end,
      'match_status', a.match_status,
      'finalized_at', a.finalized_at,
      'finalized_by', a.finalized_by,
      'expires_at', a.expires_at,
      'source_activity_id', a.source_activity_id,
      'series_id', a.series_id,
      'urgency_level', a.urgency_level,
      'invite_token', a.invite_token,
      'regular_group_id', a.regular_group_id,
      'cost_note', a.cost_note,
      'session_note', a.session_note,
      'listing_title', a.listing_title,
      'play_intent', a.play_intent,
      'is_intro_session', a.is_intro_session,
      'roster_min', a.roster_min,
      'roster_max', a.roster_max,
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'location', CASE WHEN al.id IS NOT NULL THEN jsonb_build_object(
        'id', al.id,
        'name', al.name,
        'sport_type', al.sport_type,
        'location', al.location,
        'google_place_id', al.google_place_id,
        'radius', al.radius,
        'created_at', al.created_at
      ) ELSE NULL END,
      'user', CASE WHEN host_p.id IS NOT NULL THEN jsonb_build_object(
        'id', host_p.id,
        'username', host_p.username,
        'profile_photo_url', host_p.profile_photo_url
      ) ELSE NULL END,
      'join_requests', COALESCE(jr_agg.requests, '[]'::jsonb)
    ) AS activity,
    CASE WHEN v_point IS NOT NULL AND al.location IS NOT NULL
      THEN ST_Distance(al.location, v_point)::float8
      ELSE NULL::float8
    END AS distance_m
  FROM activities a
  LEFT JOIN activity_locations al ON al.id = a.location_id
  LEFT JOIN profiles host_p ON host_p.id = a.user_id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object(
      'id', jr.id,
      'activity_id', jr.activity_id,
      'user_id', jr.user_id,
      'status', jr.status,
      'ready_at', jr.ready_at,
      'user', jsonb_build_object(
        'id', jrp.id,
        'username', jrp.username,
        'profile_photo_url', jrp.profile_photo_url
      )
    )) AS requests
    FROM join_requests jr
    JOIN profiles jrp ON jrp.id = jr.user_id
    WHERE jr.activity_id = a.id
      AND (
        jr.status = 'approved'
        OR (p_viewer IS NOT NULL AND jr.user_id = p_viewer)
        OR (p_viewer IS NOT NULL AND a.user_id = p_viewer AND jr.status = 'pending')
      )
  ) jr_agg ON true
  WHERE a.status = 'active'
    AND (p_sport IS NULL OR a.sport_type = p_sport)
    AND (
      v_point IS NULL
      OR al.location IS NULL
      OR ST_DWithin(al.location, v_point, p_radius_m)
    )
    AND (
      p_cursor_start_time IS NULL
      OR a.start_time > p_cursor_start_time
      OR (a.start_time = p_cursor_start_time AND a.id > p_cursor_id)
    )
  ORDER BY a.start_time ASC, a.id ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION discover_activities(uuid, float8, float8, float8, text, int, timestamptz, uuid) TO authenticated, anon;

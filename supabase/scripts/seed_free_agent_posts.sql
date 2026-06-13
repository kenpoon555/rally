-- Demo free-agent posts for Play → Players board (Badminton + Pickleball, Los Angeles).
-- Safe to re-run. Requires preview profiles from seed_beta_test_data.sql or similar.
--
-- Apply:
--   supabase db query --linked -f supabase/scripts/seed_free_agent_posts.sql

do $$
declare
  v_kunyu uuid := 'f6cee5e0-b650-4a85-a2f1-a99d177c27b4';
  v_ken uuid := 'c81ee058-188b-405f-931f-cd07239159cf';
begin
  insert into public.app_feature_flags (key, enabled, config)
  values (
    'free_agents_v1',
    true,
    '{"description":"Free agent availability board","cities":["Los Angeles"],"sports":["Badminton","Pickleball"]}'::jsonb
  )
  on conflict (key) do update set enabled = excluded.enabled, config = excluded.config;

  -- Re-seed: cancel prior open demo posts for these users/sports
  update public.free_agent_posts
  set status = 'cancelled', updated_at = now()
  where user_id in (v_kunyu, v_ken)
    and sport in ('Badminton', 'Pickleball')
    and status = 'open';

  if not exists (select 1 from public.profiles where id = v_kunyu) then
    raise notice 'Profile kunyu missing — skipping free agent seed (run seed_beta_test_data.sql first).';
    return;
  end if;

  insert into public.free_agent_posts (
    user_id, sport, city, skill_level, availability, note, status, expires_at, created_at
  )
  values
    (
      v_kunyu,
      'Badminton',
      'Los Angeles',
      'intermediate',
      '{"preset":"weeknights"}'::jsonb,
      'Doubles partner — weeknights near Pasadena',
      'open',
      now() + interval '14 days',
      now() - interval '45 minutes'
    ),
    (
      v_ken,
      'Pickleball',
      'Los Angeles',
      'open',
      '{"preset":"weekends"}'::jsonb,
      'Open to rec games Sat/Sun — can drive to SFV',
      'open',
      now() + interval '14 days',
      now() - interval '3 hours'
    ),
    (
      v_ken,
      'Badminton',
      'Los Angeles',
      'advanced',
      '{"preset":"flexible"}'::jsonb,
      'Competitive singles — flexible afternoons',
      'open',
      now() + interval '10 days',
      now() - interval '6 hours'
    ),
    (
      v_kunyu,
      'Pickleball',
      'Los Angeles',
      'beginner',
      '{"preset":"flexible"}'::jsonb,
      'New to pickleball — looking for patient partners',
      'open',
      now() + interval '12 days',
      now() - interval '1 day'
    );

  raise notice 'Free agent demo seed complete (4 open posts for LA Badminton/Pickleball).';
end $$;

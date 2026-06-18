-- v1.3 parent pilot validation seed
-- Parent login: marcus@rally-mvrhoops.demo / MonroviaHoops26!
--   → 2 child profiles: Alex, Mia
--   → coach class invites (Youth Basketball — parent enroll test)
-- Badminton class roster: Confirmed / Not responded / Can't make it (Alex, Mia, Riley)

update public.profiles
set
  age_category = 'adult_18_plus',
  is_coach = true
where id = 'd1000001-0001-4001-8001-000000000001';

-- Secondary parent (roster diversity — Riley can't-make-it row)
insert into public.profiles (id, email, username, age_category, preferred_sports)
values (
  'c1000001-0001-4001-8001-000000000101',
  'jordan.parent@rally-mvrhoops.demo',
  'jordanparent',
  'adult_18_plus',
  array['Badminton']
)
on conflict (id) do update set
  age_category = excluded.age_category,
  email = excluded.email,
  username = excluded.username;

delete from public.student_enrollments
where student_profile_id in (
  select id from public.student_profiles
  where parent_user_id in (
    'd1000001-0001-4001-8001-000000000001',
    'c1000001-0001-4001-8001-000000000101'
  )
);

delete from public.guardian_consents
where parent_user_id = 'd1000001-0001-4001-8001-000000000001';

delete from public.student_profiles
where parent_user_id in (
  'd1000001-0001-4001-8001-000000000001',
  'c1000001-0001-4001-8001-000000000101'
);

insert into public.student_profiles (id, parent_user_id, display_name, status)
values
  ('a1000001-0001-4001-8001-000000000001', 'd1000001-0001-4001-8001-000000000001', 'Alex', 'active'),
  ('a1000002-0001-4002-8002-000000000002', 'd1000001-0001-4001-8001-000000000001', 'Mia', 'active'),
  ('a1000003-0001-4003-8003-000000000003', 'c1000001-0001-4001-8001-000000000101', 'Riley', 'active')
on conflict (id) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  parent_user_id = excluded.parent_user_id;

-- Guardian consent record for marcus (profile create infra — attestation UI still lawyer-gated)
insert into public.guardian_consents (
  id, parent_user_id, student_profile_id, policy_version, attested_at
)
values (
  'b1000001-0001-4001-8001-000000000001',
  'd1000001-0001-4001-8001-000000000001',
  null,
  'guardian-v1-2026-06',
  now()
)
on conflict (id) do update set
  revoked_at = null,
  attested_at = excluded.attested_at;

-- Beginner Badminton roster — all three response groups
insert into public.student_enrollments (
  id, student_profile_id, coach_user_id, class_id, class_title, sport_type, status, response_status
)
values
  (
    'e1000001-0001-4001-8001-000000000001',
    'a1000001-0001-4001-8001-000000000001',
    'd1000001-0001-4001-8001-000000000001',
    'class-demo-badminton',
    'Beginner Badminton',
    'Badminton',
    'active',
    'not_responded'
  ),
  (
    'e1000002-0001-4002-8002-000000000002',
    'a1000002-0001-4002-8002-000000000002',
    'd1000001-0001-4001-8001-000000000001',
    'class-demo-badminton',
    'Beginner Badminton',
    'Badminton',
    'active',
    'confirmed'
  ),
  (
    'e1000003-0001-4003-8003-000000000003',
    'a1000003-0001-4003-8003-000000000003',
    'd1000001-0001-4001-8001-000000000001',
    'class-demo-badminton',
    'Beginner Badminton',
    'Badminton',
    'active',
    'cant_make_it'
  )
on conflict (id) do update set
  class_id = excluded.class_id,
  response_status = excluded.response_status,
  status = excluded.status;

-- Youth Basketball — invite only (parent enrolls Mia during validation)
delete from public.student_enrollments
where class_id = 'class-demo-basketball';

delete from public.class_enrollment_invites
where coach_user_id = 'd1000001-0001-4001-8001-000000000001'
  and class_id in ('class-demo-basketball', 'class-demo-badminton');

insert into public.class_enrollment_invites (
  id, invite_token, coach_user_id, class_id, class_title, sport_type
)
values
  (
    'f1000001-0001-4001-8001-000000000001',
    'b3000001-0001-4001-8001-000000000001',
    'd1000001-0001-4001-8001-000000000001',
    'class-demo-basketball',
    'Youth Basketball Clinic',
    'Basketball'
  ),
  (
    'f1000002-0001-4002-8002-000000000002',
    'b3000002-0002-4002-8002-000000000002',
    'd1000001-0001-4001-8001-000000000001',
    'class-demo-badminton',
    'Beginner Badminton',
    'Badminton'
  )
on conflict (id) do update set
  invite_token = excluded.invite_token,
  class_title = excluded.class_title;

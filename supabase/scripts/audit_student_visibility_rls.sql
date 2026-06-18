-- Audit: module-student-visibility RLS expectations (run via supabase db query --linked -f)
-- Pass when all checks return ok = true.

with expected_policies as (
  select * from (values
    ('student_profiles', 'Parents manage own student profiles'),
    ('student_profiles', 'Coaches view enrolled students'),
    ('guardian_consents', 'Parents manage guardian consents'),
    ('student_enrollments', 'Parents view own enrollments'),
    ('student_enrollments', 'Coaches view their enrollments'),
    ('student_enrollments', 'Parents insert enrollments for own students')
  ) as t(tablename, policyname)
),
actual as (
  select tablename, policyname
  from pg_policies
  where schemaname = 'public'
)
select
  e.tablename,
  e.policyname,
  (a.policyname is not null) as ok
from expected_policies e
left join actual a
  on a.tablename = e.tablename and a.policyname = e.policyname
order by e.tablename, e.policyname;

-- RLS enabled on student tables
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relrowsecurity as ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('student_profiles', 'guardian_consents', 'student_enrollments');

-- No public SELECT on student_profiles without parent or enrolled coach role
select
  not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'student_profiles'
      and p.cmd = 'SELECT'
      and p.roles::text like '%public%'
  ) as no_public_student_select;

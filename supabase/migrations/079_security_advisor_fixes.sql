-- Fix Supabase Security Advisor errors (reported 2026-06-28)
--
-- 1. sport_templates: enable RLS — config table was publicly writable
-- 2. spatial_ref_sys: revoke PostgREST access — PostGIS system table, no user data
-- 3. Security Definer Views → SECURITY INVOKER so they respect caller's RLS

-- ============================================================
-- 1. sport_templates RLS
-- ============================================================

alter table public.sport_templates enable row level security;

-- Everyone authenticated can read sport config
create policy "Public read sport_templates"
  on public.sport_templates for select
  to authenticated
  using (true);

-- anon can also read (needed for unauthenticated discover/onboarding)
create policy "Anon read sport_templates"
  on public.sport_templates for select
  to anon
  using (true);

-- Only service role can insert/update/delete (no user-facing write path)

-- ============================================================
-- 2. spatial_ref_sys — PostGIS system table, revoke from PostgREST roles
-- ============================================================

revoke all on public.spatial_ref_sys from anon, authenticated;

-- ============================================================
-- 3. Convert Security Definer views → Security Invoker
-- ============================================================

alter view public.analytics_funnel_7d set (security_invoker = true);
alter view public.analytics_usage_7d set (security_invoker = true);
alter view public.analytics_crew_funnel_30d set (security_invoker = true);
alter view public.analytics_crew_lifecycle set (security_invoker = true);
alter view public.profile_review_stats set (security_invoker = true);

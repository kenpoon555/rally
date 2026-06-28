-- Performance indexes for the discover feed read path.
-- Finding 2: activities full table scan + sort on every discover refresh.
-- Finding 6: join_requests status filter leans on unique index only.
-- Source: docs/eng-review/query-cost-auditor/2026-06-28-review.md

create index if not exists idx_activities_status_start_time
  on public.activities (status, start_time)
  where status = 'active';

create index if not exists idx_join_requests_activity_status
  on public.join_requests (activity_id, status);

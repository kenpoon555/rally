-- messages.activity_id required for join/leave system lines (migration 030 never applied on remote).

alter table public.messages
  add column if not exists activity_id uuid references public.activities(id) on delete set null;

create index if not exists idx_messages_activity_id
  on public.messages(activity_id)
  where activity_id is not null;

-- Stage 1: Discover listing headline + play intent for host-labeled games

alter table public.activities
  add column if not exists listing_title text,
  add column if not exists play_intent text;

comment on column public.activities.listing_title is
  'Host-edited headline on Discover (e.g. training partner AM, split court $80/hr).';

comment on column public.activities.play_intent is
  'pickup | training_partner | split_court | last_minute_fill | casual_only';

alter table public.activities
  drop constraint if exists activities_play_intent_check;

alter table public.activities
  add constraint activities_play_intent_check check (
    play_intent is null
    or play_intent in (
      'pickup',
      'training_partner',
      'split_court',
      'last_minute_fill',
      'casual_only'
    )
  );

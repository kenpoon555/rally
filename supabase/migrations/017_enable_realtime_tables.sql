-- Enable Supabase Realtime for chat + join-request in-app alerts.
-- Without publication, postgres_changes subscriptions never fire.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.join_requests;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.activities;

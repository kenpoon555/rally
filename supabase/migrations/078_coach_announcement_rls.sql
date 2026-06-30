-- Allow coaches to read notifications they sent for their own classes.
DROP POLICY IF EXISTS "Coaches read sent class notifications" ON public.class_parent_notifications;
CREATE POLICY "Coaches read sent class notifications"
  ON public.class_parent_notifications
  FOR SELECT
  USING (coach_user_id = auth.uid());

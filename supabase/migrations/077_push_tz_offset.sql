ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_tz_offset_minutes integer NOT NULL DEFAULT 0;

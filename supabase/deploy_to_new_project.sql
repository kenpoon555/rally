-- Full schema migration for new Supabase project
-- Run this in the SQL Editor of your new project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles table (user profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  username TEXT NOT NULL,
  profile_photo_url TEXT,
  preferred_sports TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity locations table with PostGIS geography
CREATE TABLE IF NOT EXISTS activity_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  google_place_id TEXT UNIQUE,
  radius INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIST index for efficient geospatial queries
CREATE INDEX IF NOT EXISTS idx_activity_locations_location 
ON activity_locations USING GIST(location);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES activity_locations(id) ON DELETE SET NULL,
  sport_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  visibility TEXT CHECK (visibility IN ('friends', 'nearby')),
  player_count INTEGER DEFAULT 1,
  missing_players INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join requests table
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(activity_id, user_id)
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- User device tokens for push notifications
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Function to get nearby locations (PostGIS)
CREATE OR REPLACE FUNCTION get_nearby_locations(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sport_type TEXT,
  location GEOGRAPHY,
  google_place_id TEXT,
  radius INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.name,
    al.sport_type,
    al.location,
    al.google_place_id,
    al.radius,
    al.created_at
  FROM activity_locations al
  WHERE ST_DWithin(
    al.location,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  );
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles policies (drop first so migration is idempotent)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Activity locations policies
DROP POLICY IF EXISTS "Anyone can view activity locations" ON activity_locations;
CREATE POLICY "Anyone can view activity locations"
  ON activity_locations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create locations" ON activity_locations;
CREATE POLICY "Authenticated users can create locations"
  ON activity_locations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Activities policies
DROP POLICY IF EXISTS "Anyone can view active activities" ON activities;
CREATE POLICY "Anyone can view active activities"
  ON activities FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own activities" ON activities;
CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON activities;
CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Join requests policies
DROP POLICY IF EXISTS "Users can view join requests for their activities" ON join_requests;
CREATE POLICY "Users can view join requests for their activities"
  ON join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = join_requests.activity_id
      AND activities.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create join requests" ON join_requests;
CREATE POLICY "Users can create join requests"
  ON join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Activity hosts can update join requests" ON join_requests;
CREATE POLICY "Activity hosts can update join requests"
  ON join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = join_requests.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- Friends policies
DROP POLICY IF EXISTS "Users can view their own friendships" ON friends;
CREATE POLICY "Users can view their own friendships"
  ON friends FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

DROP POLICY IF EXISTS "Users can create friend requests" ON friends;
CREATE POLICY "Users can create friend requests"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update friend requests where they are the recipient" ON friends;
CREATE POLICY "Users can update friend requests where they are the recipient"
  ON friends FOR UPDATE
  USING (friend_id = auth.uid());

-- Device tokens policies
DROP POLICY IF EXISTS "Users can manage their own device tokens" ON user_device_tokens;
CREATE POLICY "Users can manage their own device tokens"
  ON user_device_tokens FOR ALL
  USING (auth.uid() = user_id);

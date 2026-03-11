-- ============================================
-- COMPLETE FIX FOR USERS TABLE API ACCESS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Grant schema access to all API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- 3. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop and recreate ALL policies cleanly
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- 5. Create fresh policies
CREATE POLICY "Anyone can view profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- THIS IS THE CRITICAL STEP!
-- Forces PostgREST to reload its schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';

-- 6. Verify table is visible
SELECT 'Table check:' as status, schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 7. Verify policies exist
SELECT 'Policies:' as status, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';

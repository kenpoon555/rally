-- Fix profiles table so the app can read profile rows after sign-in.
-- Run this in Supabase Dashboard → SQL Editor if you get "Profile not found" / "profile setup is incomplete"
-- when the profile exists in Table Editor.

-- Ensure SELECT is allowed (authenticated users can read all profiles for discovery; or at least own row)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Ensure authenticated users can insert/update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

NOTIFY pgrst, 'reload schema';

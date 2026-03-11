-- Test if users table is accessible via REST API (what the app uses)
-- Run this in Supabase SQL Editor

-- 1. Check if table exists and is in public schema
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 2. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 3. Check RLS policies exist
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users';

-- 4. Check if we can SELECT (this simulates what the app does)
-- This should work if RLS policies are correct
SELECT COUNT(*) as can_read FROM users;

-- 5. Check if the anon role has access
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'users'
AND grantee IN ('anon', 'authenticated', 'public');

-- 6. Verify the table structure matches what the app expects
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

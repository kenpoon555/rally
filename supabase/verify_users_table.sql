-- Quick verification: Check if users table exists
-- Run this in Supabase SQL Editor to verify the migration worked

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- If table exists, show structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Try to count rows (will fail if RLS blocks, but that's OK)
SELECT COUNT(*) as user_count FROM users;

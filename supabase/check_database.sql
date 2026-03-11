-- Quick diagnostic queries to check if tables exist and RLS is configured

-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- Check if uuid-ossp extension is enabled
SELECT EXISTS (
  SELECT FROM pg_extension 
  WHERE extname = 'uuid-ossp'
) AS uuid_extension_enabled;

-- Check RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

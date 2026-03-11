# Supabase Signup Troubleshooting Guide

## Issue: "Invalid path specified in request URL" or "Failed to create user profile"

This error typically means the `users` table doesn't exist in your Supabase database.

## Step 1: Verify Database Setup

Run this diagnostic query in Supabase SQL Editor to check your database:

```sql
-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected result**: `users_table_exists` should be `true`, and you should see tables like:
- users
- activities
- activity_locations
- join_requests
- friends
- user_device_tokens

## Step 2: Run the Migration

If the tables don't exist, run the migration:

1. Go to https://supabase.com/dashboard
2. Select your project: `nhnopagpjikoekgentcx`
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the **entire contents** of `supabase/migrations/001_initial_schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for "Success. No rows returned"

## Step 3: Verify RLS Policies

After running the migration, verify RLS policies exist:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

You should see 3 policies:
- "Users can view all profiles" (SELECT)
- "Users can update own profile" (UPDATE)
- "Users can insert own profile" (INSERT)

## Step 4: Test the Signup Flow

After running the migration, try signing up again in the app.

## Common Issues

### Issue: "relation 'users' does not exist"
**Solution**: The migration hasn't been run. Follow Step 2 above.

### Issue: "new row violates row-level security policy"
**Solution**: RLS policies might not be set up correctly. Re-run the migration.

### Issue: "duplicate key value violates unique constraint"
**Solution**: A user with that email/username already exists. Try a different email/username.

### Issue: "permission denied for table users"
**Solution**: Check that the anon key in `config.ts` matches your Supabase project's anon key.

## Quick Fix Script

If you want to start fresh, you can drop and recreate tables (⚠️ **WARNING**: This deletes all data):

```sql
-- DROP ALL TABLES (use with caution!)
DROP TABLE IF EXISTS user_device_tokens CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS activity_locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then run the full migration again
```

## Still Having Issues?

1. Check Supabase project is active (not paused)
2. Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/constants/config.ts`
3. Check Supabase dashboard > Logs for any errors
4. Try the diagnostic queries in `supabase/check_database.sql`

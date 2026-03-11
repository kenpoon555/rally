/**
 * Test Supabase connection and verify database setup
 * Run this in your app to diagnose issues
 */
import { supabase } from '../services/api/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check if we can connect
  try {
    const { error } = await supabase.from('profiles').select('count').limit(0);
    if (error) {
      if (error.message?.includes('Invalid path') || error.code === 'PGRST116') {
        console.error('❌ ERROR: "profiles" table does not exist!');
        console.error('   → Run the migration in Supabase SQL Editor');
        console.error('   → File: supabase/migrations/001_initial_schema.sql\n');
        return false;
      }
      console.error('❌ Connection error:', error.message);
      return false;
    }
    console.log('✅ Can connect to Supabase\n');
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }

  // Test 2: Check if we can read from profiles table
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('❌ Cannot read from profiles table:', error.message);
      return false;
    }
    console.log('✅ Can read from profiles table\n');
  } catch (error: any) {
    console.error('❌ Read test failed:', error.message);
    return false;
  }

  // Test 3: Check RLS policies (try to get current user)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Auth user exists:', user.id);
    } else {
      console.log('ℹ️  No authenticated user (this is OK for signup test)\n');
    }
  } catch (error: any) {
    console.error('❌ Auth check failed:', error.message);
  }

  console.log('\n✅ All connection tests passed!');
  console.log('   If signup still fails, check RLS policies in Supabase dashboard.\n');
  return true;
};

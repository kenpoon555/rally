import { supabase } from './api/supabase';
import { User } from '../types/user';
import { getDefaultLaunchSportName, resolveUserDefaultSport } from '../constants/sports';
import { TOS_VERSION } from '../constants/legal';

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return (data as User) || null;
};

/**
 * Create user profile after signup
 */
export const createUserProfile = async (
  userId: string,
  profileData: {
    username: string;
    email?: string;
    phone?: string;
    preferred_sports?: string[];
  }
): Promise<User> => {
  try {
    // First check if user already exists. During signup, auth trigger may have
    // already inserted this profile, so this should be treated as success.
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // PGRST116 means "no row" and is expected.
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user existence:', JSON.stringify(checkError, null, 2));
      // Only raise migration guidance when DB truly reports missing relation.
      if (checkError.code === '42P01') {
        throw new Error('Database setup incomplete. Please run the migration in Supabase SQL Editor.');
      }
    }

    if (existing) {
      // Profile already exists (e.g. created by trigger); return it so loadUser can use it.
      return existing as User;
    }

    // Insert new user profile
    const insertData = {
      id: userId,
      username: profileData.username,
      ...(profileData.email && { email: profileData.email }),
      ...(profileData.phone && { phone: profileData.phone }),
      ...(profileData.preferred_sports?.length
        ? { preferred_sports: profileData.preferred_sports }
        : { preferred_sports: [getDefaultLaunchSportName()] }),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(insertData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // PGRST116 can happen when no row is returned from .single().
      // Try a follow-up fetch before failing.
      if (error.code === 'PGRST116') {
        const { data: fallbackUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (fallbackUser) {
          return fallbackUser as User;
        }
      }

      // Trigger and client insert can race; if row exists, treat as success.
      const { data: existingById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingById) {
        return existingById as User;
      }

      // Provide helpful error message for common schema/setup issues
      let errorMessage = error.message;
      if (error.code === '42P01' || error.code === 'PGRST125') {
        errorMessage = 'Database setup incomplete. Please run the migration in Supabase SQL Editor.';
        console.error('Database migration required:', {
          file: 'supabase/migrations/001_initial_schema.sql',
          steps: [
            '1. Go to your Supabase dashboard',
            '2. Open SQL Editor',
            '3. Run the migration file: supabase/migrations/001_initial_schema.sql',
          ],
          originalError: error.message,
        });
      }

      throw new Error(errorMessage);
    }

    if (!data) {
      const { data: fallbackUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fallbackUser) {
        return fallbackUser as User;
      }

      throw new Error('Failed to create user profile: No data returned');
    }

    return data as User;
  } catch (error: any) {
    // Re-throw if it's already our formatted error
    if (error.message?.includes('Failed to create user profile')) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(`Failed to create user profile: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data as User;
};

/** Persist a default sport when profile has none (legacy accounts). */
export async function ensureUserDefaultSport(user: User): Promise<User> {
  if (user.preferred_sports?.[0]) {
    return user;
  }
  const defaultSport = resolveUserDefaultSport(null);
  return updateUserProfile(user.id, { preferred_sports: [defaultSport] as User['preferred_sports'] });
}

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return (data as User) || null;
};

/**
 * Search users by username or phone
 */
export const acceptLegalTerms = async (userId: string): Promise<User> => {
  return updateUserProfile(userId, {
    tos_accepted_at: new Date().toISOString(),
    tos_version: TOS_VERSION,
  } as Partial<User>);
};

export const acknowledgeLocationPrivacy = async (userId: string): Promise<User> => {
  return updateUserProfile(userId, {
    location_privacy_ack_at: new Date().toISOString(),
  } as Partial<User>);
};

export const needsLegalAcceptance = (user: User | null): boolean => {
  if (!user) {
    return false;
  }
  if (!user.tos_accepted_at || user.tos_version !== TOS_VERSION) {
    return true;
  }
  if (!user.location_privacy_ack_at) {
    return true;
  }
  return false;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  // Strip characters that break PostgREST .or() filter strings.
  const safePattern = trimmed.replace(/[%_,.()"'\\]/g, '');
  if (!safePattern) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${safePattern}%,phone.eq.${trimmed}`)
    .eq('is_suspended', false)
    .limit(20);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return (data || []) as User[];
};

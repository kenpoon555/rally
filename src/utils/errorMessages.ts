const includes = (source: string, keyword: string): boolean =>
  source.toLowerCase().includes(keyword.toLowerCase());

export const toAuthErrorMessage = (error: unknown, fallback: string): string => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : fallback;

  if (includes(raw, 'invalid login credentials')) {
    return 'Invalid email or password.';
  }

  if (includes(raw, 'email not confirmed')) {
    return 'Please verify your email first, then sign in.';
  }

  if (includes(raw, 'network request failed')) {
    return 'Network unavailable. Check your connection and retry.';
  }

  if (includes(raw, 'rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  if (includes(raw, 'already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (includes(raw, 'profile not found') || includes(raw, 'database setup incomplete')) {
    return 'Profile not found. If you used this account before, run supabase/fix_profiles_rls.sql in Supabase SQL Editor, then try again.';
  }

  return raw || fallback;
};

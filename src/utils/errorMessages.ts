const includes = (source: string, keyword: string): boolean =>
  source.toLowerCase().includes(keyword.toLowerCase());

const normalizeErrorText = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

export const toNetworkErrorMessage = (error: unknown, fallback = 'Network unavailable. Check your connection and try again.'): string => {
  const raw = normalizeErrorText(error, fallback);

  if (
    includes(raw, 'network request failed') ||
    includes(raw, 'failed to fetch') ||
    includes(raw, 'network error') ||
    includes(raw, 'internet connection') ||
    includes(raw, 'offline')
  ) {
    return 'Network unavailable. Check your connection and try again.';
  }

  if (includes(raw, 'timeout') || includes(raw, 'timed out')) {
    return 'Request timed out. Check your connection and try again.';
  }

  return raw || fallback;
};

export const toUserErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  const raw = normalizeErrorText(error, fallback);
  const networkMessage = toNetworkErrorMessage(raw, '');

  if (networkMessage && networkMessage !== raw) {
    return networkMessage;
  }

  if (includes(raw, 'jwt') || includes(raw, 'not authenticated') || includes(raw, 'session')) {
    return 'Your session expired. Sign in again and retry.';
  }

  if (includes(raw, 'permission denied') || includes(raw, 'row-level security')) {
    return 'You do not have access to this content right now.';
  }

  if (raw.startsWith('TypeError:') || raw.startsWith('Error:')) {
    return fallback;
  }

  return raw || fallback;
};

export const toAuthErrorMessage = (error: unknown, fallback: string): string => {
  const raw = normalizeErrorText(error, fallback);

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

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';

const normalizeSupabaseUrl = (url: string): string => {
  const trimmed = url.trim().replace(/^['"]|['"]$/g, '');
  // Some setups accidentally provide a service URL like:
  // - https://<ref>.supabase.co/rest/v1
  // - https://<ref>.supabase.co/auth/v1
  // Supabase client expects the project origin only.
  const strippedServicePath = trimmed.replace(
    /\/(rest|auth|storage|functions)\/v1(\/.*)?$/i,
    ''
  );
  const withoutTrailingSlash = strippedServicePath.replace(/\/+$/, '');

  try {
    const parsed = new URL(withoutTrailingSlash);
    // If env accidentally contains an API path (e.g. /rest/v1), use origin only.
    return parsed.origin;
  } catch {
    // Fallback for unexpected non-URL formatting.
    return withoutTrailingSlash.replace(/\/+$/, '');
  }
};

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.'
  );
}

const baseUrl = normalizeSupabaseUrl(CONFIG.SUPABASE_URL);

const customFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
  // PostgREST returns PGRST125 when path has a trailing slash before query (e.g. /rest/v1/profiles/?select=*).
  const fixedUrl = url.replace(/\/rest\/v1\/([^?]+)\/\?/, '/rest/v1/$1?');
  if (fixedUrl !== url) {
    const finalInit =
      input instanceof Request
        ? { method: input.method, headers: input.headers, body: input.body, duplex: (input as any).duplex }
        : init;
    return fetch(fixedUrl, finalInit);
  }
  return fetch(input, init);
};

export const supabase = createClient(baseUrl, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: customFetch,
  },
});

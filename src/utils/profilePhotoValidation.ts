/** Stage 2: guard profile photo URLs until native upload + compression ships. */
export const MAX_PROFILE_PHOTO_URL_LENGTH = 2048;

const ALLOWED_PHOTO_HOST_SUFFIXES = [
  'supabase.co',
  'cloudinary.com',
  'imgur.com',
  'googleusercontent.com',
];

export function validateProfilePhotoUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_PROFILE_PHOTO_URL_LENGTH) {
    return `Photo URL must be under ${MAX_PROFILE_PHOTO_URL_LENGTH} characters.`;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Photo URL must be a valid https link.';
  }
  if (parsed.protocol !== 'https:') {
    return 'Photo URL must use https.';
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_PHOTO_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
  if (!allowed) {
    return 'Use a hosted image link (Supabase storage, Cloudinary, or similar https URL).';
  }
  return null;
}

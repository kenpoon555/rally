/** Public install links for invite landing pages — override via Supabase secrets. */

const ASC_APP_STORE_URL = 'https://apps.apple.com/app/id6777569179';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.rally.sports';

/** Production default: App Store listing (not TestFlight). */
export function getIosInstallUrl(): string {
  return Deno.env.get('IOS_INSTALL_URL')?.trim() || ASC_APP_STORE_URL;
}

export function getAndroidInstallUrl(): string {
  return Deno.env.get('ANDROID_INSTALL_URL')?.trim() || PLAY_STORE_URL;
}

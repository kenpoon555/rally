import { CONFIG, readEnvOptional } from './config';

/** Public TestFlight / Play internal URLs — override via EAS secrets when available. */
export const APP_LINKS = {
  iosInstallUrl:
    readEnvOptional('IOS_INSTALL_URL') || 'https://testflight.apple.com/join/gBcW7gA2',
  androidInstallUrl:
    readEnvOptional('ANDROID_INSTALL_URL') ||
    'https://play.google.com/store/apps/details?id=app.rally.sports',
};

export function getSupabaseFunctionsBaseUrl(): string | null {
  const url = CONFIG.SUPABASE_URL?.trim();
  if (!url) {
    return null;
  }
  return `${url.replace(/\/$/, '')}/functions/v1`;
}

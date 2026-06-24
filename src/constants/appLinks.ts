import { CONFIG, readEnvOptional } from './config';

/** Install URLs — set IOS_INSTALL_URL / ANDROID_INSTALL_URL in EAS production secrets. */
const ASC_APP_STORE_URL = 'https://apps.apple.com/app/id6777569179';

export const APP_LINKS = {
  iosInstallUrl:
    readEnvOptional('IOS_INSTALL_URL') ||
    (__DEV__ ? 'https://testflight.apple.com/join/gBcW7gA2' : ASC_APP_STORE_URL),
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

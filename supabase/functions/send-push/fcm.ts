import { SignJWT, importPKCS8 } from 'npm:jose@5';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const TOKEN_AUD = 'https://oauth2.googleapis.com/token';
const DEFAULT_PROJECT_ID = 'rally-32e72';

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedAccessToken: { token: string; expiresAtMs: number } | null = null;

export function parseFirebaseServiceAccount(raw: string): FirebaseServiceAccount {
  const parsed = JSON.parse(raw) as FirebaseServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON missing client_email or private_key');
  }
  return parsed;
}

async function getAccessToken(serviceAccount: FirebaseServiceAccount): Promise<string> {
  const nowMs = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAtMs > nowMs + 60_000) {
    return cachedAccessToken.token;
  }

  const key = await importPKCS8(serviceAccount.private_key, 'RS256');
  const nowSec = Math.floor(nowMs / 1000);
  const jwt = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience(TOKEN_AUD)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 3600)
    .sign(key);

  const res = await fetch(TOKEN_AUD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`FCM OAuth error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlMs = (data.expires_in ?? 3600) * 1000;
  cachedAccessToken = {
    token: data.access_token,
    expiresAtMs: nowMs + ttlMs,
  };
  return data.access_token;
}

export async function sendFcmV1(
  serviceAccountJson: string,
  token: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  const serviceAccount = parseFirebaseServiceAccount(serviceAccountJson);
  const projectId = serviceAccount.project_id || DEFAULT_PROJECT_ID;
  const accessToken = await getAccessToken(serviceAccount);

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data,
        android: {
          priority: 'HIGH',
          notification: {
            channel_id: 'rally_default',
            sound: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              'content-available': 1,
            },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM v1 error ${res.status}: ${text}`);
  }
}

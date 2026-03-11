/**
 * Debug session ingest: send logs to host. On Android emulator use 10.0.2.2 so the host receives logs.
 */
import { Platform } from 'react-native';

const INGEST_ID = '6b58671e-eb23-45d8-a6fe-a7768139a3fc';
const SESSION_ID = '3d9462';
const HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const URL = `http://${HOST}:7244/ingest/${INGEST_ID}`;

export function sendDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown> = {},
  hypothesisId: string = 'H'
): void {
  const body = JSON.stringify({
    sessionId: SESSION_ID,
    location,
    message,
    data,
    timestamp: Date.now(),
    hypothesisId,
  });
  fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION_ID },
    body,
  }).catch(() => {});
}

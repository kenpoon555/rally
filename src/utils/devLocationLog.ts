/**
 * In-dev-only log store for [Location] messages so they can be shown in-app
 * when Metro/DevTools aren't available (e.g. terminal controlled by another agent).
 */

const MAX_LINES = 12;
const lines: string[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((cb) => cb());
}

export function addLocationLog(message: string, ...args: unknown[]) {
  if (!__DEV__) return;
  const full = args.length ? `${message} ${args.map((a) => String(a)).join(' ')}` : message;
  const line = `[${new Date().toLocaleTimeString()}] ${full}`;
  lines.push(line);
  if (lines.length > MAX_LINES) lines.shift();
  notify();
  // Also log to console so they appear in React Native DevTools
  console.log('[Location]', full);
}

export function getLocationLogLines(): string[] {
  return [...lines];
}

export function subscribeLocationLog(callback: () => void): () => void {
  if (!__DEV__) return () => {};
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function clearLocationLog() {
  if (!__DEV__) return;
  lines.length = 0;
  notify();
}

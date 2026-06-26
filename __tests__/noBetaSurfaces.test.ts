/**
 * Guardrail for App Store Guideline 2.2 (no beta-testing features in production).
 *
 * Scans all shipped source under src/ for user-facing beta-test signals
 * (e.g. "report a bug", "beta feedback", "TestFlight", "closed beta").
 * If this fails, a beta-only surface has crept back into the production app —
 * gate it behind a flag, remove it, or reword the copy before shipping.
 *
 * Skips: comment-only lines, __DEV__-gated lines, and the allowlist below.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(__dirname, '..', 'src');

/** Phrases that must never appear in shipped, non-dev source. */
const DENY: { label: string; re: RegExp }[] = [
  { label: 'report a bug', re: /\breport\s+a?\s*bugs?\b/i },
  { label: 'beta feedback / BetaFeedback', re: /beta\s*feedback/i },
  { label: 'beta test/tester/testing', re: /beta\s*test(?:er|ing)?\b/i },
  { label: 'TestFlight', re: /testflight/i },
  { label: 'founding member', re: /founding\s*members?\b/i },
  { label: 'early access', re: /early\s*access/i },
  { label: 'closed beta', re: /closed\s*beta/i },
  { label: 'join the beta', re: /join\s+the\s+beta/i },
];

/** Files allowed to mention a term for legitimate, non-user-facing reasons. */
const ALLOWLIST: string[] = [];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function isSkippableLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === '') return true;
  // Comment-only lines (//, /*, *, */) — internal notes, not shipped UI.
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return true;
  }
  // Dev-only code paths never ship to the App Store binary.
  if (trimmed.includes('__DEV__')) return true;
  return false;
}

describe('App Store Guideline 2.2 — no beta-testing surfaces in production', () => {
  const files = collectSourceFiles(SRC_DIR);

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('contains no user-facing beta-test signals', () => {
    const violations: string[] = [];

    for (const file of files) {
      if (ALLOWLIST.some((a) => file.endsWith(a))) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        if (isSkippableLine(line)) return;
        for (const { label, re } of DENY) {
          if (re.test(line)) {
            const rel = file.slice(SRC_DIR.length + 1);
            violations.push(`${rel}:${idx + 1} [${label}] → ${line.trim()}`);
          }
        }
      });
    }

    if (violations.length > 0) {
      throw new Error(
        'Beta-testing surface(s) detected in shipped source (Guideline 2.2):\n' +
          violations.join('\n') +
          '\n\nRemove, gate behind a flag, or reword before submitting to the App Store.'
      );
    }
  });
});

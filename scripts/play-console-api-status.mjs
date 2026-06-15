#!/usr/bin/env node
/**
 * Read-only Google Play Developer API checks (releases + store listing).
 * Does NOT read or write policy forms (Target audience, Data safety, App access).
 *
 * Requires: ~/.config/rally/eas-play-submit.json (same SA as EAS submit)
 *
 * Usage:
 *   node scripts/play-console-api-status.mjs
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { google } from 'googleapis';

const PACKAGE = 'app.rally.sports';
const KEY_PATH =
  process.env.PLAY_KEY ||
  path.join(os.homedir(), '.config/rally/eas-play-submit.json');

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`Missing Play service account JSON: ${KEY_PATH}`);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const androidpublisher = google.androidpublisher({ version: 'v3', auth });

  const { data: edit } = await androidpublisher.edits.insert({
    packageName: PACKAGE,
    requestBody: {},
  });
  const editId = edit.id;

  try {
    const { data: tracks } = await androidpublisher.edits.tracks.list({
      packageName: PACKAGE,
      editId,
    });

    console.log('=== Play API — tracks ===');
    for (const track of tracks.tracks ?? []) {
      for (const rel of track.releases ?? []) {
        console.log(
          `  ${track.track}: versionCodes=${(rel.versionCodes ?? []).join(',')} status=${rel.status ?? '?'}`
        );
      }
    }

    const { data: listing } = await androidpublisher.edits.listings.get({
      packageName: PACKAGE,
      editId,
      language: 'en-US',
    });

    console.log('\n=== Play API — store listing (en-US) ===');
    console.log(`  title: ${listing.title ?? '(empty)'}`);
    console.log(`  shortDescription: ${listing.shortDescription ?? '(empty)'}`);
    console.log(
      `  fullDescription: ${(listing.fullDescription ?? '(empty)').slice(0, 120)}…`
    );

    console.log('\n=== Policy dashboard (browser only) ===');
    console.log('  Target audience, Data safety, App access, Content rating');
    console.log('  → Play Console → Dashboard → complete manually');
    console.log('  → Answers: docs/play-console-app-content-checklist.md');
  } finally {
    await androidpublisher.edits.delete({ packageName: PACKAGE, editId });
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

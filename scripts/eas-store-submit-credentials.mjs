#!/usr/bin/env node
/**
 * Upload Play + App Store Connect submit credentials to EAS (Expo servers).
 * CI uses EAS-stored keys when eas.json omits local key paths.
 *
 * Usage:
 *   node scripts/eas-store-submit-credentials.mjs
 *   PLAY_KEY=~/.config/rally/eas-play-submit.json ASC_KEY=~/.config/rally/asc-api-key.p8 node scripts/eas-store-submit-credentials.mjs
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createGraphqlClient } = require('eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient');
const { getOwnerAccountForProjectIdAsync } = require('eas-cli/build/project/projectUtils');
const androidApi = require('eas-cli/build/credentials/android/api/GraphqlClient');
const iosApi = require('eas-cli/build/credentials/ios/api/GraphqlClient');
const { readAndValidateServiceAccountKey } = require('eas-cli/build/credentials/android/utils/googleServiceAccountKey');
const { AssignGoogleServiceAccountKeyForSubmissions } = require('eas-cli/build/credentials/android/actions/AssignGoogleServiceAccountKeyForSubmissions');

const PROJECT_ID = 'c8adc581-8790-4de6-8c81-c4a49d291ffe';
const PROJECT_NAME = 'rallyapp';
const ANDROID_PACKAGE = 'app.rally.sports';
const IOS_BUNDLE_ID = 'com.rallyapp';
const ASC_KEY_ID = '3BV5G9J3QB';
const ASC_ISSUER_ID = 'e14ae888-2737-45b1-a99f-a3fc20dacfb9';
const APPLE_TEAM_ID = '68JKW6NXF6';

function expand(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function getClient() {
  const state = JSON.parse(fs.readFileSync(`${os.homedir()}/.expo/state.json`, 'utf8'));
  return createGraphqlClient({ sessionSecret: state.auth.sessionSecret });
}

async function ensureAndroidPlayKey(client, account, playKeyPath) {
  const app = { account, projectName: PROJECT_NAME, androidApplicationIdentifier: ANDROID_PACKAGE };
  const existing = await androidApi.getAndroidAppCredentialsWithCommonFieldsAsync(client, app);
  if (existing?.googleServiceAccountKeyForSubmissions) {
    const email = existing.googleServiceAccountKeyForSubmissions.clientEmail;
    console.log(`Android: submit key already assigned (${email})`);
    return;
  }

  const jsonKey = readAndValidateServiceAccountKey(playKeyPath);
  const keys = await androidApi.getGoogleServiceAccountKeysForAccountAsync(client, account);
  let gsaKey = keys.find((k) => k.clientEmail === jsonKey.client_email);
  if (!gsaKey) {
    gsaKey = await androidApi.createGoogleServiceAccountKeyAsync(client, account, jsonKey);
    console.log(`Android: uploaded Google Service Account key (${jsonKey.client_email})`);
  } else {
    console.log(`Android: reusing existing key (${gsaKey.clientEmail})`);
  }

  const ctx = { graphqlClient: client, android: androidApi };
  await new AssignGoogleServiceAccountKeyForSubmissions(app).runAsync(ctx, gsaKey);
}

async function ensureIosAscKey(client, account, ascKeyPath) {
  const app = { account, projectName: PROJECT_NAME, bundleIdentifier: IOS_BUNDLE_ID };
  const existing = await iosApi.getIosAppCredentialsWithCommonFieldsAsync(client, app);
  if (existing?.appStoreConnectApiKeyForSubmissions) {
    const kid = existing.appStoreConnectApiKeyForSubmissions.keyIdentifier;
    console.log(`iOS: ASC API key already assigned (${kid})`);
    return;
  }

  const keys = await iosApi.getAscApiKeysForAccountAsync(client, account);
  let ascKey = keys.find((k) => k.keyIdentifier === ASC_KEY_ID);
  if (!ascKey) {
    const keyP8 = fs.readFileSync(ascKeyPath, 'utf8');
    ascKey = await iosApi.createAscApiKeyAsync(client, account, {
      issuerId: ASC_ISSUER_ID,
      keyId: ASC_KEY_ID,
      keyP8,
      teamId: APPLE_TEAM_ID,
      name: 'Rally submit (CI)',
    });
    console.log(`iOS: uploaded ASC API key (${ASC_KEY_ID})`);
  } else {
    console.log(`iOS: reusing existing ASC key (${ascKey.keyIdentifier})`);
  }

  const appCredentials = await iosApi.createOrGetIosAppCredentialsWithCommonFieldsAsync(client, app, {
    appleTeam: ascKey.appleTeam ?? undefined,
  });
  await iosApi.updateIosAppCredentialsAsync(client, appCredentials, {
    ascApiKeyIdForSubmissions: ascKey.id,
  });
  console.log(`iOS: ASC API key assigned to ${IOS_BUNDLE_ID} for submissions`);
}

async function main() {
  const playKeyPath = expand(process.env.PLAY_KEY || `${os.homedir()}/.config/rally/eas-play-submit.json`);
  const ascKeyPath = expand(process.env.ASC_KEY || `${os.homedir()}/.config/rally/asc-api-key.p8`);

  if (!fs.existsSync(playKeyPath)) throw new Error(`Play service account not found: ${playKeyPath}`);
  if (!fs.existsSync(ascKeyPath)) throw new Error(`ASC API key not found: ${ascKeyPath}`);

  const client = getClient();
  const account = await getOwnerAccountForProjectIdAsync(client, PROJECT_ID);
  console.log(`Expo account: ${account.name}`);

  await ensureAndroidPlayKey(client, account, playKeyPath);
  await ensureIosAscKey(client, account, ascKeyPath);

  console.log('\nDone. Remove serviceAccountKeyPath / ascApiKey* from eas.json so CI uses EAS-stored keys.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

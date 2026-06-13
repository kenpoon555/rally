#!/usr/bin/env node
/**
 * Print iOS TestFlight public link + Android install URL guidance.
 * Uses Expo-stored App Store Connect API key (same as ios-fetch-asc-app-id.mjs).
 *
 * Usage: node scripts/fetch-beta-install-urls.mjs
 */
import fs from 'fs';
import os from 'os';
import jwt from 'jsonwebtoken';
import https from 'https';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createGraphqlClient } = require('eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient');
const { withErrorHandlingAsync } = require('eas-cli/build/graphql/client');
const { gql } = require('graphql-tag');
const { AppStoreConnectApiKeyQuery } = require('eas-cli/build/graphql/queries/AppStoreConnectApiKeyQuery');

const ASC_APP_ID = '6777569179';
const ANDROID_PACKAGE = 'app.rally.sports';

function get(path, token) {
  return new Promise((resolve, reject) => {
    https
      .get(
        { hostname: 'api.appstoreconnect.apple.com', path, headers: { Authorization: `Bearer ${token}` } },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(JSON.parse(data || '{}')));
        }
      )
      .on('error', reject);
  });
}

async function ascToken() {
  const state = JSON.parse(fs.readFileSync(`${os.homedir()}/.expo/state.json`, 'utf8'));
  const client = createGraphqlClient({ sessionSecret: state.auth.sessionSecret });
  const keys = await withErrorHandlingAsync(
    client
      .query(
        gql`
          query {
            meActor {
              ... on UserActor {
                accounts {
                  appStoreConnectApiKeysPaginated(first: 1) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {}
      )
      .toPromise()
  );
  const keyNode = keys.meActor.accounts[0].appStoreConnectApiKeysPaginated.edges[0]?.node;
  if (!keyNode) {
    throw new Error('No App Store Connect API key on Expo. Run: eas credentials -p ios');
  }
  const keyDetails = await AppStoreConnectApiKeyQuery.getByIdAsync(client, keyNode.id);
  return jwt.sign({}, keyDetails.keyP8, {
    algorithm: 'ES256',
    expiresIn: '5m',
    audience: 'appstoreconnect-v1',
    issuer: keyDetails.issuerIdentifier,
    header: { alg: 'ES256', kid: keyDetails.keyIdentifier, typ: 'JWT' },
  });
}

async function fetchIosPublicLink(token) {
  const groups = await get(`/v1/betaGroups?filter[app]=${ASC_APP_ID}&limit=20`, token);
  for (const row of groups.data || []) {
    const attrs = row.attributes || {};
    if (attrs.publicLinkEnabled && attrs.publicLink) {
      return attrs.publicLink;
    }
  }
  return null;
}

async function main() {
  const token = await ascToken();
  const iosUrl = await fetchIosPublicLink(token);

  console.log('=== Rally beta install URLs ===\n');

  if (iosUrl) {
    console.log(`IOS_INSTALL_URL=${iosUrl}`);
  } else {
    console.log(
      'IOS_INSTALL_URL=(not found — enable Public Link in App Store Connect → TestFlight → External Testing)'
    );
  }

  console.log(
    `ANDROID_INSTALL_URL=https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
  );
  console.log(
    '\nAndroid internal testers need the opt-in link from Play Console → Testing → Internal testing → Copy link.'
  );
  console.log('Replace ANDROID_INSTALL_URL with that URL if the public listing is not live yet.\n');
  console.log('Set on Supabase (game-invite landing page):');
  console.log('  supabase secrets set IOS_INSTALL_URL="..." ANDROID_INSTALL_URL="..." --project-ref casljueycxsqexpkdiuq');
  console.log('\nOptional — EAS production builds (react-native-config):');
  console.log('  eas env:create --name IOS_INSTALL_URL --value "..." --environment production');
  console.log('  eas env:create --name ANDROID_INSTALL_URL --value "..." --environment production');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

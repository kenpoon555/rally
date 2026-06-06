#!/usr/bin/env node
/**
 * Fetch App Store Connect app ID (ascAppId) for com.rallyapp using Expo-stored ASC API key.
 * Usage: node scripts/ios-fetch-asc-app-id.mjs
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

const BUNDLE_ID = 'com.rallyapp';

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

async function main() {
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
  const token = jwt.sign({}, keyDetails.keyP8, {
    algorithm: 'ES256',
    expiresIn: '5m',
    audience: 'appstoreconnect-v1',
    issuer: keyDetails.issuerIdentifier,
    header: { alg: 'ES256', kid: keyDetails.keyIdentifier, typ: 'JWT' },
  });
  const apps = await get(`/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=1`, token);
  const ascAppId = apps?.data?.[0]?.id;
  if (!ascAppId) {
    console.error(`No App Store Connect app for ${BUNDLE_ID}. Create it at https://appstoreconnect.apple.com/apps`);
    process.exit(1);
  }
  console.log(ascAppId);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

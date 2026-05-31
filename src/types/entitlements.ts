/** Paid / gated features — scaffold only; no paywall UI in beta. */
export const ENTITLEMENT_FEATURES = {
  ORGANIZER_PRO: 'organizer_pro',
  PLAYER_PLUS: 'player_plus',
  LEAGUES: 'leagues',
  ADVANCED_FILTERS: 'advanced_filters',
  PRIVATE_DISCOVERY: 'private_discovery',
} as const;

export type EntitlementFeature =
  (typeof ENTITLEMENT_FEATURES)[keyof typeof ENTITLEMENT_FEATURES];

export type UserEntitlement = {
  id: string;
  user_id: string;
  feature_key: EntitlementFeature | string;
  granted_at: string;
  expires_at: string | null;
  source: string;
  created_at: string;
};

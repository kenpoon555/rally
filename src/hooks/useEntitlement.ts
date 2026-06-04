import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { hasEntitlement } from '../services/entitlementService';
import { EntitlementFeature } from '../types/entitlements';

export function useEntitlement(featureKey: EntitlementFeature) {
  const { user } = useAuth();
  const [entitled, setEntitled] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setEntitled(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setEntitled(await hasEntitlement(featureKey, user.id));
    } catch {
      setEntitled(false);
    } finally {
      setLoading(false);
    }
  }, [featureKey, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entitled, loading, refresh };
}

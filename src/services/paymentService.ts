import { supabase } from './api/supabase';
import { PreferredPayment } from '../types/user';

export type HostPaymentHint = {
  payment_note: string | null;
  preferred_payment: PreferredPayment | null;
  host_username: string;
};

export const setProfilePayment = async (
  paymentNote: string,
  preferredPayment: PreferredPayment | null
): Promise<void> => {
  const { error } = await supabase.rpc('set_profile_payment', {
    p_payment_note: paymentNote,
    p_preferred_payment: preferredPayment,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const getHostPaymentHint = async (
  activityId: string
): Promise<HostPaymentHint | null> => {
  const { data, error } = await supabase.rpc('get_host_payment_hint', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as HostPaymentHint | null) ?? null;
};

export const formatPaymentLabel = (method: PreferredPayment | null | undefined): string => {
  switch (method) {
    case 'venmo':
      return 'Venmo';
    case 'zelle':
      return 'Zelle';
    case 'cash':
      return 'Cash';
    case 'paypal':
      return 'PayPal';
    case 'other':
      return 'Pay';
    default:
      return 'Pay host';
  }
};

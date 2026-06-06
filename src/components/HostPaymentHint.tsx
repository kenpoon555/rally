import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  formatPaymentLabel,
  getHostPaymentHint,
  HostPaymentHint as HostPaymentHintData,
} from '../services/paymentService';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  activityId: string;
  costNote?: string | null;
};

export const HostPaymentHint: React.FC<Props> = ({ activityId, costNote }) => {
  const [hint, setHint] = useState<HostPaymentHintData | null>(null);

  useEffect(() => {
    getHostPaymentHint(activityId)
      .then(setHint)
      .catch(() => setHint(null));
  }, [activityId]);

  if (!costNote && !hint?.payment_note) {
    return null;
  }

  const payLabel = formatPaymentLabel(hint?.preferred_payment);
  const note = hint?.payment_note?.trim();

  return (
    <View style={styles.wrap}>
      {costNote ? <Text style={styles.cost}>Court fee: {costNote}</Text> : null}
      {note ? (
        <Text style={styles.pay}>
          {payLabel}: {note}
          {hint?.host_username ? ` (@${hint.host_username})` : ''}
        </Text>
      ) : costNote ? (
        <Text style={styles.payMuted}>Ask the host in chat how to pay.</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cost: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  pay: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
    lineHeight: 18,
  },
  payMuted: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

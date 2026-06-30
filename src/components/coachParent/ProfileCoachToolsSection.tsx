import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../constants/routes';
import { ProfileSettingsRow } from '../profile/ProfileSettingsRow';
import { colors, spacing } from '../../constants/theme';
import { User } from '../../types/user';
import { formatPaymentLabel } from '../../services/paymentService';

type Props = {
  user: User;
};

export const ProfileCoachToolsSection: React.FC<Props> = ({ user }) => {
  const navigation = useNavigation();
  const sport = user.preferred_sports?.[0] ?? 'Basketball';
  const payment =
    user.payment_note != null
      ? `${formatPaymentLabel(user.preferred_payment)} · ${user.payment_note}`
      : 'Add payment link or note';

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.groupLabel}>Coach Tools</Text>
      <ProfileSettingsRow
        label="Coach Profile"
        value={`${sport} · LA area`}
        onPress={() =>
          navigation.navigate(ROUTES.COACH_PARENT.COACH_PROFILE)
        }
      />
      <ProfileSettingsRow label="Payment link / note" value={payment} onPress={() => {}} />
      <ProfileSettingsRow
        label="Class Templates"
        value="Optional — use Create Class"
        onPress={() =>
          navigation.navigate(ROUTES.ACTIVITY.CREATE, { createMode: 'class' })
        }
      />
      <ProfileSettingsRow
        label="Create Class"
        value="Schedule a class Rally"
        onPress={() =>
          navigation.navigate(ROUTES.ACTIVITY.CREATE, { createMode: 'class' })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

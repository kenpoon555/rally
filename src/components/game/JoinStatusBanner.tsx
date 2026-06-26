import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type JoinCommitmentState = 'joined' | 'confirmed';

type Props = {
  /** `joined` = on roster, not yet confirmed · `confirmed` = ready. */
  state: JoinCommitmentState;
  /** Human time line, e.g. "Mon 7:00 PM". */
  whenLabel?: string | null;
  onConfirm: () => void;
  onCantMakeIt: () => void;
  busy?: boolean;
};

/**
 * Status-first post-join banner for the Join Loop (taste-tier6 J1).
 * Tells the player where they stand, then offers a binary choice in
 * coaching vocabulary: Confirm / Can't make it.
 */
export const JoinStatusBanner: React.FC<Props> = ({
  state,
  whenLabel,
  onConfirm,
  onCantMakeIt,
  busy = false,
}) => {
  const confirmed = state === 'confirmed';
  const title = confirmed
    ? PRODUCT_COPY.joinStatusConfirmedTitle
    : PRODUCT_COPY.joinStatusJoinedTitle;
  const hint = confirmed
    ? PRODUCT_COPY.joinStatusConfirmedHint
    : PRODUCT_COPY.joinStatusJoinedHint;

  return (
    <View
      style={[styles.banner, confirmed ? styles.bannerConfirmed : styles.bannerJoined]}
      testID={`join-status-banner-${state}`}
    >
      <View style={styles.headerRow}>
        <Ionicons
          name={confirmed ? 'checkmark-circle' : 'time-outline'}
          size={20}
          color={confirmed ? colors.success : colors.primaryDark}
        />
        <Text style={styles.title}>
          {title}
          {whenLabel ? <Text style={styles.titleWhen}>{` · ${whenLabel}`}</Text> : null}
        </Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.actions}>
        {!confirmed ? (
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={busy}
            testID="join-status-confirm"
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>{PRODUCT_COPY.confirmAttendance}</Text>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={onCantMakeIt}
          disabled={busy}
          testID="join-status-cant-make-it"
        >
          <Text style={styles.secondaryBtnText}>{PRODUCT_COPY.cantMakeIt}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  bannerJoined: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  bannerConfirmed: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  titleWhen: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryBtnText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryBtnText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

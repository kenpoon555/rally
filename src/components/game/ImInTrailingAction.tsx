import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  needsConfirm: boolean;
  isReady: boolean;
  actionBusy?: boolean;
  onConfirmIn?: () => void;
};

export const ImInTrailingAction: React.FC<Props> = ({
  needsConfirm,
  isReady,
  actionBusy,
  onConfirmIn,
}) => {
  if (needsConfirm && onConfirmIn) {
    return (
      <TouchableOpacity
        style={styles.actionOutline}
        onPress={(event) => {
          event.stopPropagation();
          onConfirmIn();
        }}
        disabled={actionBusy}
      >
        {actionBusy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.actionOutlineText}>{PRODUCT_COPY.imIn}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={isReady ? styles.actionFilled : styles.actionMuted}>
      <Text style={isReady ? styles.actionFilledText : styles.actionMutedText}>
        {isReady ? `${PRODUCT_COPY.imIn} ✓` : PRODUCT_COPY.imIn}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  actionFilled: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionFilledText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  actionMuted: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMutedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionOutline: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOutlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

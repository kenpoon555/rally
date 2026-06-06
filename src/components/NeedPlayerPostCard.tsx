import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NeedPlayerPost } from '../types/needPlayer';
import { formatSkillLevelLabel } from '../services/captainService';
import { colors, radius, spacing, typography } from '../constants/theme';
import { formatActivityTime } from '../utils/activityHelpers';
import { SportBadge } from './SportBadge';
import { PRODUCT_COPY } from '../constants/productCopy';

type Props = {
  post: NeedPlayerPost;
  onPress?: () => void;
  onRequest?: () => void;
  requesting?: boolean;
  disabled?: boolean;
};

export const NeedPlayerPostCard: React.FC<Props> = ({
  post,
  onPress,
  onRequest,
  requesting = false,
  disabled = false,
}) => {
  const spotLabel = `${post.spot_count} spot${post.spot_count === 1 ? '' : 's'}`;
  const requestLabel = post.my_request_accepted
    ? 'Accepted — open game'
    : post.my_request_pending
      ? 'Request sent'
      : requesting
        ? 'Sending…'
        : 'Request spot';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
    >
      <View style={styles.recruitingRibbon}>
        <Text style={styles.recruitingRibbonText}>{PRODUCT_COPY.playRecruitingTitle}</Text>
      </View>
      <View style={styles.headerRow}>
        <SportBadge sport={post.sport} />
        {post.host_is_captain ? (
          <View style={styles.captainBadge}>
            <Text style={styles.captainBadgeText}>Captain</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>
        @{post.host_username} needs {spotLabel}
      </Text>
      <Text style={styles.meta}>
        {formatActivityTime(post.starts_at)}
        {post.location_name ? ` · ${post.location_name}` : ''}
      </Text>
      <Text style={styles.meta}>
        {formatSkillLevelLabel(post.skill_level)}
        {post.location_address ? ` · ${post.location_address}` : ''}
      </Text>
      {post.note ? <Text style={styles.note}>{post.note}</Text> : null}
      {onRequest ? (
        <TouchableOpacity
          style={[
            styles.requestBtn,
            (post.my_request_pending || post.my_request_accepted || disabled) &&
              styles.requestBtnMuted,
          ]}
          onPress={onRequest}
          disabled={
            disabled || requesting || post.my_request_pending || post.my_request_accepted
          }
        >
          <Text style={styles.requestBtnText}>{requestLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  recruitingRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  recruitingRibbonText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  captainBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  captainBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  note: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  requestBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  requestBtnMuted: {
    backgroundColor: colors.border,
  },
  requestBtnText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});

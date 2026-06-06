import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FillInSuggestion } from '../types/fillIn';
import {
  formatAvailabilityLabel,
  formatSkillLabel,
} from '../services/freeAgentService';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  suggestion: FillInSuggestion;
  onInvite?: () => void;
  inviting?: boolean;
};

export const FillInSuggestionCard: React.FC<Props> = ({
  suggestion,
  onInvite,
  inviting = false,
}) => {
  const preset = suggestion.availability?.preset;
  const sourceLabel = suggestion.source === 'free_agent' ? 'Free agent' : 'Active seeker';

  return (
    <View style={styles.card}>
      <Text style={styles.source}>{sourceLabel}</Text>
      <Text style={styles.title}>@{suggestion.username}</Text>
      {suggestion.skill_level ? (
        <Text style={styles.meta}>{formatSkillLabel(suggestion.skill_level)}</Text>
      ) : null}
      {preset ? (
        <Text style={styles.meta}>{formatAvailabilityLabel(preset as 'flexible')}</Text>
      ) : null}
      {suggestion.note ? <Text style={styles.note}>{suggestion.note}</Text> : null}
      {onInvite ? (
        <TouchableOpacity
          style={[styles.inviteBtn, (suggestion.invite_pending || inviting) && styles.inviteBtnMuted]}
          onPress={onInvite}
          disabled={suggestion.invite_pending || inviting}
        >
          <Text style={styles.inviteBtnText}>
            {suggestion.invite_pending ? 'Invite sent' : inviting ? 'Inviting…' : 'Invite'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  source: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  note: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  inviteBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  inviteBtnMuted: {
    backgroundColor: colors.border,
  },
  inviteBtnText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
});

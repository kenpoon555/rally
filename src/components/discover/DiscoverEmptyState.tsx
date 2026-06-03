import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { RegularGroup } from '../../types/regularGroup';
import { buildRegularGroupInviteUrl } from '../../navigation/deepLinking';
import { BETA_COPY } from '../../constants/betaCopy';
import { colors, spacing, typography } from '../../constants/theme';

export interface DiscoverEmptyStateProps {
  sportLabel: string;
  regularGroup: RegularGroup | null;
  onCreateGame: () => void;
  onInviteFriends: () => void;
  onOpenChats: () => void;
}

export const DiscoverEmptyState: React.FC<DiscoverEmptyStateProps> = ({
  sportLabel,
  regularGroup,
  onCreateGame,
  onInviteFriends,
  onOpenChats,
}) => {
  const shareCrewLink = async () => {
    if (!regularGroup?.invite_token) {
      return;
    }
    const url = buildRegularGroupInviteUrl(regularGroup.invite_token);
    await Share.share({
      message: `Join our ${regularGroup.sport_type} crew "${regularGroup.name}" on Rally: ${url}`,
      url,
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>🔍</Text>
      <Text style={styles.title}>No {sportLabel.toLowerCase()} games nearby</Text>
      <Text style={styles.message}>
        {BETA_COPY.headline} Host the first game, share your crew link, or invite friends to fill
        a court.
      </Text>
      <View style={styles.actions}>
        <Button title="Create Game" onPress={onCreateGame} fullWidth />
        {regularGroup ? (
          <Button
            title="Share Rally link"
            variant="secondary"
            onPress={() => void shareCrewLink()}
            fullWidth
          />
        ) : null}
        <Button title="Invite friends" variant="secondary" onPress={onInviteFriends} fullWidth />
        {regularGroup ? (
          <Button title="Open Chats" variant="ghost" onPress={onOpenChats} fullWidth />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
});

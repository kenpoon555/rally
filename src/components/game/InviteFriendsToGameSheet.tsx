import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Activity } from '../../types/activity';
import { activityCourtName, activityGameName } from '../../constants/playIntent';
import { getUserFriends } from '../../services/friendsService';
import {
  inviteFriendToActivity,
  listActivityOutgoingFriendInvites,
} from '../../services/gameFriendInviteService';
import { getApprovedParticipants } from '../../utils/activityHelpers';
import { formatDiscoverWhenLine } from '../../utils/todayDateUtils';
import { Friend } from '../../types/friends';
import { GameFriendOutgoingInvite } from '../../types/gameFriendInvite';
import { Avatar, KeyboardSafeView } from '../ui';
import { getSportIconName } from '../SportIcon';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { shareGameInvite } from '../../services/inviteLinkService';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  activity: Activity;
  isRallyGame?: boolean;
  onClose: () => void;
  onInvited?: () => void;
};

type FriendRow = {
  id: string;
  username: string;
  state: 'invite' | 'invited' | 'on_roster';
};

export const InviteFriendsToGameSheet: React.FC<Props> = ({
  visible,
  activity,
  isRallyGame = false,
  onClose,
  onInvited,
}) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [outgoing, setOutgoing] = useState<GameFriendOutgoingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const rosterIds = useMemo(() => {
    const ids = new Set<string>([activity.user_id]);
    getApprovedParticipants(activity).forEach((row) => {
      if (row.user_id) {
        ids.add(row.user_id);
      }
    });
    return ids;
  }, [activity]);

  const pendingIds = useMemo(
    () => new Set(outgoing.map((row) => row.invited_user_id)),
    [outgoing]
  );

  const load = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setLoading(true);
    try {
      const [friendList, pending] = await Promise.all([
        getUserFriends(user.id),
        listActivityOutgoingFriendInvites(activity.id),
      ]);
      setFriends(friendList);
      setOutgoing(pending);
    } catch {
      setFriends([]);
      setOutgoing([]);
    } finally {
      setLoading(false);
    }
  }, [activity.id, user?.id]);

  useEffect(() => {
    if (visible) {
      void load();
      setQuery('');
    }
  }, [load, visible]);

  const rows = useMemo((): FriendRow[] => {
    const mapped = friends
      .map((friend) => {
        const friendUser = friend.friend;
        const id = friendUser?.id ?? friend.friend_id;
        const username = friendUser?.username ?? 'player';
        if (!id) {
          return null;
        }
        let state: FriendRow['state'] = 'invite';
        if (rosterIds.has(id)) {
          state = 'on_roster';
        } else if (pendingIds.has(id)) {
          state = 'invited';
        }
        return { id, username, state };
      })
      .filter((row): row is FriendRow => row != null);

    const q = query.trim().toLowerCase();
    if (!q) {
      return mapped;
    }
    return mapped.filter((row) => row.username.toLowerCase().includes(q));
  }, [friends, pendingIds, query, rosterIds]);

  const handleInvite = async (friendUserId: string) => {
    setBusyId(friendUserId);
    try {
      await inviteFriendToActivity(activity.id, friendUserId);
      await load();
      onInvited?.();
    } catch (error: unknown) {
      Alert.alert(
        'Could not invite',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const shareLink = async () => {
    await shareGameInvite(activity, { asHost: isHost });
  };

  const isHost = user?.id === activity.user_id;
  const sportIcon = getSportIconName(activity.sport_type);
  const hasCustomTitle = Boolean(activity.listing_title?.trim());
  const headline = hasCustomTitle ? activityGameName(activity) : activityCourtName(activity);
  const whenLine = formatDiscoverWhenLine(activity.start_time);
  const shareLinkHint = isHost
    ? PRODUCT_COPY.shareHostGameInviteLinkHint
    : PRODUCT_COPY.shareGameInviteLinkHint;

  const renderAction = (row: FriendRow) => {
    if (row.state === 'on_roster') {
      return (
        <View style={styles.statusPill}>
          <Text style={styles.statusMember}>{PRODUCT_COPY.gameFriendOnRoster}</Text>
        </View>
      );
    }
    if (row.state === 'invited') {
      return (
        <View style={[styles.statusPill, styles.statusPillInvited]}>
          <Ionicons name="checkmark" size={14} color={colors.primary} />
          <Text style={styles.statusInvited}>{PRODUCT_COPY.rallyInviteSent}</Text>
        </View>
      );
    }
    const busy = busyId === row.id;
    return (
      <TouchableOpacity
        style={[styles.inviteBtn, busy && styles.inviteBtnBusy]}
        onPress={() => void handleInvite(row.id)}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={styles.inviteBtnText}>Invite</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardSafeView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{PRODUCT_COPY.inviteFriendsToGame}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name={sportIcon} size={28} color={colors.text} />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroName} numberOfLines={2}>
              {headline}
            </Text>
            <Text style={styles.heroWhen}>{whenLine}</Text>
            <Text style={styles.heroHint}>
              {isRallyGame
                ? PRODUCT_COPY.inviteFriendsToGameRallyHint
                : PRODUCT_COPY.inviteFriendsToGameHint}
            </Text>
            <Text style={styles.heroShareHint}>{shareLinkHint}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search friends"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤝</Text>
            <Text style={styles.emptyTitle}>No friends to invite yet</Text>
            <Text style={styles.emptyHint}>{PRODUCT_COPY.inviteFriendsToRallyEmpty}</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar name={item.username} size="md" />
                <Text style={styles.username}>@{item.username}</Text>
                {renderAction(item)}
              </View>
            )}
          />
        )}

        {activity.id ? (
          <TouchableOpacity style={styles.linkRow} onPress={() => void shareLink()}>
            <Ionicons name="link-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.linkText}>
              {isRallyGame ? PRODUCT_COPY.shareGameInviteLinkRally : PRODUCT_COPY.shareGameInviteLink}
            </Text>
          </TouchableOpacity>
        ) : null}
      </KeyboardSafeView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancel: {
    ...typography.bodyMedium,
    color: colors.primary,
    width: 56,
  },
  headerTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 56,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(11, 122, 94, 0.12)',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  heroBody: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    ...typography.headline,
    fontSize: 17,
    color: colors.text,
    marginBottom: 2,
  },
  heroWhen: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  heroHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  heroShareHint: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 18,
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 4,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  username: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  inviteBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    minWidth: 72,
    alignItems: 'center',
  },
  inviteBtnBusy: {
    opacity: 0.7,
  },
  inviteBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillInvited: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  statusMember: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  statusInvited: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  linkText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});

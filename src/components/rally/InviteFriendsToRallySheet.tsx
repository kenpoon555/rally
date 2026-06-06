import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getUserFriends } from '../../services/friendsService';
import {
  inviteFriendToRegularGroup,
  listRegularGroupOutgoingInvites,
  RegularGroupMemberRow,
} from '../../services/regularGroupService';
import { RegularGroup } from '../../types/regularGroup';
import { Friend } from '../../types/friends';
import { RallyOutgoingInvite } from '../../types/rallyInvite';
import { Avatar } from '../ui';
import { SportIcon } from '../SportIcon';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { buildRegularGroupInviteUrl } from '../../navigation/deepLinking';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  group: RegularGroup;
  members: RegularGroupMemberRow[];
  onClose: () => void;
  onInvited?: () => void;
};

type FriendRow = {
  id: string;
  username: string;
  state: 'invite' | 'invited' | 'member';
};

export const InviteFriendsToRallySheet: React.FC<Props> = ({
  visible,
  group,
  members,
  onClose,
  onInvited,
}) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [outgoing, setOutgoing] = useState<RallyOutgoingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  );

  const pendingIds = useMemo(
    () => new Set(outgoing.map((o) => o.invited_user_id)),
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
        listRegularGroupOutgoingInvites(group.id),
      ]);
      setFriends(friendList);
      setOutgoing(pending);
    } catch {
      setFriends([]);
      setOutgoing([]);
    } finally {
      setLoading(false);
    }
  }, [group.id, user?.id]);

  useEffect(() => {
    if (visible) {
      void load();
      setQuery('');
    }
  }, [load, visible]);

  const rows = useMemo((): FriendRow[] => {
    const mapped = friends
      .map((f) => {
        const friendUser = f.friend;
        const id = friendUser?.id ?? f.friend_id;
        const username = friendUser?.username ?? 'player';
        if (!id) {
          return null;
        }
        let state: FriendRow['state'] = 'invite';
        if (memberIds.has(id)) {
          state = 'member';
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
  }, [friends, memberIds, pendingIds, query]);

  const handleInvite = async (friendUserId: string) => {
    setBusyId(friendUserId);
    try {
      await inviteFriendToRegularGroup(group.id, friendUserId);
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
    if (!group.invite_token) {
      return;
    }
    const url = buildRegularGroupInviteUrl(group.invite_token);
    await Share.share({
      message: `Join our ${group.sport_type} Rally "${group.name}" on Rally: ${url}`,
      url,
    });
  };

  const renderAction = (row: FriendRow) => {
    if (row.state === 'member') {
      return (
        <View style={styles.statusPill}>
          <Text style={styles.statusMember}>{PRODUCT_COPY.rallyInviteInCrew}</Text>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite friends</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <SportIcon sport={group.sport_type} size="lg" style={styles.heroIcon} />
          <View style={styles.heroBody}>
            <Text style={styles.heroName} numberOfLines={2}>
              {group.name}
            </Text>
            <Text style={styles.heroHint}>{PRODUCT_COPY.shareRallyInviteHint}</Text>
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
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar name={item.username} size="md" />
                <Text style={styles.username}>@{item.username}</Text>
                {renderAction(item)}
              </View>
            )}
          />
        )}

        <TouchableOpacity style={styles.linkRow} onPress={() => void shareLink()}>
          <Ionicons name="link-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>{PRODUCT_COPY.shareRallyInviteLink}</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 4,
  },
  heroHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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

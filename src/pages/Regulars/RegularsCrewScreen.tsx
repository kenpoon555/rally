import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getRegularGroupById,
  getRegularGroupMembers,
  RegularGroupMemberRow,
} from '../../services/regularGroupService';
import { listCrewSessionCards } from '../../services/sessionCardService';
import { SessionCardPayload } from '../../types/sessionCard';
import { activityFromSessionCard } from '../../utils/sessionCardHelpers';
import { getTournamentsForGroup } from '../../services/miniTournamentService';
import { RegularGroup } from '../../types/regularGroup';
import { MiniTournament } from '../../types/miniTournament';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { ensureCrewConversation } from '../../services/chatService';
import { shareRallyGroupInvite } from '../../services/inviteLinkService';
import { updateRegularGroupName } from '../../services/regularGroupService';
import { RallyTabBar, RallyHubTab } from '../../components/rally/RallyTabBar';
import { RallyHubHeader } from '../../components/rally/RallyHubHeader';
import { InviteFriendsToRallySheet } from '../../components/rally/InviteFriendsToRallySheet';
import { countPlayTabActions } from '../../utils/playTabActions';
import { RallyChatPanel } from '../../components/rally/RallyChatPanel';
import { RallyPlayPanel } from '../../components/rally/RallyPlayPanel';
import { RallyCrewPanel } from '../../components/rally/RallyCrewPanel';
import { KeyboardSafeView } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export type RegularsCrewStackParams = {
  RegularsCrew: {
    groupId: string;
    initialTab?: RallyHubTab;
    promptShareInvite?: boolean;
  };
};

type Props = NativeStackScreenProps<RegularsCrewStackParams, 'RegularsCrew'>;

const RegularsCrewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { groupId, initialTab, promptShareInvite } = route.params;
  const { user } = useAuth();
  const [tab, setTab] = useState<RallyHubTab>(initialTab ?? 'chat');
  const sharePromptHandled = useRef(false);
  const [group, setGroup] = useState<RegularGroup | null>(null);
  const [members, setMembers] = useState<RegularGroupMemberRow[]>([]);
  const [tournaments, setTournaments] = useState<MiniTournament[]>([]);
  const [sessionCards, setSessionCards] = useState<SessionCardPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRefreshToken, setInviteRefreshToken] = useState(0);

  const activities = useMemo(
    () => sessionCards.map((card) => activityFromSessionCard(card)),
    [sessionCards]
  );

  const playActionCount = useMemo(
    () => countPlayTabActions(sessionCards),
    [sessionCards]
  );

  const bootstrapChat = useCallback(async () => {
    setChatLoading(true);
    setChatError(null);
    try {
      const convoId = await ensureCrewConversation(groupId);
      setConversationId(convoId);
    } catch (error: unknown) {
      setConversationId(null);
      setChatError(error instanceof Error ? error.message : 'Could not open Rally chat.');
    } finally {
      setChatLoading(false);
    }
  }, [groupId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, m, t] = await Promise.all([
        getRegularGroupById(groupId),
        getRegularGroupMembers(groupId),
        getTournamentsForGroup(groupId),
      ]);
      setGroup(g);
      setMembers(m);
      setTournaments(t);

      try {
        setSessionCards(await listCrewSessionCards(groupId));
      } catch (sessionError: unknown) {
        setSessionCards([]);
        const raw =
          sessionError instanceof Error ? sessionError.message : 'Could not load games.';
        const message = raw.includes('start_time')
          ? 'Could not load games for this Rally. Pull down to refresh.'
          : raw;
        Alert.alert(PRODUCT_COPY.rally, message);
      }
    } catch (error: unknown) {
      Alert.alert(PRODUCT_COPY.rally, error instanceof Error ? error.message : 'Could not load Rally.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(), bootstrapChat()]);
  }, [bootstrapChat, load]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void bootstrapChat();
    }, [bootstrapChat, load])
  );

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!promptShareInvite || !group?.invite_token || sharePromptHandled.current) {
      return;
    }
    sharePromptHandled.current = true;
    navigation.setParams({ promptShareInvite: false } as never);
    void shareRallyGroupInvite(group);
  }, [group, navigation, promptShareInvite]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const isHost = group?.host_id === user?.id;
  const isMember = useMemo(
    () => Boolean(isHost || members.some((member) => member.user_id === user?.id)),
    [isHost, members, user?.id]
  );

  const handleRename = useCallback(
    async (name: string) => {
      if (!group) {
        return;
      }
      setRenaming(true);
      try {
        const updated = await updateRegularGroupName(group.id, name);
        setGroup(updated);
      } catch (error: unknown) {
        throw error instanceof Error ? error : new Error('Try again.');
      } finally {
        setRenaming(false);
      }
    },
    [group]
  );

  if (loading && !group) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Rally not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardSafeView style={styles.container}>
      <RallyHubHeader
        group={group}
        members={members}
        isHost={Boolean(isHost)}
        savingName={renaming}
        onSaveName={isHost ? handleRename : undefined}
        onInviteFriends={() => setInviteOpen(true)}
      />

      <InviteFriendsToRallySheet
        visible={inviteOpen}
        group={group}
        members={members}
        onClose={() => setInviteOpen(false)}
        onInvited={() => {
          void load();
          setInviteRefreshToken((n) => n + 1);
        }}
      />

      <RallyTabBar active={tab} onChange={setTab} playActionCount={playActionCount} />

      {tab === 'chat' ? (
        <RallyChatPanel
          groupId={groupId}
          groupName={group.name}
          conversationId={conversationId}
          chatError={chatError}
          chatLoading={chatLoading}
          onRetryChat={() => void bootstrapChat()}
          onGoToPlay={() => setTab('play')}
          navigation={navigation}
        />
      ) : null}

      {tab === 'play' ? (
        <RallyPlayPanel
          group={group}
          sessionCards={sessionCards}
          tournaments={tournaments}
          isHost={Boolean(isHost)}
          isMember={Boolean(isMember)}
          busyActivityId={busyActivityId}
          setBusyActivityId={setBusyActivityId}
          onReload={refreshAll}
          navigation={navigation}
        />
      ) : null}

      {tab === 'members' ? (
        <RallyCrewPanel
          group={group}
          groupId={groupId}
          members={members}
          activities={activities}
          viewerId={user?.id}
          isHost={Boolean(isHost)}
          onReload={refreshAll}
          inviteRefreshToken={inviteRefreshToken}
        />
      ) : null}
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  error: {
    color: colors.error,
  },
});

export default RegularsCrewScreen;

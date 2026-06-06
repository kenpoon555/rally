import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { ROUTES } from '../../constants/routes';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { ensureCrewConversation } from '../../services/chatService';
import { updateRegularGroupName } from '../../services/regularGroupService';
import { RallyTabBar, RallyHubTab } from '../../components/rally/RallyTabBar';
import { RallyHubHeader } from '../../components/rally/RallyHubHeader';
import { InviteFriendsToRallySheet } from '../../components/rally/InviteFriendsToRallySheet';
import { RallyNextGameCard } from '../../components/rally/RallyNextGameCard';
import { RallyChatPanel } from '../../components/rally/RallyChatPanel';
import { RallyPlayPanel } from '../../components/rally/RallyPlayPanel';
import { RallyCrewPanel } from '../../components/rally/RallyCrewPanel';
import { colors, spacing } from '../../constants/theme';

export type RegularsCrewStackParams = {
  RegularsCrew: { groupId: string };
};

type Props = NativeStackScreenProps<RegularsCrewStackParams, 'RegularsCrew'>;

const RegularsCrewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [tab, setTab] = useState<RallyHubTab>('chat');
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

  const activities = useMemo(
    () => sessionCards.map((card) => activityFromSessionCard(card)),
    [sessionCards]
  );
  const upcoming = activities.filter((a) => a.status === 'active');
  const nextActivity = upcoming[0] ?? null;

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
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const openGameRoom = useCallback(
    async (activityId: string) => {
      try {
        const convoId = conversationId ?? (await ensureCrewConversation(groupId));
        navigation.navigate(ROUTES.CHAT.THREAD as never, {
          conversationId: convoId,
          title: group?.name ? PRODUCT_COPY.rallyChatTitle(group.name) : PRODUCT_COPY.rallyChat,
          activityId,
          groupId,
        } as never);
      } catch (error: unknown) {
        Alert.alert(
          'Chat unavailable',
          error instanceof Error ? error.message : 'Could not open game room.'
        );
      }
    },
    [conversationId, group?.name, groupId, navigation]
  );

  const isHost = group?.host_id === user?.id;

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
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
        onInvited={() => void load()}
      />

      {nextActivity && tab === 'chat' ? (
        <RallyNextGameCard
          activity={nextActivity}
          onPress={() => setTab('play')}
          onOpenGameRoom={() => void openGameRoom(nextActivity.id)}
        />
      ) : null}

      <RallyTabBar active={tab} onChange={setTab} />

      {tab === 'chat' ? (
        <RallyChatPanel
          groupId={groupId}
          groupName={group.name}
          conversationId={conversationId}
          chatError={chatError}
          chatLoading={chatLoading}
          onRetryChat={() => void bootstrapChat()}
          navigation={navigation}
        />
      ) : null}

      {tab === 'play' ? (
        <RallyPlayPanel
          group={group}
          sessionCards={sessionCards}
          tournaments={tournaments}
          isHost={Boolean(isHost)}
          busyActivityId={busyActivityId}
          setBusyActivityId={setBusyActivityId}
          onReload={refreshAll}
          navigation={navigation}
          onOpenGameRoom={(activityId) => void openGameRoom(activityId)}
        />
      ) : null}

      {tab === 'crew' ? (
        <RallyCrewPanel
          group={group}
          groupId={groupId}
          members={members}
          activities={activities}
          viewerId={user?.id}
          isHost={Boolean(isHost)}
          onReload={refreshAll}
          onInviteFriends={() => setInviteOpen(true)}
        />
      ) : null}
    </KeyboardAvoidingView>
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

import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { RegularGroup } from '../../types/regularGroup';
import { GameRecapCard } from '../GameRecapCard';
import { HostPaymentHint } from '../HostPaymentHint';
import { SportIcon } from '../SportIcon';
import { VenueBlock } from '../VenueBlock';
import { GameCardTypePill } from './GameCardTypePill';
import { GameCardWhoGoing } from './GameCardWhoGoing';
import { RosterSeatBar } from './RosterSeatBar';
import { activityListingHeadline, playIntentLabel } from '../../constants/playIntent';
import { PRODUCT_COPY } from '../../constants/productCopy';
import { GameParticipantAvatar } from '../../utils/activityHelpers';
import { colors, radius, spacing } from '../../constants/theme';

export type GameCardDetailHeroProps = {
  activity: Activity;
  timeLabel: string;
  isRallyGame: boolean;
  isPastGame: boolean;
  isHost: boolean;
  isFinalized: boolean;
  wasOnGame: boolean;
  fromGameRoom?: boolean;
  canGoBack: boolean;
  showChat: boolean;
  showTonight: boolean;
  listingActive: boolean;
  regularGroup: RegularGroup | null;
  recapId: string | null;
  rosterItems: GameParticipantAvatar[];
  rosterTotal: number;
  pendingItems: GameParticipantAvatar[];
  pendingCount: number;
  readyCount: number;
  rosterCount: number;
  statusSchedulingDescriptor: string;
  statusDetailLine?: string;
  collectingDeadlineLabel?: string;
  preferenceDeadline?: string | null;
  expiresLabel: string | null;
  showPostGameAttendance: boolean;
  sessionNoteDraft: string;
  costNoteDraft: string;
  savingSessionNote: boolean;
  savingCostNote: boolean;
  onOpenRegularGroup: () => void;
  onReportCourt: () => void;
  onPendingPress?: () => void;
  onPlayerPress: (player: GameParticipantAvatar) => void;
  onSessionNoteChange: (value: string) => void;
  onSessionNoteBlur: () => void;
  onCostNoteChange: (value: string) => void;
  onCostNoteBlur: () => void;
};

export const GameCardDetailHero: React.FC<GameCardDetailHeroProps> = ({
  activity,
  timeLabel,
  isRallyGame,
  isPastGame,
  isHost,
  isFinalized,
  wasOnGame,
  fromGameRoom,
  canGoBack,
  showChat,
  showTonight,
  listingActive,
  regularGroup,
  recapId,
  rosterItems,
  rosterTotal,
  pendingItems,
  pendingCount,
  readyCount,
  rosterCount,
  statusSchedulingDescriptor,
  statusDetailLine,
  collectingDeadlineLabel,
  preferenceDeadline,
  expiresLabel,
  showPostGameAttendance,
  sessionNoteDraft,
  costNoteDraft,
  savingSessionNote,
  savingCostNote,
  onOpenRegularGroup,
  onReportCourt,
  onPendingPress,
  onPlayerPress,
  onSessionNoteChange,
  onSessionNoteBlur,
  onCostNoteChange,
  onCostNoteBlur,
}) => {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <GameCardTypePill
          isRallyGame={isRallyGame}
          inviteOnly={activity.visibility === 'invite_only'}
        />
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {isPastGame ? 'played' : activity.match_status || 'open'}
          </Text>
        </View>
      </View>

      <View style={styles.heroIdentityRow}>
        <SportIcon sport={activity.sport_type} size="md" variant="ring" />
        <View style={styles.heroTitleBlock}>
          <Text style={styles.heroListingTitle}>{activityListingHeadline(activity)}</Text>
          <Text style={styles.heroSportLabel}>{activity.sport_type}</Text>
          {playIntentLabel(activity.play_intent) ? (
            <Text style={styles.heroIntent}>{playIntentLabel(activity.play_intent)}</Text>
          ) : null}
        </View>
      </View>

      {regularGroup ? (
        <TouchableOpacity onPress={onOpenRegularGroup} style={styles.rallyCrewLink}>
          <Ionicons name="people-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.rallyCrewLinkText}>{regularGroup.name}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.heroTime}>{timeLabel}</Text>
      <Text style={styles.heroLocation}>{activity.location?.name || 'Court TBD'}</Text>

      {isPastGame && recapId ? (
        <View style={styles.recapWrap}>
          <GameRecapCard recapId={recapId} />
        </View>
      ) : null}

      {activity.location_id && !isPastGame ? (
        <VenueBlock locationId={activity.location_id} compact />
      ) : null}

      {activity.location_id && !isPastGame && (isHost || wasOnGame) ? (
        <TouchableOpacity onPress={onReportCourt}>
          <Text style={styles.courtReportLink}>Report court issue</Text>
        </TouchableOpacity>
      ) : null}

      <GameCardWhoGoing
        rosterItems={rosterItems}
        totalCount={rosterTotal}
        pendingItems={isHost ? pendingItems : []}
        pendingCount={isHost ? pendingCount : 0}
        maxVisible={6}
        readySummary={
          !isFinalized
            ? `${readyCount} of ${rosterCount} marked ready${
                readyCount < rosterCount ? " · amber dot = still waiting" : ''
              }`
            : undefined
        }
        onPendingPress={onPendingPress}
        onPlayerPress={onPlayerPress}
        style={styles.whoGoingInHero}
      />

      {!isPastGame ? (
        <>
          <View style={styles.seatBarWrap}>
            <RosterSeatBar
              sportType={activity.sport_type}
              activity={activity}
              variant="wide"
              align="left"
            />
          </View>
          <Text style={styles.heroMeta}>{statusSchedulingDescriptor}</Text>
        </>
      ) : null}

      {!isPastGame && statusDetailLine && activity.scheduling_mode === 'flex' ? (
        <Text style={styles.statusDetailLine}>{statusDetailLine}</Text>
      ) : null}

      {!isPastGame && preferenceDeadline && activity.match_status === 'collecting' && collectingDeadlineLabel ? (
        <Text style={styles.deadlineText}>
          {collectingDeadlineLabel}: {new Date(preferenceDeadline).toLocaleString()}
        </Text>
      ) : null}

      {showTonight ? <Text style={styles.urgentText}>Need players tonight</Text> : null}

      {!isHost ? <HostPaymentHint activityId={activity.id} costNote={activity.cost_note} /> : null}

      {!isHost && activity.session_note ? (
        <Text style={styles.costNoteText}>Session: {activity.session_note}</Text>
      ) : null}

      {isHost && !isPastGame ? (
        <View style={styles.costNoteBlock}>
          <Text style={styles.costNoteLabel}>
            Session announcement (optional)
            {savingSessionNote ? ' · Saving…' : ''}
          </Text>
          <TextInput
            style={styles.costNoteInput}
            value={sessionNoteDraft}
            onChangeText={onSessionNoteChange}
            onBlur={onSessionNoteBlur}
            placeholder="e.g. Court 3 · bring cash for lights"
            maxLength={200}
          />
        </View>
      ) : null}

      {isHost && !isPastGame ? (
        <View style={styles.costNoteBlock}>
          <Text style={styles.costNoteLabel}>
            Cost note (optional)
            {savingCostNote ? ' · Saving…' : ''}
          </Text>
          <TextInput
            style={styles.costNoteInput}
            value={costNoteDraft}
            onChangeText={onCostNoteChange}
            onBlur={onCostNoteBlur}
            placeholder="e.g. ~$8/person court · BYO drinks"
            maxLength={120}
          />
          <Text style={styles.costNoteHint}>
            Saves when you leave the field. Shown in Details and Game Room.
          </Text>
        </View>
      ) : null}

      {isPastGame && (activity.session_note || activity.cost_note) ? (
        <View style={styles.pastNotesBlock}>
          {activity.session_note ? (
            <Text style={styles.costNoteText}>Session: {activity.session_note}</Text>
          ) : null}
          {activity.cost_note ? (
            <Text style={styles.costNoteText}>Cost: {activity.cost_note}</Text>
          ) : null}
        </View>
      ) : null}

      {isPastGame && !recapId && isHost && showPostGameAttendance ? (
        <Text style={styles.pastGameHint}>
          Record who showed up to generate a shareable recap for your Rally.
        </Text>
      ) : null}

      {expiresLabel ? (
        <Text style={styles.expiresText}>
          {listingActive ? 'Listing open until' : 'Listing ended'}: {expiresLabel}
        </Text>
      ) : null}

      {isRallyGame && !isPastGame && wasOnGame ? (
        <Text style={styles.rallyHubHint}>{PRODUCT_COPY.rallyPlayTabHint}</Text>
      ) : null}

      {showChat && fromGameRoom && canGoBack ? (
        <Text style={styles.gameRoomHint}>{PRODUCT_COPY.gameCardBackHint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  heroTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroListingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  heroSportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  rallyCrewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  rallyCrewLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  rallyHubHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  heroIntent: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  heroTime: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  heroLocation: {
    marginTop: spacing.xs + 2,
    fontSize: 15,
    color: colors.textSecondary,
  },
  courtReportLink: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  heroMeta: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
  },
  seatBarWrap: {
    marginTop: spacing.sm,
  },
  whoGoingInHero: {
    marginTop: spacing.md,
  },
  statusDetailLine: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    lineHeight: 17,
  },
  deadlineText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  urgentText: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  costNoteBlock: {
    marginTop: spacing.md,
  },
  costNoteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  costNoteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  costNoteHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textTertiary,
  },
  costNoteText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pastNotesBlock: {
    marginTop: spacing.sm,
    gap: 4,
  },
  pastGameHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  expiresText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textTertiary,
  },
  gameRoomHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recapWrap: {
    marginTop: spacing.md,
  },
});

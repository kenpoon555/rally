import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Activity } from '../../types/activity';
import { getRosterSeatCaption, getRosterSeatCounts } from '../../utils/activityHelpers';
import { getSportIconName } from '../SportIcon';
import { colors, typography } from '../../constants/theme';

const MAX_DOTS = 10;
const DOT_COMPACT = 10;
const DOT_WIDE = 12;
const ICON_COMPACT = 7;
const ICON_WIDE = 8;

type Props = {
  sportType: string;
  activity: Pick<
    Activity,
    'roster_min' | 'roster_max' | 'player_count' | 'missing_players' | 'match_status'
  >;
  onRoster?: number;
  align?: 'left' | 'right';
  /** `wide` = full-width hero row; `compact` = list trailing column */
  variant?: 'compact' | 'wide';
};

/** Seat dots: sport icon = filled, open ring = empty. Caption reads naturally. */
export const RosterSeatBar: React.FC<Props> = ({
  sportType,
  activity,
  onRoster,
  align = 'right',
  variant = 'compact',
}) => {
  const { filled, total } = getRosterSeatCounts(activity, onRoster);
  const slots = Math.min(Math.max(total, 1), MAX_DOTS);
  const filledDots = Math.min(filled, slots);
  const iconName = getSportIconName(sportType);
  const { label, tone } = getRosterSeatCaption(filled, total);
  const isWide = variant === 'wide';
  const dotSize = isWide ? DOT_WIDE : DOT_COMPACT;
  const iconSize = isWide ? ICON_WIDE : ICON_COMPACT;

  const seatDots = (
    <View style={[styles.dotsRow, isWide ? styles.dotsRowWide : styles.dotsRowCompact]}>
      {Array.from({ length: slots }, (_, index) => {
        const taken = index < filledDots;
        return taken ? (
          <View
            key={index}
            style={[
              styles.seat,
              { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
              styles.seatFilled,
            ]}
          >
            <MaterialCommunityIcons name={iconName} size={iconSize} color={colors.primaryDark} />
          </View>
        ) : (
          <View
            key={index}
            style={[
              styles.seat,
              { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
              styles.seatOpen,
            ]}
          />
        );
      })}
    </View>
  );

  const caption = (
    <Text
      style={[
        isWide ? styles.captionWide : styles.captionCompact,
        tone === 'full' ? styles.captionFull : styles.captionOpen,
        align === 'right' ? styles.captionRight : styles.captionLeft,
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );

  return (
    <View
      style={[
        isWide ? styles.stackWide : styles.stackCompact,
        align === 'right' ? styles.alignRight : styles.alignLeft,
      ]}
    >
      {seatDots}
      {caption}
    </View>
  );
};

/** @deprecated Use RosterSeatBar */
export const RosterFillBadge = RosterSeatBar;

/** @deprecated Use RosterSeatBar */
export const GameListSpotsMeter = RosterSeatBar;

const styles = StyleSheet.create({
  stackWide: {
    width: '100%',
    gap: 6,
  },
  stackCompact: {
    gap: 4,
    maxWidth: 112,
  },
  alignRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dotsRowWide: {
    gap: 5,
    width: '100%',
  },
  dotsRowCompact: {
    gap: 3,
    justifyContent: 'flex-end',
  },
  seat: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatFilled: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  seatOpen: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captionWide: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  captionCompact: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  captionFull: {
    color: colors.primaryDark,
  },
  captionOpen: {
    color: colors.textTertiary,
  },
  captionRight: {
    textAlign: 'right',
  },
  captionLeft: {
    textAlign: 'left',
  },
});

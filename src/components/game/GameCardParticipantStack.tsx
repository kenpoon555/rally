import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { Activity } from '../../types/activity';
import { getGameParticipantPreview } from '../../utils/activityHelpers';
import { MemberAvatarStack } from '../ui/MemberAvatarStack';

type Props = {
  activity: Activity;
  maxVisible?: number;
  style?: ViewStyle;
};

/** Overlapping avatar row for list cards — Rally carousel style, no "Who's going" label. */
export function GameCardParticipantStack({
  activity,
  maxVisible = 4,
  style,
}: Props) {
  const preview = useMemo(() => getGameParticipantPreview(activity), [activity]);

  if (preview.total === 0) {
    return null;
  }

  return (
    <MemberAvatarStack
      rosterItems={preview.players.map((player) => ({
        key: player.key,
        username: player.username,
        userId: player.userId,
      }))}
      totalCount={preview.total}
      maxVisible={maxVisible}
      overlapping
      size="sm"
      style={style}
    />
  );
}

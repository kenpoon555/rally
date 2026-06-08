import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GameModeKind } from '../../constants/gameModes';
import { colors, radius, typography } from '../../constants/theme';

type Props = {
  label: string;
  kind?: GameModeKind;
};

export const GameModeChip: React.FC<Props> = ({ label, kind = 'activity' }) => {
  const isTournament = kind === 'tournament';

  return (
    <View style={[styles.chip, isTournament ? styles.chipTournament : styles.chipPickup]}>
      <Text style={[styles.text, isTournament ? styles.textTournament : styles.textPickup]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
  },
  chipPickup: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipTournament: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(11, 122, 94, 0.25)',
  },
  text: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  textPickup: {
    color: colors.textSecondary,
  },
  textTournament: {
    color: colors.primaryDark,
  },
});

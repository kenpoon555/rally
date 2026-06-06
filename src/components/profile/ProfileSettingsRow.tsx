import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/theme';

type Props = {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
};

export const ProfileSettingsRow: React.FC<Props> = ({
  label,
  value,
  onPress,
  showChevron = true,
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.main}>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </View>
    {showChevron && onPress ? <Text style={styles.chevron}>›</Text> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.textTertiary,
    marginLeft: 8,
  },
});

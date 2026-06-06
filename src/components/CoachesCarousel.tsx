import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CoachListing } from '../types/sportTemplate';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  coaches: CoachListing[];
};

export const CoachesCarousel: React.FC<Props> = ({ coaches }) => {
  if (coaches.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Coaches & clinics</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {coaches.map((coach) => (
          <View key={coach.id} style={styles.card}>
            <Text style={styles.name}>{coach.name}</Text>
            <Text style={styles.sport}>{coach.sport}</Text>
            {coach.schedule_note ? (
              <Text style={styles.note}>{coach.schedule_note}</Text>
            ) : null}
            {coach.promo_note ? <Text style={styles.promo}>{coach.promo_note}</Text> : null}
            {coach.booking_url ? (
              <TouchableOpacity onPress={() => void Linking.openURL(coach.booking_url!)}>
                <Text style={styles.link}>Book / learn more</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: 220,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  sport: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  promo: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});

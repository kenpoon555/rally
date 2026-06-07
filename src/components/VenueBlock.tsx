import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getLocationVenueDetails } from '../services/venueService';
import { openMaps } from '../utils/mapsLink';
import { VenueDetails } from '../types/gameRecap';
import { PLAY_PARTNER_SURFACES_ENABLED } from '../constants/betaFlags';
import { colors, radius, spacing, typography } from '../constants/theme';

type Props = {
  locationId?: string | null;
  venue?: VenueDetails | null;
  /** Less padding — same fields as default */
  compact?: boolean;
  /** Game room: promo + links only (name/time already in header) */
  minimal?: boolean;
  /** Text links in a row — no card chrome */
  inline?: boolean;
};

export const VenueBlock: React.FC<Props> = ({
  locationId,
  venue: venueProp,
  compact,
  minimal,
  inline,
}) => {
  const [venue, setVenue] = useState<VenueDetails | null>(venueProp ?? null);
  const [loading, setLoading] = useState(Boolean(locationId && !venueProp));

  useEffect(() => {
    if (venueProp) {
      setVenue(venueProp);
      setLoading(false);
      return;
    }
    if (!locationId) {
      setVenue(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getLocationVenueDetails(locationId)
      .then(setVenue)
      .catch(() => setVenue(null))
      .finally(() => setLoading(false));
  }, [locationId, venueProp]);

  if (!locationId && !venue) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!venue) {
    return null;
  }

  const canOpenMaps =
    venue.latitude != null &&
    venue.longitude != null &&
    Number.isFinite(venue.latitude) &&
    Number.isFinite(venue.longitude);

  const showDetails = !minimal && !inline;

  if (inline) {
    if (!canOpenMaps) {
      return null;
    }
    return (
      <View style={styles.inlineRow}>
        <TouchableOpacity
          style={styles.inlineLink}
          onPress={() => void openMaps(venue.latitude!, venue.longitude!, venue.name)}
        >
          <Text style={styles.inlineLinkText}>Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact, minimal && styles.cardMinimal]}>
      {showDetails ? (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{venue.name}</Text>
          {PLAY_PARTNER_SURFACES_ENABLED && venue.partner_tier ? (
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>
                {venue.partner_tier === 'featured' ? 'Featured partner' : 'Partner'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : PLAY_PARTNER_SURFACES_ENABLED && venue.partner_tier ? (
        <View style={styles.titleRow}>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>
              {venue.partner_tier === 'featured' ? 'Featured partner' : 'Partner'}
            </Text>
          </View>
        </View>
      ) : null}
      {PLAY_PARTNER_SURFACES_ENABLED && venue.promo_note ? (
        <Text style={styles.promo}>{venue.promo_note}</Text>
      ) : null}
      {showDetails && venue.address ? <Text style={styles.line}>{venue.address}</Text> : null}
      {showDetails && venue.hours_text ? (
        <Text style={styles.line}>Hours: {venue.hours_text}</Text>
      ) : null}
      {showDetails && venue.parking_note ? (
        <Text style={styles.line}>Parking: {venue.parking_note}</Text>
      ) : null}
      {showDetails && venue.busy_notes ? (
        <Text style={styles.lineMuted}>Busy: {venue.busy_notes}</Text>
      ) : null}
      {canOpenMaps ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => void openMaps(venue.latitude!, venue.longitude!, venue.name)}
          >
            <Text style={styles.linkText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {venue.is_active === false ? (
        <Text style={styles.warning}>This court may be closed — verify before you go.</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardCompact: {
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  cardMinimal: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '22',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  partnerBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  partnerBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  promo: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  line: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  lineMuted: {
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  linkBtn: {
    paddingVertical: 4,
  },
  linkText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  warning: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineLink: {
    paddingVertical: 2,
  },
  inlineLinkText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});

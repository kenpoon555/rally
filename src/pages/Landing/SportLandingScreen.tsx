import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ScreenHeader } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../constants/theme';
import {
  buildSportLandingDeepLink,
  buildSportLandingWebUrl,
  getSportLandingPayload,
  sportFromSlug,
} from '../../services/landingService';
import { SportLandingPayload } from '../../types/landing';
import { ROUTES } from '../../constants/routes';
import { formatActivityTime } from '../../utils/activityHelpers';
import { formatSkillLevelLabel } from '../../services/captainService';
import { BETA_REGION } from '../../constants/betaRegion';

export type SportLandingStackParams = {
  SportLanding: { sportSlug: string };
};

type Props = NativeStackScreenProps<SportLandingStackParams, 'SportLanding'>;

const SportLandingScreen: React.FC<Props> = ({ route, navigation }) => {
  const sport = sportFromSlug(route.params.sportSlug) ?? 'Badminton';
  const [payload, setPayload] = useState<SportLandingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayload(await getSportLandingPayload(sport));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load page');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    void load();
  }, [load]);

  const sharePage = async () => {
    const url = buildSportLandingWebUrl(sport);
    const deepLink = buildSportLandingDeepLink(sport);
    await Share.share({
      message: `${sport} in ${BETA_REGION.name} — find games on Rally.\n${url}\n${deepLink}`,
      url,
    });
  };

  const openDiscover = (options?: { highlightRecruiting?: boolean }) => {
    navigation.navigate('MainTabs' as never, {
      screen: ROUTES.HOME.MAIN,
      params: {
        sportFilter: sport,
        highlightOpenSpots: options?.highlightRecruiting ?? false,
      },
    } as never);
  };

  if (loading && !payload) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !payload) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Page not found'}</Text>
        <Button title="Try again" onPress={() => void load()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
    >
      <ScreenHeader title={`${sport} · ${payload.city}`} subtitle={payload.tagline} />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{payload.open_games_count}</Text>
          <Text style={styles.statLabel}>Open games</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{payload.free_agent_count}</Text>
          <Text style={styles.statLabel}>Free agents</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Button title="Browse games" onPress={() => openDiscover()} />
        <Button
          title="See who's recruiting"
          variant="secondary"
          size="sm"
          onPress={() => openDiscover({ highlightRecruiting: true })}
        />
        <Button title="Share this page" variant="ghost" size="sm" onPress={() => void sharePage()} />
      </View>

      {payload.need_posts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hosts need players</Text>
          {payload.need_posts.map((post) => (
            <View key={post.id} style={styles.listCard}>
              <Text style={styles.listTitle}>
                @{post.host_username} · {post.spot_count} spot{post.spot_count === 1 ? '' : 's'}
              </Text>
              <Text style={styles.listMeta}>
                {formatActivityTime(post.starts_at)}
                {post.location_name ? ` · ${post.location_name}` : ''} ·{' '}
                {formatSkillLevelLabel(post.skill_level)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {payload.captains.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sport captains</Text>
          {payload.captains.map((captain) => (
            <View key={captain.id} style={styles.listCard}>
              <Text style={styles.listTitle}>@{captain.username}</Text>
              {captain.rally_name ? (
                <Text style={styles.listMeta}>{captain.rally_name}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {(payload.partner_venues?.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner venues</Text>
          {payload.partner_venues!.map((venue) => (
            <View key={venue.id} style={styles.listCard}>
              <Text style={styles.listTitle}>{venue.name}</Text>
              {venue.promo_note ? <Text style={styles.listMeta}>{venue.promo_note}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {(payload.intro_sessions?.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intro nights</Text>
          {payload.intro_sessions!.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.listCard}
              onPress={() =>
                navigation.navigate(ROUTES.ACTIVITY.DETAIL as never, {
                  activityId: session.id,
                } as never)
              }
            >
              <Text style={styles.listTitle}>
                {session.listing_title || `${session.sport_type} intro`}
              </Text>
              <Text style={styles.listMeta}>
                @{session.host_username} · {formatActivityTime(session.start_time)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {(payload.coach_listings?.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coaches & clinics</Text>
          {payload.coach_listings!.map((coach) => (
            <View key={coach.id} style={styles.listCard}>
              <Text style={styles.listTitle}>{coach.name}</Text>
              {coach.schedule_note ? (
                <Text style={styles.listMeta}>{coach.schedule_note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.footerCta} onPress={() => openDiscover('free_agents')}>
        <Text style={styles.footerCtaText}>See who's available to play →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SportLandingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  listMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footerCta: {
    margin: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  footerCtaText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeTogetherIllustration } from '../../components/auth/WelcomeTogetherIllustration';
import { Button } from '../../components/ui';
import { WELCOME_SLIDES } from '../../constants/brand';
import { MARKET_COPY } from '../../constants/betaCopy';
import { AGE_GATE_ONBOARDING } from '../../constants/parentStudentFlags';
import { ROUTES } from '../../constants/routes';
import { colors, radius, spacing, typography } from '../../constants/theme';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FOOTER_RESERVED = 168;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeSlide, setActiveSlide] = useState(0);
  const slideHeight =
    SCREEN_HEIGHT - insets.top - insets.bottom - FOOTER_RESERVED - spacing.xl;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(index);
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {WELCOME_SLIDES.map((slide, index) => (
          <View
            key={slide.title}
            style={[styles.slide, { width: SCREEN_WIDTH, minHeight: slideHeight }]}
          >
            <View style={styles.illustrationWrap}>
              <WelcomeTogetherIllustration />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
            {index === WELCOME_SLIDES.length - 1 ? (
              <Text style={styles.marketLine}>{MARKET_COPY.headline}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {WELCOME_SLIDES.map((slide, index) => (
          <View
            key={slide.title}
            style={[styles.dot, index === activeSlide && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          fullWidth
          size="lg"
          style={styles.cta}
          textStyle={styles.ctaText}
          onPress={() =>
            navigation.navigate(
              AGE_GATE_ONBOARDING ? ROUTES.AUTH.AGE_GATE : ROUTES.AUTH.SIGNUP,
              AGE_GATE_ONBOARDING ? undefined : { ageCategory: 'adult_18_plus' as const }
            )
          }
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}
          style={({ pressed }) => [styles.accountLink, pressed && styles.accountLinkPressed]}
        >
          <Text style={styles.accountLinkText}>I have an account</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexGrow: 1,
  },
  slide: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.display,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  marketLine: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  cta: {
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    minHeight: 56,
  },
  ctaText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.15,
  },
  accountLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  accountLinkPressed: {
    opacity: 0.7,
  },
  accountLinkText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default WelcomeScreen;

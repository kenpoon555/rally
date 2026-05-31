import { Platform, TextStyle, ViewStyle } from 'react-native';

/** Rally design tokens — Court Fresh palette (coordination-first, sporty, warm). */

export const colors = {
  primary: '#0B7A5E',
  primaryDark: '#065F49',
  primaryLight: '#E6F4EF',
  accent: '#E8622A',
  accentSoft: '#FFF0E8',
  background: '#F5F4F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#141916',
  textSecondary: '#5A635E',
  textTertiary: '#8A918C',
  textInverse: '#FFFFFF',
  border: '#E0E4E1',
  borderStrong: '#C8CEC9',
  success: '#1F9D55',
  successSoft: '#E8F8EE',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  error: '#D93025',
  errorSoft: '#FEECEB',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  overlay: 'rgba(20, 25, 22, 0.45)',
  tabInactive: '#8A918C',
} as const;

/** @deprecated Use colors.primary — kept for gradual migration */
export const PRIMARY_COLOR = colors.primary;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    color: colors.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
    color: colors.text,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
    color: colors.text,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 18,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0.8,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    color: colors.textTertiary,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.textInverse,
  },
} as const;

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#141916',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }),
  elevated: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#141916',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
} as const;

export const AVATAR_PALETTE = [
  '#7EB8A8',
  '#8FA8D4',
  '#C4A882',
  '#B88FA8',
  '#82B892',
  '#A89282',
] as const;

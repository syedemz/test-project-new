// ============================================================
// SINGLE SOURCE OF TRUTH FOR ALL FONTS AND TEXT STYLES
// To change a font globally, edit ONLY this file.
// ============================================================

import { TextStyle } from 'react-native';

/**
 * Font family strings for the primary typeface (Plus Jakarta Sans).
 *
 * The strings here must exactly match the keys registered with expo-font's
 * useFonts hook in the app entry point (phase 3). Until then, React Native
 * will fall back to the system font at runtime — the tokens are still the
 * source of truth.
 */
export const fontFamily = {
  primary: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extrabold: 'PlusJakartaSans-ExtraBold',
  },
};

/**
 * Numeric font-size tokens.
 * Components must reference these values via textStyles presets, not directly.
 */
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  displayLg: 32,
} as const;

/**
 * Font-weight tokens typed to match React Native's TextStyle fontWeight union.
 * Components must reference these via textStyles presets, not directly.
 */
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

/**
 * Complete text-style presets.
 *
 * Components must use `<Text style={textStyles.heading.xl}>` or spread the
 * preset into a StyleSheet.create block. Raw fontSize/fontWeight props are
 * forbidden outside this file.
 */
export const textStyles = {
  display: {
    lg: {
      fontFamily: fontFamily.primary.extrabold,
      fontSize: 32,
      lineHeight: 40,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.extrabold,
      fontSize: 28,
      lineHeight: 36,
    } as TextStyle,
  },
  heading: {
    xl: {
      fontFamily: fontFamily.primary.bold,
      fontSize: 24,
      lineHeight: 32,
    } as TextStyle,
    lg: {
      fontFamily: fontFamily.primary.bold,
      fontSize: 20,
      lineHeight: 28,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 18,
      lineHeight: 26,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
  },
  body: {
    lg: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 14,
      lineHeight: 22,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 13,
      lineHeight: 20,
    } as TextStyle,
  },
  label: {
    lg: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 16,
      lineHeight: 22,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 14,
      lineHeight: 20,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.medium,
      fontSize: 12,
      lineHeight: 16,
    } as TextStyle,
  },
  caption: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 11,
    lineHeight: 14,
  } as TextStyle,
};

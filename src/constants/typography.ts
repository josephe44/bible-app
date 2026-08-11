/**
 * Eword — Design Token: Typography
 * Lora (serif) for verse text, Inter for UI.
 */

export const FontFamily = {
  // Serif — for verse text, references
  verseRegular: 'Lora_400Regular',
  verseMedium: 'Lora_500Medium',
  verseSemiBold: 'Lora_600SemiBold',
  verseBold: 'Lora_700Bold',
  verseItalic: 'Lora_400Regular_Italic',

  // Sans — for UI, lessons, labels
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  verse: 22,     // Main verse display
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,  // For verse and lesson body text
  loose: 2.0,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1.0,
  widest: 2.0,
} as const;

/** Pre-composed text style presets */
export const TextStyle = {
  verseBody: {
    fontFamily: FontFamily.verseRegular,
    fontSize: FontSize.verse,
    lineHeight: FontSize.verse * LineHeight.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  verseReference: {
    fontFamily: FontFamily.verseSemiBold,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.wider,
  },
  lessonBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.relaxed,
  },
  keyTakeaway: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.relaxed,
  },
  heading1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  heading2: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize['2xl'],
    lineHeight: FontSize['2xl'] * LineHeight.tight,
  },
  heading3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    letterSpacing: LetterSpacing.wide,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    letterSpacing: LetterSpacing.normal,
  },
} as const;

/**
 * Eword — Design Token: Colors
 * Warm sacred palette. Gold primary, forest green accent.
 */

export const Colors = {
  // Primary — Warm Gold (Wisdom, Scripture)
  primary: '#C8862A',
  primaryLight: '#E4A84A',
  primaryDark: '#8B5E1A',
  primaryMuted: '#C8862A26', // 15% opacity

  // Accent — Forest Green (Growth, Life)
  accent: '#4A7C59',
  accentLight: '#6AAF7F',
  accentDark: '#2E5039',
  accentMuted: '#4A7C5926',

  // Background
  backgroundLight: '#FAF6F0',
  backgroundDark: '#1A1208',

  // Surface (cards, modals)
  surfaceLight: '#FFFFFF',
  surfaceDark: '#2A1E0F',
  surfaceElevatedLight: '#F5EDE0',
  surfaceElevatedDark: '#382A18',

  // Text
  textPrimaryLight: '#1C0F00',
  textPrimaryDark: '#F5EDD8',
  textSecondaryLight: '#7A6952',
  textSecondaryDark: '#B09B7A',
  textMutedLight: '#ADA08C',
  textMutedDark: '#6B5A42',

  // Borders
  borderLight: '#E8DDD0',
  borderDark: '#3D2E1A',

  // Semantic
  streak: '#FF6B2B',      // Flame orange
  streakGlow: '#FF6B2B33',
  success: '#4CAF50',
  successMuted: '#4CAF5026',
  error: '#D32F2F',
  errorMuted: '#D32F2F26',
  warning: '#F57C00',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;

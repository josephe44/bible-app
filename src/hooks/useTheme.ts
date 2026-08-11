/**
 * Eword — useTheme Hook
 * Returns the current color scheme tokens based on system light/dark preference.
 */

import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;
  accent: string;
  accentLight: string;
  streak: string;
  streakGlow: string;
  success: string;
  error: string;
  overlay: string;
  isDark: boolean;
}

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    background:      isDark ? Colors.backgroundDark      : Colors.backgroundLight,
    surface:         isDark ? Colors.surfaceDark         : Colors.surfaceLight,
    surfaceElevated: isDark ? Colors.surfaceElevatedDark : Colors.surfaceElevatedLight,
    textPrimary:     isDark ? Colors.textPrimaryDark     : Colors.textPrimaryLight,
    textSecondary:   isDark ? Colors.textSecondaryDark   : Colors.textSecondaryLight,
    textMuted:       isDark ? Colors.textMutedDark       : Colors.textMutedLight,
    border:          isDark ? Colors.borderDark          : Colors.borderLight,
    primary:         Colors.primary,
    primaryLight:    Colors.primaryLight,
    primaryDark:     Colors.primaryDark,
    primaryMuted:    Colors.primaryMuted,
    accent:          Colors.accent,
    accentLight:     Colors.accentLight,
    streak:          Colors.streak,
    streakGlow:      Colors.streakGlow,
    success:         Colors.success,
    error:           Colors.error,
    overlay:         Colors.overlay,
    isDark,
  };
}

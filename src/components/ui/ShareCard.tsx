import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { BookOpen } from 'lucide-react-native';

interface ShareCardProps {
  verseText: string;
  reference: string;
  themeString: string;
  day: number;
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ verseText, reference, themeString, day }, ref) => {
    const colors = useTheme();
    // Using fixed dimensions to ensure consistent aspect ratio for sharing
    const width = 1080 / 3;
    const height = 1920 / 3;

    return (
      <View
        ref={ref}
        style={[styles.container, { backgroundColor: colors.background, width, height }]}
      >
        <View style={styles.header}>
          <BookOpen size={24} color={colors.primary} />
          <Text style={[styles.brandText, { color: colors.textPrimary }, TextStyle.heading3]}>
            DailyWord
          </Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={[styles.verseText, { color: colors.textPrimary }, TextStyle.verseBody]}>
            "{verseText}"
          </Text>
          <Text style={[styles.reference, { color: colors.primary }, TextStyle.verseReference]}>
            {reference}
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }, TextStyle.label]}>
            Day {day} • {themeString.charAt(0).toUpperCase() + themeString.slice(1)} Plan
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    padding: 32,
    justifyContent: 'space-between',
    // We want this off-screen or rendered virtually.
    // Ensure absolute positioning so it doesn't interrupt layout
    position: 'absolute',
    left: -10000,
    top: -10000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    letterSpacing: -0.5,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 24,
  },
  reference: {
    textAlign: 'center',
    fontSize: 16,
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

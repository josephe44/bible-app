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
    // Using 4:3 aspect ratio for better cross-platform sharing
    const width = 480;
    const height = 360;

    return (
      <View
        ref={ref}
        style={[
          styles.container, 
          { 
            backgroundColor: colors.surfaceElevated, 
            borderColor: colors.border,
            borderWidth: 1,
            width, 
            height 
          }
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '20' }]}>
            <BookOpen size={24} color={colors.primary} />
          </View>
          <Text style={[styles.brandText, { color: colors.textPrimary }, TextStyle.heading3]}>
            DailyWord
          </Text>
        </View>

        <View style={styles.centerContent}>
          <Text 
            style={[styles.verseText, { color: colors.textPrimary }, TextStyle.verseBody]}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            numberOfLines={10}
          >
            "{verseText}"
          </Text>
          <View style={[styles.referenceBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.reference, { color: colors.primary }, TextStyle.verseReference]}>
              {reference}
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }, TextStyle.caption]}>
            Day {day} • {themeString.charAt(0).toUpperCase() + themeString.slice(1)} Plan
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'space-between',
    // We want this off-screen or rendered virtually.
    // Ensure absolute positioning so it doesn't interrupt layout
    position: 'absolute',
    left: -10000,
    top: -10000,
    borderRadius: 32,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    letterSpacing: -0.5,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 32,
  },
  referenceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  reference: {
    textAlign: 'center',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  footerText: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight, BookOpen, Flame, NotebookPen, Quote, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontFamily, FontSize } from '@/constants/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 168;
const RING_STROKE = 14;
const GLOW_SIZE = 300;

interface PlanCompleteViewProps {
  themeLabel: string;
  daysRead: number;
  totalDays: number;
  bestStreak: number;
  reflections: number;
  closingVerse: { reference: string; text: string } | null;
  onStartNew: () => void;
  onOpenJournal: () => void;
}

export function PlanCompleteView({
  themeLabel,
  daysRead,
  totalDays,
  bestStreak,
  reflections,
  closingVerse,
  onStartNew,
  onOpenJournal,
}: PlanCompleteViewProps) {
  const theme = useTheme();
  const finishedAll = daysRead >= totalDays;
  const progress = totalDays > 0 ? Math.min(daysRead / totalDays, 1) : 0;

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  // The ring fills in once the screen has appeared
  const filled = useSharedValue(0);
  useEffect(() => {
    filled.value = withDelay(
      350,
      withTiming(progress, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  }, [progress, filled]);
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - filled.value),
  }));

  const title = finishedAll ? 'Journey complete' : 'Journey finished';
  const message = finishedAll
    ? `All ${totalDays} days of your ${themeLabel} plan, read with a faithful heart. Beautifully done.`
    : `You showed up for ${daysRead} of ${totalDays} days of your ${themeLabel} plan. Every single one counted.`;

  return (
    <View style={styles.screen}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
    <View style={styles.root}>
      {/* Soft golden glow behind the ring */}
      <View pointerEvents="none" style={styles.glowWrap}>
        <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity={theme.isDark ? 0.28 : 0.22} />
              <Stop offset="60%" stopColor={theme.primary} stopOpacity={0.06} />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#glow)" />
        </Svg>
      </View>

      {/* Ring + sparkles */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.primaryLight} />
              <Stop offset="100%" stopColor={theme.primaryDark} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            stroke={theme.border}
            strokeWidth={RING_STROKE}
            fill={theme.surface}
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            stroke="url(#ring)"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={ringProps}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>

        <View style={styles.ringCenter}>
          <Text style={[styles.ringNumber, { color: theme.textPrimary }]}>{daysRead}</Text>
          <Text style={[styles.ringCaption, { color: theme.textSecondary }]}>
            of {totalDays} days
          </Text>
        </View>

        <Animated.View entering={ZoomIn.delay(1000).duration(450)} style={[styles.sparkle, styles.sparkleA]}>
          <Sparkles size={22} color={theme.primary} fill={theme.primaryLight} />
        </Animated.View>
        <Animated.View entering={ZoomIn.delay(1200).duration(450)} style={[styles.sparkle, styles.sparkleB]}>
          <Sparkles size={14} color={theme.primaryLight} fill={theme.primaryLight} />
        </Animated.View>
        <Animated.View entering={ZoomIn.delay(1400).duration(450)} style={[styles.sparkle, styles.sparkleC]}>
          <Sparkles size={16} color={theme.primary} fill={theme.primaryLight} />
        </Animated.View>
      </Animated.View>

      {/* Heading */}
      <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.headingBlock}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.statsRow}>
        <Stat icon={<BookOpen size={18} color={theme.primary} />} value={`${daysRead}/${totalDays}`} label="Days read" />
        <Stat icon={<Flame size={18} color={theme.streak} fill={theme.streak} />} value={`${bestStreak}`} label="Best streak" />
        <Stat icon={<NotebookPen size={18} color={theme.accent} />} value={`${reflections}`} label="Reflections" />
      </Animated.View>

      {/* Closing verse */}
      {closingVerse && (
        <Animated.View
          entering={FadeInDown.delay(650).duration(600)}
          style={[styles.verseCard, { backgroundColor: theme.primaryMuted }]}
        >
          <Quote size={20} color={theme.primary} />
          <Text style={[styles.verseText, { color: theme.textPrimary }]}>{closingVerse.text}</Text>
          <Text style={[styles.verseRef, { color: theme.primary }]}>{closingVerse.reference}</Text>
        </Animated.View>
      )}

    </View>
    </ScrollView>

      {/* Actions stay pinned above the tab bar */}
      <Animated.View entering={FadeInDown.delay(850).duration(600)} style={styles.actions}>
        {/* Fades scrolling content out as it passes under the buttons */}
        <View pointerEvents="none" style={styles.fade}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.background} stopOpacity={0} />
                <Stop offset="1" stopColor={theme.background} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
          </Svg>
        </View>
        <Pressable
          onPress={onStartNew}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.primaryText}>Start a new plan</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={onOpenJournal} hitSlop={12} style={styles.secondaryButton}>
          <Text style={[styles.secondaryText, { color: theme.primary }]}>Revisit your journal</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {icon}
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  root: {
    alignItems: 'center',
    paddingTop: 14,
  },
  glowWrap: {
    position: 'absolute',
    top: 14 + RING_SIZE / 2 - GLOW_SIZE / 2,
    alignSelf: 'center',
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    fontFamily: FontFamily.verseBold,
    fontSize: 50,
    lineHeight: 56,
  },
  ringCaption: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
  sparkle: { position: 'absolute' },
  sparkleA: { top: -6, right: -2 },
  sparkleB: { top: 28, left: -12 },
  sparkleC: { bottom: 6, right: -14 },
  headingBlock: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  title: {
    fontFamily: FontFamily.verseBold,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.6,
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  verseCard: {
    alignSelf: 'stretch',
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
    alignItems: 'center',
  },
  verseText: {
    fontFamily: FontFamily.verseItalic,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.65,
    textAlign: 'center',
    marginTop: 8,
  },
  verseRef: {
    fontFamily: FontFamily.verseSemiBold,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    marginTop: 8,
  },
  fade: {
    position: 'absolute',
    top: -28,
    left: 0,
    right: 0,
    height: 28,
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 96, // clears the floating tab bar
    alignItems: 'center',
  },
  primaryButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 30,
    shadowColor: '#C8862A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
  },
  secondaryButton: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  secondaryText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
  },
});

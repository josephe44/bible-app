import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePlan } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextStyle } from '@/constants/typography';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DayCalendarStrip } from '@/components/ui/DayCalendarStrip';
import { HeatMap } from '@/components/ui/HeatMap';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { getAllReadDates } from '@/db/queries';

export default function PlanScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();
  const [historicalReadDates, setHistoricalReadDates] = useState<string[]>([]);

  useEffect(() => {
    // Fetch all historical read dates from the DB
    getAllReadDates().then(setHistoricalReadDates).catch(console.error);
  }, [plan]); // Re-fetch if plan updates (e.g., mark a day as read)

  const { readDays, progress, currentDay } = useMemo(() => {
    if (!plan) return { readDays: 0, progress: 0, currentDay: 1 };
    const read = plan.days.filter((d) => d.isRead).length;
    
    // Find the first unread day, or if all read, the last day
    const firstUnread = plan.days.find((d) => !d.isRead);
    const currDay = firstUnread ? firstUnread.dayNumber : plan.durationDays;
    
    return {
      readDays: read,
      progress: read / plan.durationDays,
      currentDay: currDay,
    };
  }, [plan]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
            Your Plan
          </Text>
          {plan && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }, TextStyle.caption]}>
              {plan.theme.charAt(0).toUpperCase() + plan.theme.slice(1)} • {plan.durationDays} Days
            </Text>
          )}
        </View>
        
        {!plan ? (
          <Text style={{ color: colors.textSecondary, marginTop: 24 }}>Loading plan...</Text>
        ) : (
          <View style={styles.content}>
            {/* 1. Calendar (moved to top) */}
            <View style={styles.section}>
              <DayCalendarStrip 
                days={plan.days} 
                currentDay={currentDay} 
                onDayPress={(day) => {
                  router.push(`/verse/${day}`);
                }} 
              />
            </View>

            {/* 2. HeatMap (Streak) */}
            <View style={styles.section}>
              <HeatMap readDates={historicalReadDates} />
            </View>

            {/* 3. Progress (reduced size and put in a card) */}
            <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.progressInfo}>
                <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>Current Plan</Text>
                <Text style={[TextStyle.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  {readDays} out of {plan.durationDays} days completed
                </Text>
                <Text style={[TextStyle.heading2, { color: colors.primary, marginTop: 8 }]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <ProgressRing progress={progress} size={80} strokeWidth={8} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    marginTop: 4,
    letterSpacing: 0.5,
  },
  content: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  progressInfo: {
    flex: 1,
    marginRight: 16,
  }
});

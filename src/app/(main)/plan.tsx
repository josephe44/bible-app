import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePlan } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextStyle } from '@/constants/typography';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DayCalendarStrip } from '@/components/ui/DayCalendarStrip';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

export default function PlanScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
          Your Plan
        </Text>
        
        {!plan ? (
          <Text style={{ color: colors.textSecondary }}>Loading plan...</Text>
        ) : (
          <View style={styles.content}>
            <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
              {plan.theme.charAt(0).toUpperCase() + plan.theme.slice(1)} • {plan.durationDays} Days
            </Text>
            <View style={styles.progressContainer}>
              <ProgressRing progress={progress} size={140} strokeWidth={14} />
              <Text style={[{ color: colors.textSecondary, marginTop: 16 }, TextStyle.caption]}>
                {readDays} of {plan.durationDays} days completed
              </Text>
            </View>

            <Text style={[{ color: colors.textPrimary, marginTop: 32, marginBottom: 8, paddingHorizontal: 24 }, TextStyle.heading3]}>
              Calendar
            </Text>
            <DayCalendarStrip 
              days={plan.days} 
              currentDay={currentDay} 
              onDayPress={(day) => {
                // For Sprint 3: Navigate to past day in review mode
                router.push(`/verse/${day}`);
              }} 
            />
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
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  content: {
    marginTop: 16,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  }
});

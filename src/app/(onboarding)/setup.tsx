import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLAN_DURATIONS, PLAN_THEMES, type PlanDurationPreset, type Theme } from '@/constants/themes';
import { createPlan, insertPlanDays } from '@/db/queries';
import { generatePlanDays } from '@/services/planEngine';
import allVerses from '@/content/verses.json';
import { useApp } from '@/context/AppContext';
import type { VerseEntry } from '@/types';

type Step = 'duration' | 'theme' | 'notification';

const NOTIFICATION_TIMES = [
  { label: '6:00 AM', value: '06:00' },
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '5:00 PM', value: '17:00' },
  { label: '8:00 PM', value: '20:00' },
  { label: '9:00 PM', value: '21:00' },
  { label: 'No Reminders', value: null },
];

export default function SetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { refreshPlan } = useApp();

  const [currentStep, setCurrentStep] = useState<Step>('duration');
  const [duration, setDuration] = useState<PlanDurationPreset | null>(null);
  const [planTheme, setPlanTheme] = useState<Theme | null>(null);

  const handleFinish = async (notificationTime: string | null) => {
    if (!duration || !planTheme) return;

    try {
      const startDate = new Date().toISOString().split('T')[0];
      const planId = await createPlan({
        theme: planTheme,
        translation: 'kjv',
        durationDays: duration,
        startDate,
        notificationTime,
      });

      const days = generatePlanDays(allVerses as VerseEntry[], planTheme, duration, startDate);
      await insertPlanDays(planId, days);
      await refreshPlan();
      
      router.replace('/(main)/home');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create plan.');
    }
  };

  const renderDurationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[Typography.presets.h2, { color: theme.textPrimary, marginBottom: 8 }]}>
        Choose your journey
      </Text>
      <Text style={[Typography.presets.bodyLarge, { color: theme.textSecondary, marginBottom: 32 }]}>
        How long would you like this reading plan to last?
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {PLAN_DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.days}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {
              setDuration(d.days);
              setCurrentStep('theme');
            }}
          >
            <Text style={[Typography.presets.h3, { color: theme.textPrimary }]}>{d.label}</Text>
            <Text style={[Typography.presets.bodyMedium, { color: theme.textSecondary }]}>{d.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderThemeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[Typography.presets.h2, { color: theme.textPrimary, marginBottom: 8 }]}>
        Select a theme
      </Text>
      <Text style={[Typography.presets.bodyLarge, { color: theme.textSecondary, marginBottom: 32 }]}>
        What would you like to focus on for the next {duration} days?
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {PLAN_THEMES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {
              setPlanTheme(t.id);
              setCurrentStep('notification');
            }}
          >
            <Text style={[Typography.presets.h3, { color: theme.textPrimary }]}>
              {t.emoji} {t.label}
            </Text>
            <Text style={[Typography.presets.bodyMedium, { color: theme.textSecondary }]}>{t.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderNotificationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[Typography.presets.h2, { color: theme.textPrimary, marginBottom: 8 }]}>
        Daily Reminder
      </Text>
      <Text style={[Typography.presets.bodyLarge, { color: theme.textSecondary, marginBottom: 32 }]}>
        When would you like to be reminded to read your daily verse?
      </Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {NOTIFICATION_TIMES.map((time, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleFinish(time.value)}
          >
            <Text style={[Typography.presets.bodyLarge, { color: theme.textPrimary, fontWeight: '600' }]}>
              {time.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        {currentStep !== 'duration' && (
          <TouchableOpacity
            onPress={() => setCurrentStep(currentStep === 'notification' ? 'theme' : 'duration')}
            style={styles.backButton}
          >
            <Text style={[Typography.presets.bodyMedium, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: currentStep !== 'duration' ? theme.primary : theme.border }]} />
          <View style={[styles.progressDot, { backgroundColor: currentStep === 'notification' ? theme.primary : theme.border }]} />
        </View>
      </View>
      
      {currentStep === 'duration' && renderDurationStep()}
      {currentStep === 'theme' && renderThemeStep()}
      {currentStep === 'notification' && renderNotificationStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePlan, useApp } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextStyle } from '@/constants/typography';
import { JournalEntry } from '@/components/ui/JournalEntry';
import { getJournalEntries } from '@/db/queries';
import type { JournalEntry as JournalEntryType } from '@/types';
import { useRouter } from 'expo-router';

export default function JournalScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntryType[]>([]);

  useEffect(() => {
    if (plan) {
      getJournalEntries(plan.id).then(setEntries);
    }
  }, [plan]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
          Journal
        </Text>
        
        {!plan ? (
          <Text style={{ color: colors.textSecondary }}>No active plan.</Text>
        ) : entries.length === 0 ? (
          <View style={styles.content}>
            <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }, TextStyle.lessonBody]}>
              Your notes and reflections will appear here. Tap the journal icon on today's word to write your first entry!
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {entries.map((entry) => (
              <JournalEntry 
                key={entry.id} 
                entry={entry} 
                onPress={() => router.push(`/verse/${entry.dayNumber}`)} 
              />
            ))}
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
    marginBottom: 16,
  },
  content: {
    marginTop: 16,
  }
});

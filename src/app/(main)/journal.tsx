import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePlan } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextStyle } from '@/constants/typography';
import { JournalEntry } from '@/components/ui/JournalEntry';
import { getUnifiedJournalFeed } from '@/db/queries';
import type { FeedItem } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';

export default function JournalScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();
  const [entries, setEntries] = useState<FeedItem[]>([]);
  
  const loadEntries = () => {
    getUnifiedJournalFeed(plan ? plan.id : null).then(setEntries);
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [plan])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
          Journal
        </Text>
        
        {entries.length === 0 ? (
          <View style={styles.content}>
            <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }, TextStyle.lessonBody]}>
              Your notes and reflections will appear here. Tap the + button to write a note, or the journal icon on today's word to write a reflection!
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {entries.map((entry) => (
              <JournalEntry 
                key={`${entry.type}-${entry.id}`} 
                entry={entry} 
                onPress={() => {
                  if (entry.type === 'journal') {
                    router.push(`/verse/${entry.dayNumber}`);
                  } else {
                    router.push(`/note/${entry.id}`);
                  }
                }} 
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => router.push('/note/new')}
        activeOpacity={0.8}
      >
        <Plus color="#fff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  title: { marginBottom: 16 },
  content: { marginTop: 16 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  }
});

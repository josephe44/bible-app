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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
            Journal
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]} 
            onPress={() => router.push('/note/new')}
            activeOpacity={0.8}
          >
            <Plus color="#fff" size={20} />
          </TouchableOpacity>
        </View>
        
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {},
  content: { marginTop: 16 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
});


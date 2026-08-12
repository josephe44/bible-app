import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import versesData from '@/content/verses.json';
import * as Speech from 'expo-speech';
import { X, Volume2 } from 'lucide-react-native';

export default function VerseDeepDiveScreen() {
  const { day } = useLocalSearchParams();
  const { state } = useApp();
  const theme = useTheme();
  const router = useRouter();

  const dayNumber = parseInt(day as string, 10);
  const planDay = state.plan?.days.find((d) => d.dayNumber === dayNumber);
  const verseEntry = planDay ? versesData.find((v: any) => v.id === planDay.verseId) : null;

  if (!verseEntry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[TextStyle.lessonBody, { color: theme.textSecondary, padding: 24 }]}>
          Verse not found.
        </Text>
      </View>
    );
  }

  const speak = () => {
    Speech.speak((verseEntry as any).text, {
      language: 'en-US',
      rate: 0.85,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <X size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[TextStyle.heading3, { color: theme.textPrimary }]}>{(verseEntry as any).reference}</Text>
        <Pressable onPress={speak} style={styles.actionButton}>
          <Volume2 size={20} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[TextStyle.verseBody, { color: theme.textPrimary, marginBottom: 24, textAlign: 'center' }]}>
          "{(verseEntry as any).text}"
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  actionButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 24,
  }
});

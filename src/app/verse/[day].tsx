import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import versesData from '@/content/verses.json';
import * as Speech from 'expo-speech';
import { X, Volume2, Share } from 'lucide-react-native';
import { ShareCard } from '@/components/ui/ShareCard';
import { shareVerseCard } from '@/services/shareService';

export default function VerseDeepDiveScreen() {
  const { day } = useLocalSearchParams();
  const { state } = useApp();
  const theme = useTheme();
  const router = useRouter();
  const shareCardRef = useRef<View>(null);

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
    const textToSpeak = verseEntry.text;
    Speech.speak(textToSpeak, {
      language: 'en-US',
      rate: 0.85,
    });
  };

  const handleShare = () => {
    shareVerseCard(shareCardRef);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <X size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[TextStyle.heading3, { color: theme.textPrimary }]}>{(verseEntry as any).reference}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <Share size={20} color={theme.textPrimary} />
          </Pressable>
          <Pressable onPress={speak} style={styles.actionButton}>
            <Volume2 size={20} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      <ShareCard 
        ref={shareCardRef}
        verseText={verseEntry.text}
        reference={(verseEntry as any).reference}
        themeString={state.plan?.theme || 'faith'}
        day={dayNumber}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {verseEntry.context_before ? (
          <Text style={[TextStyle.lessonBody, { color: theme.textSecondary, marginBottom: 12, opacity: 0.8 }]}>
            {verseEntry.context_before}
          </Text>
        ) : null}
        
        <Text style={[TextStyle.verseBody, { color: theme.textPrimary, marginVertical: 16, textAlign: 'center' }]}>
          "{verseEntry.text}"
        </Text>
        
        {verseEntry.context_after ? (
          <Text style={[TextStyle.lessonBody, { color: theme.textSecondary, marginTop: 12, marginBottom: 32, opacity: 0.8 }]}>
            {verseEntry.context_after}
          </Text>
        ) : <View style={{ height: 32 }} />}

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[TextStyle.heading3, { color: theme.textPrimary, marginBottom: 12 }]}>Lesson</Text>
          <Text style={[TextStyle.lessonBody, { color: theme.textSecondary, marginBottom: 24 }]}>
            {verseEntry.lesson}
          </Text>
          <Text style={[TextStyle.heading3, { color: theme.textPrimary, marginBottom: 12 }]}>Key Takeaway</Text>
          <Text style={[TextStyle.keyTakeaway, { color: theme.primary }]}>
            {verseEntry.key_takeaway}
          </Text>
        </View>
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
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  }
});

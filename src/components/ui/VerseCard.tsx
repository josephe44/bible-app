import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import type { VerseEntry } from '@/types';
import { ChevronRight } from 'lucide-react-native';

interface VerseCardProps {
  verse: VerseEntry;
  onPress?: () => void;
}

export function VerseCard({ verse, onPress }: VerseCardProps) {
  const theme = useTheme();

  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.card, 
        { 
          backgroundColor: theme.surface,
          borderColor: theme.primary + '40',
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={[TextStyle.verseReference, { color: theme.primary }]}>
          {verse.reference}
        </Text>
        <ChevronRight size={16} color={theme.textSecondary} />
      </View>
      <Text style={[TextStyle.verseBody, { color: theme.textPrimary, marginTop: 12 }]}>
        "{verse.text}"
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

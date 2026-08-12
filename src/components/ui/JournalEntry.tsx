import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { BookOpen } from 'lucide-react-native';
import type { JournalEntry as JournalEntryType } from '@/types';

interface JournalEntryProps {
  entry: JournalEntryType;
  onPress: () => void;
}

export function JournalEntry({ entry, onPress }: JournalEntryProps) {
  const colors = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.dayBadge}>
          <BookOpen size={16} color={colors.primary} />
          <Text style={[{ color: colors.primary, marginLeft: 6 }, TextStyle.label]}>
            Day {entry.dayNumber}
          </Text>
        </View>
        <Text style={[{ color: colors.textSecondary }, TextStyle.caption]}>
          {new Date(entry.updatedAt).toLocaleDateString()}
        </Text>
      </View>
      <Text 
        style={[{ color: colors.textPrimary, marginTop: 12 }, TextStyle.lessonBody]}
        numberOfLines={3}
      >
        {entry.content}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  }
});

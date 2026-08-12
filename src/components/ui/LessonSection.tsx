import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { ChevronUp, ChevronDown, Lightbulb } from 'lucide-react-native';

interface LessonSectionProps {
  lesson: string;
  takeaway: string;
  onPressTakeaway?: () => void;
}

export function LessonSection({ lesson, takeaway, onPressTakeaway }: LessonSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={[TextStyle.heading3, { color: theme.textPrimary }]}>Today's Lesson</Text>
        {expanded ? (
          <ChevronUp size={20} color={theme.textSecondary} />
        ) : (
          <ChevronDown size={20} color={theme.textSecondary} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          <Text style={[TextStyle.lessonBody, { color: theme.textSecondary }]}>
            {lesson}
          </Text>
        </View>
      )}

      <Pressable 
        style={[styles.takeawayPill, { backgroundColor: theme.primary + '15' }]}
        onPress={onPressTakeaway}
      >
        <Lightbulb size={18} color={theme.primary} />
        <Text style={[TextStyle.keyTakeaway, { color: theme.primary, flex: 1, marginLeft: 12 }]}>
          {takeaway}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    marginBottom: 20,
  },
  takeawayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
});

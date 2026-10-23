import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle, FontFamily, FontSize } from '@/constants/typography';

interface PlanCompleteCardProps {
  daysRead: number;
  totalDays: number;
  onStartNew: () => void;
}

export function PlanCompleteCard({ daysRead, totalDays, onStartNew }: PlanCompleteCardProps) {
  const theme = useTheme();
  const finishedAll = daysRead >= totalDays;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Trophy size={56} color={theme.primary} />
      <Text style={[TextStyle.heading2, styles.title, { color: theme.textPrimary }]}>
        Plan complete
      </Text>
      <Text style={[TextStyle.lessonBody, styles.message, { color: theme.textSecondary }]}>
        {finishedAll
          ? `You read every one of the ${totalDays} days. Well done.`
          : `You read ${daysRead} of ${totalDays} days. Every day in the Word counts.`}
      </Text>
      <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={onStartNew}>
        <Text style={styles.buttonText}>Start a new plan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  title: { marginTop: 20, marginBottom: 8 },
  message: { textAlign: 'center', marginBottom: 28 },
  button: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
  },
});

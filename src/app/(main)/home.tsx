import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { state } = useApp();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[TextStyle.heading2, { color: theme.textPrimary, marginBottom: 16 }]}>
        Home
      </Text>
      <Text style={[TextStyle.lessonBody, { color: theme.textSecondary }]}>
        Active Plan Theme: {state.plan?.theme}
      </Text>
      <Text style={[TextStyle.lessonBody, { color: theme.textSecondary }]}>
        Plan Duration: {state.plan?.durationDays} Days
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});

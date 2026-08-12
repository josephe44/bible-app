import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  const theme = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.surface }]}>
      <Flame size={16} color="#FF6B2B" fill="#FF6B2B" />
      <Text style={[TextStyle.label, { color: theme.textPrimary, marginLeft: 6 }]}>
        {count} Day Streak
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
});

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import type { PlanDay } from '@/types';
import { Check } from 'lucide-react-native';

interface DayCalendarStripProps {
  days: PlanDay[];
  currentDay: number;
  onDayPress: (dayNumber: number) => void;
}

export function DayCalendarStrip({ days, currentDay, onDayPress }: DayCalendarStripProps) {
  const colors = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Auto-scroll to current day on mount
  useEffect(() => {
    if (scrollViewRef.current && currentDay > 3) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: (currentDay - 3) * 70, animated: true });
      }, 100);
    }
  }, [currentDay]);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const isCurrent = day.dayNumber === currentDay;
          const isFuture = day.dayNumber > currentDay;
          const isRead = day.isRead;
          
          return (
            <TouchableOpacity 
              key={day.dayNumber} 
              style={[
                styles.dayCard, 
                { backgroundColor: colors.surface },
                isCurrent && { borderColor: colors.primary, borderWidth: 2 },
                isFuture && { opacity: 0.6 }
              ]}
              onPress={() => onDayPress(day.dayNumber)}
              disabled={isFuture}
            >
              <Text style={[{ color: colors.textSecondary }, TextStyle.caption]}>
                Day
              </Text>
              <Text style={[{ color: isCurrent ? colors.primary : colors.textPrimary, marginTop: 4 }, TextStyle.heading3]}>
                {day.dayNumber}
              </Text>
              
              <View style={[styles.statusIndicator, { borderColor: colors.border }]}>
                {isRead ? (
                  <View style={[styles.readCircle, { backgroundColor: colors.success }]}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </View>
                ) : (
                  <View style={[styles.unreadCircle, { backgroundColor: colors.border }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  dayCard: {
    width: 64,
    height: 96,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusIndicator: {
    marginTop: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  }
});

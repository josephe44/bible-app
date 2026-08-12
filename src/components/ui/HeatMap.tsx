import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { Flame } from 'lucide-react-native';

interface HeatMapProps {
  readDates: string[]; // Array of ISO date strings
}

export function HeatMap({ readDates }: HeatMapProps) {
  const colors = useTheme();

  // Convert readDates to a Set of YYYY-MM-DD for fast lookup
  const readSet = useMemo(() => {
    const set = new Set<string>();
    readDates.forEach((isoString) => {
      const d = new Date(isoString);
      if (!isNaN(d.getTime())) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        set.add(dateStr);
      }
    });
    return set;
  }, [readDates]);

  // Generate a grid of 52 columns x 7 rows
  const weeks = useMemo(() => {
    const numWeeks = 52;
    const grid: { dateStr: string; formattedDate: string; isRead: boolean; isFuture: boolean }[][] = [];
    
    const now = new Date();
    // Start from the most recent Saturday to align weeks properly (Sun-Sat)
    const currentDayOfWeek = now.getDay();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (6 - currentDayOfWeek));
    
    // Go back 52 weeks
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (numWeeks * 7 - 1));

    let currentDate = new Date(startDate);
    
    for (let w = 0; w < numWeeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        
        // e.g. "June 10, 2026"
        const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        const isRead = readSet.has(dateStr);
        const isFuture = currentDate.getTime() > now.getTime();
        week.push({ dateStr, formattedDate, isRead, isFuture });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      grid.push(week);
    }
    return grid;
  }, [readSet]);

  const handleCellPress = (day: any) => {
    if (day.isFuture) return;
    const status = day.isRead ? "Read 🔥" : "Not Read";
    Alert.alert(day.formattedDate, `Status: ${status}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Flame size={20} color={colors.streak} style={{ marginRight: 8 }} />
        <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>365-Day Reading Streak</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {weeks.map((week, wIdx) => (
            <View key={`week-${wIdx}`} style={styles.column}>
              {week.map((day, dIdx) => (
                <TouchableOpacity 
                  key={day.dateStr} 
                  onPress={() => handleCellPress(day)}
                  activeOpacity={0.7}
                  disabled={day.isFuture}
                  style={[
                    styles.cell, 
                    { 
                      backgroundColor: day.isRead 
                        ? colors.streak 
                        : (colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                    },
                    day.isFuture && { opacity: 0.2 },
                    day.isRead && styles.activeCell
                  ]} 
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingRight: 20, // Extra padding for scrolling
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flexDirection: 'column',
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  activeCell: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  }
});

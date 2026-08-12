import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { Flame } from 'lucide-react-native';

interface HeatMapProps {
  readDates: string[]; // Array of ISO date strings
  year: number;
  month: number; // 0-11
  showHeader?: boolean;
}

export function HeatMap({ readDates, year, month, showHeader = true }: HeatMapProps) {
  const colors = useTheme();
  const [selectedDay, setSelectedDay] = useState<{ date: string; status: string } | null>(null);

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

  // Generate all days for the specified month and year
  const daysOfMonth = useMemo(() => {
    const days: { dateStr: string; formattedDate: string; isRead: boolean; isFuture: boolean; dayNumber: number }[] = [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    const now = new Date();

    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const isRead = readSet.has(dateStr);
      const isFuture = currentDate.getTime() > now.getTime();
      
      days.push({ dateStr, formattedDate, isRead, isFuture, dayNumber: currentDate.getDate() });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }, [readSet, year, month]);

  const handleCellPress = (day: any) => {
    if (day.isFuture) return;
    const status = day.isRead ? "Read 🔥" : "Not Read";
    setSelectedDay({ date: day.formattedDate, status });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setSelectedDay(null);
    }, 3000);
  };

  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {showHeader && (
        <View style={styles.header}>
          <Flame size={18} color={colors.streak} style={{ marginRight: 8 }} />
          <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>{monthName} Streak</Text>
        </View>
      )}
      
      <View style={styles.grid}>
        {daysOfMonth.map((day) => (
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
              day.isFuture && { opacity: 0.15 },
              day.isRead && styles.activeCell
            ]} 
          />
        ))}
      </View>

      {/* Inline Toast / Tooltip */}
      {selectedDay && (
        <View style={[styles.toast, { backgroundColor: colors.textPrimary }]}>
          <Text style={[TextStyle.caption, { color: colors.background, fontWeight: '600' }]}>
            {selectedDay.date}: {selectedDay.status}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginTop: 0,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  activeCell: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  }
});

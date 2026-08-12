import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { Flame } from 'lucide-react-native';

interface HeatMapProps {
  readDates: string[]; // Array of ISO date strings
}

export function HeatMap({ readDates }: HeatMapProps) {
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

  // Generate all days for the year 2026
  const daysOf2026 = useMemo(() => {
    const days: { dateStr: string; formattedDate: string; isRead: boolean; isFuture: boolean }[] = [];
    const year = 2026;
    const startDate = new Date(year, 0, 1); // Jan 1, 2026
    const endDate = new Date(year, 11, 31); // Dec 31, 2026
    const now = new Date();

    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const isRead = readSet.has(dateStr);
      const isFuture = currentDate.getTime() > now.getTime();
      
      days.push({ dateStr, formattedDate, isRead, isFuture });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }, [readSet]);

  const handleCellPress = (day: any) => {
    if (day.isFuture) return;
    const status = day.isRead ? "Read 🔥" : "Not Read";
    setSelectedDay({ date: day.formattedDate, status });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setSelectedDay(null);
    }, 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Flame size={20} color={colors.streak} style={{ marginRight: 8 }} />
        <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>2026 Reading Streak</Text>
      </View>
      
      <View style={styles.grid}>
        {daysOf2026.map((day) => (
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
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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

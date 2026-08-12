import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePlan } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextStyle } from '@/constants/typography';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DayCalendarStrip } from '@/components/ui/DayCalendarStrip';
import { HeatMap } from '@/components/ui/HeatMap';
import { useRouter } from 'expo-router';
import { getAllReadDates } from '@/db/queries';
import { X, ChevronLeft, ChevronRight, ChevronDown, BarChart2 } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';

export default function PlanScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();
  const [historicalReadDates, setHistoricalReadDates] = useState<string[]>([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  
  // History Modal State
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [showAllMonths, setShowAllMonths] = useState(false);

  useEffect(() => {
    // Fetch all historical read dates from the DB
    getAllReadDates().then(setHistoricalReadDates).catch(console.error);
  }, [plan]); 

  const { readDays, progress, currentDay } = useMemo(() => {
    if (!plan) return { readDays: 0, progress: 0, currentDay: 1 };
    const read = plan.days.filter((d) => d.isRead).length;
    const firstUnread = plan.days.find((d) => !d.isRead);
    const currDay = firstUnread ? firstUnread.dayNumber : plan.durationDays;
    
    return {
      readDays: read,
      progress: read / plan.durationDays,
      currentDay: currDay,
    };
  }, [plan]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const historyMonths = useMemo(() => {
    // Show all 12 months from January to December (0 to 11)
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }, []);

  const toggleMonths = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllMonths(!showAllMonths);
  };

  const displayedMonths = (historyYear === currentYear && !showAllMonths) 
    ? [currentMonth] 
    : historyMonths;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
            Your Plan
          </Text>
          {plan && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }, TextStyle.caption]}>
              {plan.theme.charAt(0).toUpperCase() + plan.theme.slice(1)} • {plan.durationDays} Days
            </Text>
          )}
        </View>
        
        {!plan ? (
          <Text style={{ color: colors.textSecondary, marginTop: 24 }}>Loading plan...</Text>
        ) : (
          <View style={styles.content}>
            <View style={styles.section}>
              <DayCalendarStrip 
                days={plan.days} 
                currentDay={currentDay} 
                onDayPress={(day) => router.push(`/verse/${day}`)} 
              />
            </View>

            <View style={styles.section}>
              <HeatMap 
                readDates={historicalReadDates} 
                year={currentYear} 
                month={currentMonth}
                onExpand={() => {
                  setHistoryYear(currentYear);
                  setShowAllMonths(false);
                  setIsHistoryModalVisible(true);
                }}
              />
            </View>

            <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.progressInfo}>
                <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>Current Plan</Text>
                <Text style={[TextStyle.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  {readDays} out of {plan.durationDays} days completed
                </Text>
                <Text style={[TextStyle.heading2, { color: colors.primary, marginTop: 8 }]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <ProgressRing progress={progress} size={80} strokeWidth={8} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Full History Modal */}
      <Modal visible={isHistoryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[TextStyle.heading2, { color: colors.textPrimary }]}>Streak History</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsHistoryModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.yearSelector}>
            {historyYear > 2026 ? (
              <TouchableOpacity 
                onPress={() => {
                  setHistoryYear(y => Math.max(2026, y - 1));
                  setShowAllMonths(true); // Auto expand all months for past years
                }}
                style={{ padding: 8 }}
              >
                <ChevronLeft size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            
            <Text style={[TextStyle.heading2, { color: colors.textPrimary, minWidth: 80, textAlign: 'center' }]}>
              {historyYear}
            </Text>
            
            {historyYear < currentYear ? (
              <TouchableOpacity 
                onPress={() => {
                  const newYear = Math.min(currentYear, historyYear + 1);
                  setHistoryYear(newYear);
                  if (newYear === currentYear) setShowAllMonths(false);
                }}
                style={{ padding: 8 }}
              >
                <ChevronRight size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {historyYear === currentYear && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity 
                style={[styles.badgeToggle, { backgroundColor: colors.surface }]}
                onPress={toggleMonths}
                activeOpacity={0.7}
              >
                <Text style={[TextStyle.caption, { color: colors.textPrimary, marginRight: 6, fontWeight: '600' }]}>
                  {showAllMonths ? 'See less' : 'See all months'}
                </Text>
                {showAllMonths ? (
                  <ChevronDown size={14} color={colors.textPrimary} />
                ) : (
                  <ChevronRight size={14} color={colors.textPrimary} />
                )}
              </TouchableOpacity>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {displayedMonths.map((m) => (
              <View key={m} style={styles.monthWrapper}>
                <HeatMap readDates={historicalReadDates} year={historyYear} month={m} />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  headerRow: { marginBottom: 8 },
  title: { fontSize: 28 },
  subtitle: { marginTop: 4, letterSpacing: 0.5 },
  content: { marginTop: 8 },
  section: { marginBottom: 8 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
  },
  progressInfo: { flex: 1, marginRight: 16 },
  
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  closeButton: { padding: 8, marginRight: -8 },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  modalScrollContent: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 60,
  },
  monthWrapper: {
    marginBottom: 24,
  },
  badgeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  }
});

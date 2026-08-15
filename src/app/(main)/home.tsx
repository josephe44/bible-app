import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, AppState } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle, FontFamily, FontSize } from '@/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { VerseCard } from '@/components/ui/VerseCard';
import { LessonSection } from '@/components/ui/LessonSection';
import { useStreak } from '@/hooks/useStreak';
import versesData from '@/content/verses.json';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { MilestoneModal } from '@/components/ui/MilestoneModal';
import { getTodayDayNumber } from '@/services/planEngine';

export default function HomeScreen() {
  const { state, markRead, saveJournal } = useApp();
  const theme = useTheme();
  const router = useRouter();
  const { currentStreak } = useStreak();
  const [journalText, setJournalText] = React.useState('');
  const [isBottomSheetVisible, setBottomSheetVisible] = React.useState(false);
  const [showMilestone, setShowMilestone] = React.useState(false);

  const plan = state.plan;

  const [currentDateString, setCurrentDateString] = React.useState(new Date().toDateString());

  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const newDateString = new Date().toDateString();
        if (newDateString !== currentDateString) {
          setCurrentDateString(newDateString);
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [currentDateString]);

  // Determine current day number
  const currentDayNumber = useMemo(() => {
    if (!plan) return 1;
    const dayNumber = getTodayDayNumber(plan.startDate, plan.durationDays);
    return dayNumber ?? 1;
  }, [plan, currentDateString]);

  const todayPlanDay = plan?.days.find((d) => d.dayNumber === currentDayNumber);
  const verseEntry = todayPlanDay 
    ? versesData.find((v: any) => v.id === todayPlanDay.verseId) 
    : null;

  React.useEffect(() => {
    if (todayPlanDay?.journalEntry) {
      setJournalText(todayPlanDay.journalEntry);
    }
  }, [todayPlanDay?.journalEntry]);

  if (!plan || !verseEntry) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[TextStyle.lessonBody, { color: theme.textSecondary, padding: 24 }]}>
          Loading today's verse...
        </Text>
      </SafeAreaView>
    );
  }

  const handleMarkRead = () => {
    markRead(currentDayNumber);
    if (!todayPlanDay?.isRead && [7, 14, 21, 30].includes(currentDayNumber)) {
      setShowMilestone(true);
    }
  };

  const handleJournalSave = () => {
    if (journalText !== todayPlanDay?.journalEntry) {
      saveJournal(currentDayNumber, journalText);
    }
    setBottomSheetVisible(false);
  };

  const handleJournalCancel = () => {
    // Reset to what was saved in the DB
    setJournalText(todayPlanDay?.journalEntry || '');
    setBottomSheetVisible(false);
  };

  const openBottomSheet = () => {
    // Ensure we start with the current saved text
    setJournalText(todayPlanDay?.journalEntry || '');
    setBottomSheetVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[TextStyle.caption, { color: theme.textSecondary, textTransform: 'uppercase' }]}>
              Day {currentDayNumber} of {plan.durationDays}
            </Text>
            <Text style={[TextStyle.heading2, { color: theme.textPrimary, marginTop: 4 }]}>
              Today's Word
            </Text>
          </View>
          <StreakBadge count={currentStreak} />
        </View>

        <VerseCard 
          verse={verseEntry as any} 
          onPress={() => router.push(`/verse/${currentDayNumber}`)} 
        />

        <LessonSection 
          lesson={verseEntry.lesson} 
          takeaway={todayPlanDay?.journalEntry || 'Tap to write your takeaway for today...'} 
          onPressTakeaway={openBottomSheet}
        />

        <Pressable 
          style={[
            styles.button, 
            { 
              backgroundColor: todayPlanDay?.isRead ? theme.surface : theme.primary,
              borderColor: todayPlanDay?.isRead ? theme.primary : 'transparent',
              borderWidth: todayPlanDay?.isRead ? 1 : 0
            }
          ]}
          onPress={handleMarkRead}
          disabled={todayPlanDay?.isRead}
        >
          <Text style={[
            { fontFamily: FontFamily.semiBold, fontSize: FontSize.md },
            { color: todayPlanDay?.isRead ? theme.primary : '#FFFFFF', textAlign: 'center' }
          ]}>
            {todayPlanDay?.isRead ? 'Completed' : 'Mark as Read'}
          </Text>
        </Pressable>
      </ScrollView>

      <MilestoneModal 
        visible={showMilestone} 
        day={currentDayNumber} 
        onClose={() => setShowMilestone(false)} 
      />

      <Modal
        visible={isBottomSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleJournalCancel}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={handleJournalCancel}>
            <View style={styles.modalOverlayBackground} />
          </TouchableWithoutFeedback>
          <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={handleJournalCancel} style={styles.actionButton}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
              
              <Text style={[TextStyle.heading3, { color: theme.textPrimary }]}>
                Your Reflection
              </Text>
              
              <Pressable onPress={handleJournalSave} style={styles.actionButton}>
                <Check size={24} color={theme.primary} />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.journalInput, 
                { 
                  backgroundColor: theme.surface, 
                  color: theme.textPrimary,
                  borderColor: theme.primary + '30',
                }
              ]}
              multiline
              autoFocus
              placeholder="What did you learn from today's word?"
              placeholderTextColor={theme.textSecondary}
              value={journalText}
              onChangeText={setJournalText}
              maxLength={500}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    borderTopLeftRadius: 33,
    borderTopRightRadius: 33,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  journalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    height: 160,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    textAlignVertical: 'top',
  }
});

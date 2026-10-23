import React, { useMemo } from 'react';
import { View, Text, type LayoutRectangle, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
import { MILESTONE_DAYS, PLAN_THEMES } from '@/constants/themes';
import { useSharedValue } from 'react-native-reanimated';
import { RunningMan, type Rect, type RunnerAnchors } from '@/components/ui/RunningMan';
import { usePlanPhase } from '@/hooks/usePlanPhase';
import { PlanCompleteView } from '@/components/ui/PlanCompleteView';

export default function HomeScreen() {
  const { state, markRead, saveJournal } = useApp();
  const theme = useTheme();
  const router = useRouter();
  const { currentStreak, longestStreak } = useStreak();
  const [journalText, setJournalText] = React.useState('');
  const [isBottomSheetVisible, setBottomSheetVisible] = React.useState(false);
  // Number of days read when a milestone was hit; null when none is showing.
  const [milestone, setMilestone] = React.useState<number | null>(null);

  const plan = state.plan;

  // The little man on the header: where he can stand, and whether a finger is down
  const touching = useSharedValue(false);
  const [columnRect, setColumnRect] = React.useState<Rect | null>(null);
  const [captionRect, setCaptionRect] = React.useState<Rect | null>(null);
  const [titleRect, setTitleRect] = React.useState<Rect | null>(null);
  const [badgeRect, setBadgeRect] = React.useState<Rect | null>(null);
  const runnerAnchors = React.useMemo<RunnerAnchors | null>(() => {
    if (!columnRect || !captionRect || !titleRect || !badgeRect) return null;
    // caption and title are measured inside the left column; shift them into header space
    const inHeader = (r: Rect): Rect => ({ x: columnRect.x + r.x, y: columnRect.y + r.y, w: r.w, h: r.h });
    return { caption: inHeader(captionRect), title: inHeader(titleRect), badge: badgeRect };
  }, [columnRect, captionRect, titleRect, badgeRect]);
  const toRect = (l: LayoutRectangle): Rect => ({ x: l.x, y: l.y, w: l.width, h: l.height });

  const { phase, dayNumber: currentDayNumber } = usePlanPhase(plan);

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

  if (phase === 'finished') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <PlanCompleteView
          themeLabel={PLAN_THEMES.find((t) => t.id === plan.theme)?.label ?? 'reading'}
          daysRead={plan.days.filter((d) => d.isRead).length}
          totalDays={plan.durationDays}
          bestStreak={longestStreak}
          reflections={plan.days.filter((d) => d.journalEntry?.trim()).length}
          closingVerse={
            verseEntry ? { reference: verseEntry.reference, text: verseEntry.text } : null
          }
          onStartNew={() => router.push('/(onboarding)/setup')}
          onOpenJournal={() => router.navigate('/(main)/journal')}
        />
      </SafeAreaView>
    );
  }

  const handleMarkRead = () => {
    markRead(currentDayNumber);
    if (!todayPlanDay?.isRead) {
      // Milestones count days actually read, not the calendar day of the plan.
      const daysRead = plan.days.filter((d) => d.isRead).length + 1;
      if ((MILESTONE_DAYS as readonly number[]).includes(daysRead)) {
        setMilestone(daysRead);
      }
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onTouchStart={() => { touching.value = true; }}
        onTouchEnd={() => { touching.value = false; }}
        onTouchCancel={() => { touching.value = false; }}
      >
        <View style={styles.header}>
          <View onLayout={(e) => setColumnRect(toRect(e.nativeEvent.layout))}>
            <Text
              onLayout={(e) => setCaptionRect(toRect(e.nativeEvent.layout))}
              style={[TextStyle.caption, { color: theme.textSecondary, textTransform: 'uppercase', alignSelf: 'flex-start' }]}
            >
              Day {currentDayNumber} of {plan.durationDays}
            </Text>
            <Text
              onLayout={(e) => setTitleRect(toRect(e.nativeEvent.layout))}
              style={[TextStyle.heading2, { color: theme.textPrimary, marginTop: 4, alignSelf: 'flex-start' }]}
            >
              Today's Word
            </Text>
          </View>
          <View onLayout={(e) => setBadgeRect(toRect(e.nativeEvent.layout))}>
            <StreakBadge count={currentStreak} />
          </View>
          <RunningMan anchors={runnerAnchors} touching={touching} />
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
        visible={milestone !== null} 
        day={milestone ?? 0} 
        onClose={() => setMilestone(null)} 
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
    marginTop: 18, // room above the header for the little man
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

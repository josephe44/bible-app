import { DayCalendarStrip } from "@/components/ui/DayCalendarStrip";
import { HeatMap } from "@/components/ui/HeatMap";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PLAN_DURATIONS, PLAN_THEMES } from "@/constants/themes";
import { TextStyle } from "@/constants/typography";
import { useApp, usePlan } from "@/context/AppContext";
import { getAllReadDates, updateActivePlanSettings } from "@/db/queries";
import { getTodayDayNumber } from "@/services/planEngine";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function PlanScreen() {
  const colors = useTheme();
  const { refreshPlan } = useApp();
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

    const currDay = getTodayDayNumber(plan.startDate, plan.durationDays) ?? 1;

    return {
      readDays: read,
      progress: read / plan.durationDays,
      currentDay: currDay,
    };
  }, [plan]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const historyMonths = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }, []);

  const toggleMonths = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllMonths(!showAllMonths);
  };

  const displayedMonths =
    historyYear === currentYear && !showAllMonths
      ? [currentMonth]
      : historyMonths;

  // Edit Plan State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTheme, setEditTheme] = useState<any>(plan?.theme || "faith");
  const [editDuration, setEditDuration] = useState<number>(
    plan?.durationDays || 7,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setEditTheme(plan.theme);
      setEditDuration(plan.durationDays);
    }
  }, [plan]);

  const handleSaveEdit = async () => {
    if (!plan) return;
    setIsSaving(true);
    try {
      // Re-generate unread days from the first unread day, or today, whichever is earlier?
      // "from day two we switch to love" -> If Day 1 is read, firstUnread is Day 2.
      const firstUnread =
        plan.days.find((d) => !d.isRead)?.dayNumber || currentDay;
      const startGenDay = Math.max(1, firstUnread);

      await updateActivePlanSettings(
        plan.id,
        editTheme,
        editDuration,
        plan.startDate,
        startGenDay,
      );
      await refreshPlan();
      setIsEditModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.headerRow,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.title,
                { color: colors.textPrimary },
                TextStyle.heading1,
              ]}
            >
              Your Plan
            </Text>
            {plan && (
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary },
                  TextStyle.caption,
                ]}
              >
                {plan.theme.charAt(0).toUpperCase() + plan.theme.slice(1)} •{" "}
                {plan.durationDays} Days
              </Text>
            )}
          </View>
          {plan && (
            <TouchableOpacity
              onPress={() => setIsEditModalVisible(true)}
              style={{
                padding: 8,
                backgroundColor: colors.surface,
                borderRadius: 20,
              }}
            >
              <Settings size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {!plan ? (
          <Text style={{ color: colors.textSecondary, marginTop: 24 }}>
            Loading plan...
          </Text>
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

            <View
              style={[
                styles.progressCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.progressInfo}>
                <Text
                  style={[TextStyle.heading3, { color: colors.textPrimary }]}
                >
                  Current Plan
                </Text>
                <Text
                  style={[
                    TextStyle.caption,
                    { color: colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  {readDays} out of {plan.durationDays} days completed
                </Text>
                <Text
                  style={[
                    TextStyle.heading2,
                    { color: colors.primary, marginTop: 8 },
                  ]}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <ProgressRing progress={progress} size={80} strokeWidth={8} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Full History Modal */}
      <Modal
        visible={isHistoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[TextStyle.heading2, { color: colors.textPrimary }]}>
              Streak History
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsHistoryModalVisible(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.yearSelector}>
            {historyYear > 2026 ? (
              <TouchableOpacity
                onPress={() => {
                  setHistoryYear((y) => Math.max(2026, y - 1));
                  setShowAllMonths(true); // Auto expand all months for past years
                }}
                style={{ padding: 8 }}
              >
                <ChevronLeft size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}

            <Text
              style={[
                TextStyle.heading2,
                {
                  color: colors.textPrimary,
                  minWidth: 80,
                  textAlign: "center",
                },
              ]}
            >
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
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <TouchableOpacity
                style={[
                  styles.badgeToggle,
                  { backgroundColor: colors.surface },
                ]}
                onPress={toggleMonths}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    TextStyle.caption,
                    {
                      color: colors.textPrimary,
                      marginRight: 6,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {showAllMonths ? "See less" : "See all months"}
                </Text>
                {showAllMonths ? (
                  <ChevronDown size={14} color={colors.textPrimary} />
                ) : (
                  <ChevronRight size={14} color={colors.textPrimary} />
                )}
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {displayedMonths.map((m) => (
              <View key={m} style={styles.monthWrapper}>
                <HeatMap
                  readDates={historicalReadDates}
                  year={historyYear}
                  month={m}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Plan Settings Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsEditModalVisible(false)}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: colors.surface }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>
                Edit Plan Settings
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: "100%" }}
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              <Text
                style={[
                  TextStyle.heading3,
                  { color: colors.textPrimary, marginBottom: 12 },
                ]}
              >
                Duration
              </Text>
              <View style={styles.optionsGrid}>
                {PLAN_DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d.days}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      editDuration === d.days && {
                        borderColor: colors.primary,
                        backgroundColor: "rgba(200, 134, 42, 0.05)",
                      },
                    ]}
                    onPress={() => setEditDuration(d.days)}
                  >
                    <Text
                      style={[
                        TextStyle.label,
                        {
                          color:
                            editDuration === d.days
                              ? colors.primary
                              : colors.textPrimary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[
                  TextStyle.heading3,
                  {
                    color: colors.textPrimary,
                    marginTop: 24,
                    marginBottom: 12,
                  },
                ]}
              >
                Theme
              </Text>
              <View style={styles.optionsGrid}>
                {PLAN_THEMES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      editTheme === t.id && {
                        borderColor: colors.primary,
                        backgroundColor: "rgba(200, 134, 42, 0.05)",
                      },
                    ]}
                    onPress={() => setEditTheme(t.id)}
                  >
                    <Text
                      style={[
                        TextStyle.label,
                        {
                          color:
                            editTheme === t.id
                              ? colors.primary
                              : colors.textPrimary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {t.emoji} {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: isSaving ? 0.7 : 1,
                  },
                ]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[TextStyle.heading3, { color: "#fff" }]}>
                    Update Plan
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
  },
  progressInfo: { flex: 1, marginRight: 16 },

  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  closeButton: { padding: 8, marginRight: -8 },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "center",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 32,
  },
});

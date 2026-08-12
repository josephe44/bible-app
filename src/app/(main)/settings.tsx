import { TextStyle } from "@/constants/typography";
import { useApp, usePlan } from "@/context/AppContext";
import {
  deleteActivePlan,
  updatePlanNotificationTime,
  updatePlanTranslation,
} from "@/db/queries";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  Moon,
  Trash2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Appearance,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage } from "@/utils/storage";

export default function SettingsScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();
  const { refreshPlan } = useApp();

  const [translation, setTranslation] = useState(plan?.translation || "kjv");
  const [isTranslationSheetVisible, setTranslationSheetVisible] =
    useState(false);
  const [isReminderSheetVisible, setReminderSheetVisible] = useState(false);

  const handleTranslationSelect = async (selected: string) => {
    if (selected !== "kjv") return;
    if (!plan) return;
    await updatePlanTranslation(plan.id, selected);
    setTranslation(selected);
    refreshPlan();
    setTranslationSheetVisible(false);
  };

  const handleReminderSelect = async (time: string | null) => {
    if (!plan) return;
    await updatePlanNotificationTime(plan.id, time);
    refreshPlan();
    setReminderSheetVisible(false);
  };

  const handleResetPlan = () => {
    Alert.alert(
      "Reset Plan?",
      "This will clear your current plan progress and journal entries. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await deleteActivePlan();
            await refreshPlan();
            router.replace("/");
          },
        },
      ],
    );
  };

  // Read synchronously from MMKV on mount
  const initialMode = storage.getString("reminderMode") || "notification";
  const [reminderMode, setReminderMode] = useState<"notification" | "alarm" | "both">(
    initialMode as any
  );
  const [isReminderModeSheetVisible, setReminderModeSheetVisible] = useState(false);

  const handleReminderModeSelect = (mode: "notification" | "alarm" | "both") => {
    storage.set("reminderMode", mode);
    setReminderMode(mode);
    setReminderModeSheetVisible(false);
  };

  const toggleDarkMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newScheme = colors.isDark ? "light" : "dark";
    Appearance.setColorScheme(newScheme);
  };

  const OptionRow = ({
    icon: Icon,
    title,
    value,
    onPress,
    isDestructive = false,
    isSwitch = false,
  }: any) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && !isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDestructive
                ? colors.error + "20"
                : colors.primary + "20",
            },
          ]}
        >
          <Icon
            size={20}
            color={isDestructive ? colors.error : colors.primary}
          />
        </View>
        <Text
          style={[
            {
              color: isDestructive ? colors.error : colors.textPrimary,
              marginLeft: 12,
            },
            TextStyle.label,
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value && (
          <Text
            style={[
              { color: colors.textSecondary, marginRight: 8 },
              TextStyle.caption,
            ]}
          >
            {value}
          </Text>
        )}
        {isSwitch ? (
          <Switch
            value={colors.isDark}
            onValueChange={toggleDarkMode}
            style={{ transform: [{ scale: 0.75 }] }}
          />
        ) : onPress ? (
          <ChevronRight size={20} color={colors.textMuted} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary },
            TextStyle.heading1,
          ]}
        >
          Settings
        </Text>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textSecondary },
              TextStyle.caption,
            ]}
          >
            PREFERENCES
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <OptionRow
              icon={Globe}
              title="Bible Translation"
              value={translation.toUpperCase()}
              onPress={() => setTranslationSheetVisible(true)}
            />
            <OptionRow
              icon={Bell}
              title="Daily Reminder"
              value={plan?.notificationTime || "Off"}
              onPress={() => setReminderSheetVisible(true)}
            />
            {plan?.notificationTime && (
              <OptionRow
                icon={Bell}
                title="Reminder Mode"
                value={
                  reminderMode === "notification"
                    ? "Notification"
                    : reminderMode === "alarm"
                    ? "Alarm"
                    : "Both"
                }
                onPress={() => setReminderModeSheetVisible(true)}
              />
            )}
            <OptionRow icon={Moon} title="Dark Mode" isSwitch />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textSecondary },
              TextStyle.caption,
            ]}
          >
            DATA & ACCOUNT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <OptionRow
              icon={Trash2}
              title="Reset Plan"
              isDestructive
              onPress={handleResetPlan}
            />
          </View>
        </View>
      </ScrollView>

      {/* Translation Bottom Sheet */}
      <Modal
        visible={isTranslationSheetVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setTranslationSheetVisible(false)}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: colors.surface }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>
                Bible Translation
              </Text>
              <Pressable onPress={() => setTranslationSheetVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <TouchableOpacity
              style={[styles.sheetItem, { borderBottomColor: colors.border }]}
              onPress={() => handleTranslationSelect("kjv")}
            >
              <Text style={[TextStyle.label, { color: colors.textPrimary }]}>
                King James Version (KJV)
              </Text>
              {translation === "kjv" && (
                <Check size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { borderBottomColor: colors.border }]}
              activeOpacity={1}
            >
              <Text style={[TextStyle.label, { color: colors.textMuted }]}>
                New International Version (NIV)
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[
                    { color: colors.primary, fontSize: 10, fontWeight: "bold" },
                  ]}
                >
                  COMING SOON
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} activeOpacity={1}>
              <Text style={[TextStyle.label, { color: colors.textMuted }]}>
                English Standard Version (ESV)
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[
                    { color: colors.primary, fontSize: 10, fontWeight: "bold" },
                  ]}
                >
                  COMING SOON
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reminder Bottom Sheet */}
      <Modal visible={isReminderSheetVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setReminderSheetVisible(false)}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: colors.surface }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>
                Daily Reminder
              </Text>
              <Pressable onPress={() => setReminderSheetVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {["06:00", "07:00", "08:00", "09:00", "20:00", null].map(
              (time, idx, arr) => (
                <TouchableOpacity
                  key={time || "off"}
                  style={[
                    styles.sheetItem,
                    idx !== arr.length - 1 && {
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleReminderSelect(time)}
                >
                  <Text
                    style={[TextStyle.label, { color: colors.textPrimary }]}
                  >
                    {time ? time : "Off"}
                  </Text>
                  {plan?.notificationTime === time && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>
      </Modal>

      {/* Reminder Mode Bottom Sheet */}
      <Modal visible={isReminderModeSheetVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setReminderModeSheetVisible(false)}
          />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>
                Reminder Mode
              </Text>
              <Pressable onPress={() => setReminderModeSheetVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {[
              { id: "notification", label: "Notification Only" },
              { id: "both", label: "Notification + Alarm" },
              { id: "alarm", label: "Alarm Only" },
            ].map((option, idx, arr) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sheetItem,
                  idx !== arr.length - 1 && { borderBottomColor: colors.border },
                ]}
                onPress={() => handleReminderModeSelect(option.id as any)}
              >
                <Text style={[TextStyle.label, { color: colors.textPrimary }]}>
                  {option.label}
                </Text>
                {reminderMode === option.id && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  title: { marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { marginBottom: 8, marginLeft: 12, letterSpacing: 1 },
  card: { borderRadius: 16, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  rowRight: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
    paddingBottom: 40,
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
  sheetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});

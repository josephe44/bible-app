import { ShareCard } from "@/components/ui/ShareCard";
import { TextStyle } from "@/constants/typography";
import versesData from "@/content/verses.json";
import { useApp } from "@/context/AppContext";
import { deleteJournalVersion, getJournalEntry, upsertJournalEntry } from "@/db/queries";
import { useTheme } from "@/hooks/useTheme";
import { shareVerseCard } from "@/services/shareService";
import { JournalEntry } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { History, Share, Volume2, X, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function VerseDeepDiveScreen() {
  const { day } = useLocalSearchParams();
  const { state, refreshPlan } = useApp();
  const theme = useTheme();
  const router = useRouter();
  const shareCardRef = useRef<View>(null);

  const dayNumber = parseInt(day as string, 10);
  const planDay = state.plan?.days.find((d) => d.dayNumber === dayNumber);
  const verseEntry = planDay
    ? versesData.find((v: any) => v.id === planDay.verseId)
    : null;

  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (state.plan) {
      getJournalEntry(state.plan.id, dayNumber).then((entry) => {
        setJournal(entry);
      });
    }
  }, [state.plan, dayNumber]);

  if (!verseEntry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text
          style={[
            TextStyle.lessonBody,
            { color: theme.textSecondary, padding: 24 },
          ]}
        >
          Verse not found.
        </Text>
      </View>
    );
  }

  const speak = () => {
    const textToSpeak = verseEntry.text;
    Speech.speak(textToSpeak, {
      language: "en-US",
      rate: 0.85,
    });
  };

  const handleShare = () => {
    shareVerseCard(shareCardRef);
  };

  const handleDeleteVersion = (timestamp: string) => {
    Alert.alert("Delete Version", "Delete this version from history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const planId = state.plan?.id;
        if (planId && dayNumber) {
          await deleteJournalVersion(planId, dayNumber, timestamp);
          const updated = await getJournalEntry(planId, dayNumber);
          setJournal(updated);
          if (updated) {
             setEditText(updated.content);
          } else {
             setEditText('');
             setIsEditing(false);
          }
        }
      }}
    ]);
  };

  const handleSaveEdit = async () => {
    if (!state.plan || !editText.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    await upsertJournalEntry(state.plan.id, dayNumber, editText.trim());
    const updated = await getJournalEntry(state.plan.id, dayNumber);
    setJournal(updated);
    setIsEditing(false);
    setIsSaving(false);
    refreshPlan();
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const startEditing = () => {
    setEditText(journal?.content || "");
    setIsEditing(true);
    // Add a slight delay to allow the layout to update, then scroll down
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const createdTimestamp =
    journal?.versions?.[0]?.timestamp || journal?.createdAt;
  const editedTimestamp =
    journal?.versions && journal.versions.length > 1
      ? journal.versions[journal.versions.length - 1].timestamp
      : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <X size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[TextStyle.heading3, { color: theme.textPrimary }]}>
          {(verseEntry as any).reference}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <Pressable onPress={speak} style={styles.actionButton}>
            <Volume2 size={20} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.hiddenShareCard}>
        <ShareCard
          ref={shareCardRef}
          verseText={verseEntry.text}
          reference={(verseEntry as any).reference}
          themeString={state.plan?.theme || "faith"}
          day={dayNumber}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {verseEntry.context_before ? (
            <Text
              style={[
                TextStyle.lessonBody,
                { color: theme.textSecondary, marginBottom: 12, opacity: 0.8 },
              ]}
            >
              {verseEntry.context_before}
            </Text>
          ) : null}

          <Text
            style={[
              TextStyle.verseBody,
              {
                color: theme.textPrimary,
                marginVertical: 16,
                textAlign: "center",
              },
            ]}
          >
            "{verseEntry.text}"
          </Text>

          {verseEntry.context_after ? (
            <Text
              style={[
                TextStyle.lessonBody,
                {
                  color: theme.textSecondary,
                  marginTop: 12,
                  marginBottom: 16,
                  opacity: 0.8,
                },
              ]}
            >
              {verseEntry.context_after}
            </Text>
          ) : (
            <View style={{ height: 16 }} />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 }}>
            <View style={{ backgroundColor: 'rgba(200, 134, 42, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={[TextStyle.caption, { color: theme.primary, textTransform: 'capitalize', fontWeight: '600' }]}>
                {verseEntry.themes?.[0] || state.plan?.theme || 'General'}
              </Text>
            </View>
          </View>

          {(journal || isEditing) && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[TextStyle.heading3, { color: theme.textPrimary }]}
                >
                  Your Reflection
                </Text>

                {journal?.versions && journal.versions.length > 0 && (
                  <Pressable
                    onPress={() => setIsHistoryModalVisible(true)}
                    style={styles.historyButton}
                  >
                    <History size={16} color={theme.primary} />
                    <Text
                      style={[
                        TextStyle.caption,
                        {
                          color: theme.primary,
                          marginLeft: 4,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      History
                    </Text>
                  </Pressable>
                )}
              </View>

              {isEditing ? (
                <View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.textPrimary,
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    placeholder="Write your reflection..."
                    placeholderTextColor={theme.textMuted}
                  />
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={() => setIsEditing(false)}
                      style={styles.cancelBtn}
                    >
                      <Text
                        style={[
                          TextStyle.label,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSaveEdit}
                      style={[
                        styles.saveBtn,
                        { backgroundColor: editText.trim() !== (journal?.content.trim() || '') ? theme.primary : theme.surface },
                      ]}
                      disabled={isSaving || editText.trim() === (journal?.content.trim() || '')}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[TextStyle.label, { color: editText.trim() !== (journal?.content.trim() || '') ? "#fff" : theme.textSecondary }]}>
                          Save
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={startEditing}>
                  <Text
                    style={[
                      TextStyle.lessonBody,
                      {
                        color: theme.textSecondary,
                        fontStyle: "italic",
                        marginBottom: 12,
                      },
                    ]}
                  >
                    "{journal?.content}"
                  </Text>

                  <View style={styles.badges}>
                    {createdTimestamp && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: theme.background },
                        ]}
                      >
                        <Text
                          style={[
                            TextStyle.caption,
                            { color: theme.textMuted, fontSize: 10 },
                          ]}
                        >
                          Created: {formatDate(createdTimestamp)}
                        </Text>
                      </View>
                    )}
                    {editedTimestamp && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: theme.background },
                        ]}
                      >
                        <Text
                          style={[
                            TextStyle.caption,
                            { color: theme.textMuted, fontSize: 10 },
                          ]}
                        >
                          Edited: {formatDate(editedTimestamp)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.beautifulShareButton,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleShare}
          >
            <Share size={20} color="#fff" />
            <Text
              style={[TextStyle.heading3, { color: "#fff", marginLeft: 12 }]}
            >
              Share Verse Image
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal visible={isHistoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsHistoryModalVisible(false)}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: theme.surface }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[TextStyle.heading3, { color: theme.textPrimary }]}>
                Reflection History
              </Text>
              <Pressable onPress={() => setIsHistoryModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: "80%" }}
              showsVerticalScrollIndicator={false}
            >
              {journal?.versions &&
                [...journal.versions].reverse().map((ver, idx, arr) => (
                  <View
                    key={idx}
                    style={[
                      styles.historyItem,
                      {
                        borderBottomColor: theme.border,
                        borderBottomWidth: idx !== arr.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View style={styles.historyItemHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          style={[
                            TextStyle.caption,
                            { color: theme.primary, fontWeight: "600" },
                          ]}
                        >
                          {idx === arr.length - 1
                            ? "Original version"
                            : "Edited version"}
                        </Text>
                        <Text
                          style={[TextStyle.caption, { color: theme.textMuted, marginLeft: 8 }]}
                        >
                          {formatDate(ver.timestamp)}
                        </Text>
                      </View>
                      <Pressable onPress={() => handleDeleteVersion(ver.timestamp)} style={{ padding: 4 }}>
                        <Trash2 size={16} color="#ff3b30" />
                      </Pressable>
                    </View>
                    <Text
                      style={[
                        TextStyle.lessonBody,
                        { color: theme.textSecondary, fontStyle: "italic" },
                      ]}
                    >
                      "{ver.content}"
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  actionButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200, 134, 42, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 12,
    fontFamily: "Inter-Regular",
    fontSize: 16,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hiddenShareCard: {
    position: "absolute",
    left: -10000,
    top: -10000,
    opacity: 0,
  },
  beautifulShareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
  historyItem: { paddingVertical: 16 },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
});

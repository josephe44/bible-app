import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, 
  TouchableOpacity, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { getNote, upsertNote } from '@/db/queries';
import { X, Check, History } from 'lucide-react-native';
import type { FeedItem } from '@/types';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = useTheme();

  const [noteContent, setNoteContent] = useState('');
  const [activeNote, setActiveNote] = useState<FeedItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(id !== 'new');

  useEffect(() => {
    if (id !== 'new') {
      getNote(parseInt(id as string, 10))
        .then(note => {
          if (note && note.type === 'note') {
            setActiveNote(note);
            setNoteContent(note.content);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleSave = async () => {
    if (!noteContent.trim()) return;
    setIsSaving(true);
    try {
      const noteId = id === 'new' ? null : parseInt(id as string, 10);
      await upsertNote(noteId, noteContent);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {showHistory ? (
            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.iconBtn}>
              <Text style={[TextStyle.heading3, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <Text style={[TextStyle.heading3, { color: colors.textPrimary }]}>
            {showHistory ? 'Version History' : (id === 'new' ? 'New Note' : 'Edit Note')}
          </Text>

          {!showHistory ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {activeNote?.versions && activeNote.versions.length > 0 && (
                <TouchableOpacity onPress={() => setShowHistory(true)} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
                  <History size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={isSaving || !noteContent.trim()}
                style={[
                  styles.saveBtn, 
                  { backgroundColor: noteContent.trim() ? colors.primary : colors.surface },
                  isSaving && { opacity: 0.7 }
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Check size={20} color={noteContent.trim() ? '#fff' : colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: 40 }} /> // Spacer
          )}
        </View>

        {showHistory && activeNote ? (
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {activeNote.versions?.map((v, i) => (
              <View key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={[TextStyle.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                  {new Date(v.timestamp).toLocaleString()}
                </Text>
                <Text style={[TextStyle.lessonBody, { color: colors.textPrimary }]}>
                  {v.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.editorContainer}>
            <TextInput
              style={[
                styles.textInput, 
                { color: colors.textPrimary },
                TextStyle.lessonBody
              ]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={noteContent}
              onChangeText={setNoteContent}
              textAlignVertical="top"
              autoFocus={id === 'new'}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorContainer: {
    flex: 1,
    padding: 24,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
  }
});

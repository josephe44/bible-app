import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePlan, useApp } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextStyle } from '@/constants/typography';
import { Bell, Globe, Moon, Trash2, ChevronRight } from 'lucide-react-native';
import { updatePlanTranslation, deleteActivePlan } from '@/db/queries';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const colors = useTheme();
  const plan = usePlan();
  const router = useRouter();
  const { refreshPlan } = useApp();
  const [translation, setTranslation] = useState(plan?.translation || 'niv');

  const handleTranslationChange = async () => {
    if (!plan) return;
    const nextTrans = translation === 'niv' ? 'esv' : 'niv'; // Simple toggle for now
    await updatePlanTranslation(plan.id, nextTrans);
    setTranslation(nextTrans);
    refreshPlan();
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
            router.replace('/');
          }
        }
      ]
    );
  };

  const OptionRow = ({ icon: Icon, title, value, onPress, isDestructive = false }: any) => (
    <TouchableOpacity 
      style={[styles.row, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDestructive ? colors.error + '20' : colors.primary + '20' }]}>
          <Icon size={20} color={isDestructive ? colors.error : colors.primary} />
        </View>
        <Text style={[{ color: isDestructive ? colors.error : colors.textPrimary, marginLeft: 12 }, TextStyle.label]}>
          {title}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[{ color: colors.textSecondary, marginRight: 8 }, TextStyle.caption]}>
            {value}
          </Text>
        )}
        {onPress && <ChevronRight size={20} color={colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
          Settings
        </Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }, TextStyle.caption]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <OptionRow 
              icon={Globe} 
              title="Bible Translation" 
              value={translation.toUpperCase()} 
              onPress={handleTranslationChange} 
            />
            <OptionRow 
              icon={Bell} 
              title="Daily Reminder" 
              value={plan?.notificationTime || "Off"} 
              onPress={() => Alert.alert("Coming Soon", "Notification rescheduler will be here.")} 
            />
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                  <Moon size={20} color={colors.primary} />
                </View>
                <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, TextStyle.label]}>
                  Dark Mode
                </Text>
              </View>
              <Switch value={colors.isDark} disabled />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }, TextStyle.caption]}>DATA & ACCOUNT</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 12,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

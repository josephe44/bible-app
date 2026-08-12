import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextStyle } from '@/constants/typography';
import { Trophy } from 'lucide-react-native';

interface MilestoneModalProps {
  visible: boolean;
  day: number;
  onClose: () => void;
}

export function MilestoneModal({ visible, day, onClose }: MilestoneModalProps) {
  const colors = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Trophy size={64} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }, TextStyle.heading1]}>
            Incredible!
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }, TextStyle.lessonBody]}>
            You've completed {day} days of your reading plan. Keep up the amazing work!
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, TextStyle.label]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
});

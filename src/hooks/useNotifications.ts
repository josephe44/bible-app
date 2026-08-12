import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from '@/utils/storage';

// ─────────────────────────────────────────
// Notification Handler (configure at app level)
// ─────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const mode = storage.getString("reminderMode") || "notification";
    return {
      shouldShowAlert: mode !== "alarm", // If purely alarm, we might still need to show alert for the OS to play sound on some versions, but let's keep it visible. Actually iOS requires a banner for sounds.
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// ─────────────────────────────────────────
// Permission Request
// ─────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─────────────────────────────────────────
// Schedule Daily Notification
// ─────────────────────────────────────────

const NOTIFICATION_IDENTIFIER = 'eword-daily-reminder';

/**
 * Schedules a repeating daily notification at the given time.
 * @param timeString - "HH:MM" in 24h format e.g. "07:00"
 */
export async function scheduleDailyNotification(timeString: string): Promise<void> {
  // Cancel any existing notification first
  await cancelDailyNotification();

  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const mode = storage.getString("reminderMode") || "notification";
  const useAlarmSound = mode === "alarm" || mode === "both";

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      useAlarmSound ? 'eword-alarm' : 'eword-default',
      {
        name: useAlarmSound ? 'Daily Reminder (Alarm)' : 'Daily Reminder',
        importance: Notifications.AndroidImportance.HIGH,
        sound: useAlarmSound ? 'alarm.wav' : undefined, // Custom sound for alarm, undefined for default
        vibrationPattern: useAlarmSound ? [0, 500, 500, 500] : [0, 250, 250, 250],
      }
    );
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIER,
    content: {
      title: '📖 Your Daily Word is Ready',
      body: "Open today's verse and let God's word guide your day.",
      sound: useAlarmSound ? 'alarm.wav' : true, // Use custom sound file or true for default
      data: { screen: 'home' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? (useAlarmSound ? 'eword-alarm' : 'eword-default') : undefined,
    },
  });
}

/**
 * Cancels the scheduled daily notification.
 */
export async function cancelDailyNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

interface UseNotificationsOptions {
  notificationTime: string | null;
  enabled: boolean;
}

export function useNotifications({ notificationTime, enabled }: UseNotificationsOptions): void {
  // We re-run setup when notificationTime changes or reminderMode changes.
  const mode = storage.getString("reminderMode") || "notification";
  
  const setupNotifications = useCallback(async () => {
    if (!enabled || !notificationTime) {
      await cancelDailyNotification();
      return;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[Eword] Notification permission denied.');
      return;
    }

    await scheduleDailyNotification(notificationTime);
  }, [enabled, notificationTime, mode]);

  useEffect(() => {
    setupNotifications();
  }, [setupNotifications]);
}

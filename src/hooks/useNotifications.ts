/**
 * Eword — useNotifications Hook
 * Schedules, cancels, and reschedules daily Bible verse reminders
 * using expo-notifications.
 */

import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─────────────────────────────────────────
// Notification Handler (configure at app level)
// ─────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
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

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIER,
    content: {
      title: '📖 Your Daily Word is Ready',
      body: "Open today's verse and let God's word guide your day.",
      sound: true,
      data: { screen: 'home' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
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
  }, [enabled, notificationTime]);

  useEffect(() => {
    setupNotifications();
  }, [setupNotifications]);
}

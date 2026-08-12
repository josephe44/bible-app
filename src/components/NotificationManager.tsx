import { useApp } from "@/context/AppContext";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationManager() {
  const { state } = useApp();
  
  // This hook will now automatically schedule/reschedule/cancel
  // whenever the plan's notificationTime or the reminderMode changes.
  useNotifications({
    notificationTime: state.plan?.notificationTime || null,
    enabled: !!state.plan,
  });

  return null;
}

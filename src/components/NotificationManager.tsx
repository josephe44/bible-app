import { useApp } from "@/context/AppContext";
import { useNotifications } from "@/hooks/useNotifications";
import { usePlanPhase } from "@/hooks/usePlanPhase";

export function NotificationManager() {
  const { state } = useApp();
  const { phase } = usePlanPhase(state.plan);
  
  // This hook will now automatically schedule/reschedule/cancel
  // whenever the plan's notificationTime or the reminderMode changes.
  useNotifications({
    notificationTime: state.plan?.notificationTime || null,
    // No reminders once the plan has run its course.
    enabled: !!state.plan && phase !== 'finished',
  });

  return null;
}

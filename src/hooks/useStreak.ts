import { usePlan } from '@/context/AppContext';

export function useStreak() {
  const plan = usePlan();
  
  if (!plan) return { currentStreak: 0, longestStreak: 0 };
  
  let currentStreak = 0;
  let longestStreak = 0;
  let currentTempStreak = 0;

  // Determine current day number
  const start = new Date(plan.startDate).getTime();
  const now = new Date().getTime();
  const diff = now - start;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  const currentDayNumber = Math.max(1, Math.min(days, plan.durationDays));

  for (const day of plan.days) {
    if (day.dayNumber > currentDayNumber) break;

    if (day.isRead) {
      currentTempStreak++;
      if (currentTempStreak > longestStreak) {
        longestStreak = currentTempStreak;
      }
    } else {
      currentStreak = currentTempStreak;
      currentTempStreak = 0;
    }
  }
  
  if (currentTempStreak > 0) {
    currentStreak = currentTempStreak;
  }

  return { currentStreak, longestStreak };
}

import { usePlan } from '@/context/AppContext';
import { getTodayDayNumber } from '@/services/planEngine';

export function useStreak() {
  const plan = usePlan();
  
  if (!plan) return { currentStreak: 0, longestStreak: 0 };
  
  let currentStreak = 0;
  let longestStreak = 0;
  let currentTempStreak = 0;

  // Determine current day number
  const currentDayNumber = getTodayDayNumber(plan.startDate, plan.durationDays) ?? 1;

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

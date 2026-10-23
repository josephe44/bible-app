import { usePlan } from '@/context/AppContext';
import { calculateStreak } from '@/services/planEngine';

export function useStreak() {
  const plan = usePlan();

  if (!plan) return { currentStreak: 0, longestStreak: 0 };

  // One missed day is forgiven; see calculateStreak.
  const { current, longest } = calculateStreak(plan.days, plan.startDate);
  return { currentStreak: current, longestStreak: longest };
}

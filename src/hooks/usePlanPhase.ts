import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { getPlanPhase, type PlanPhase } from '@/services/planEngine';
import type { Plan } from '@/types';

/**
 * Where the plan is relative to today. Recomputes when the app returns to the
 * foreground on a new calendar day, so a plan that ends overnight is noticed
 * without a restart.
 */
export function usePlanPhase(plan: Plan | null): { phase: PlanPhase; dayNumber: number } {
  const [dateString, setDateString] = useState(() => new Date().toDateString());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') setDateString(new Date().toDateString());
    });
    return () => subscription.remove();
  }, []);

  return useMemo(() => {
    if (!plan) return { phase: 'active' as const, dayNumber: 1 };
    return getPlanPhase(plan.startDate, plan.durationDays);
    // dateString is not read, but a new day must trigger a recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, dateString]);
}

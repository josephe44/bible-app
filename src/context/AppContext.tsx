/**
 * Eword — App Context
 * Global state for the active plan, hydrated from SQLite on mount.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { getActivePlan, markDayRead, upsertJournalEntry } from '@/db/queries';
import type { Plan } from '@/types';

// ─────────────────────────────────────────
// State Shape
// ─────────────────────────────────────────

interface AppState {
  plan: Plan | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  plan: null,
  isLoading: true,
  error: null,
};

// ─────────────────────────────────────────
// Actions
// ─────────────────────────────────────────

type Action =
  | { type: 'SET_PLAN'; payload: Plan | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'MARK_DAY_READ'; payload: { dayNumber: number } }
  | { type: 'SET_JOURNAL'; payload: { dayNumber: number; content: string } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PLAN':
      return { ...state, plan: action.payload, isLoading: false };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'MARK_DAY_READ': {
      if (!state.plan) return state;
      const updatedDays = state.plan.days.map((d) =>
        d.dayNumber === action.payload.dayNumber
          ? { ...d, isRead: true, readAt: new Date().toISOString() }
          : d
      );
      return { ...state, plan: { ...state.plan, days: updatedDays } };
    }

    case 'SET_JOURNAL': {
      if (!state.plan) return state;
      const updatedDays = state.plan.days.map((d) =>
        d.dayNumber === action.payload.dayNumber
          ? { ...d, journalEntry: action.payload.content }
          : d
      );
      return { ...state, plan: { ...state.plan, days: updatedDays } };
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Reload the active plan from SQLite */
  refreshPlan: () => Promise<void>;
  /** Mark a day as read (updates both DB and state) */
  markRead: (dayNumber: number) => Promise<void>;
  /** Save a journal entry (updates both DB and state) */
  saveJournal: (dayNumber: number, content: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─────────────────────────────────────────
// Provider
// ─────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshPlan = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const plan = await getActivePlan();
      dispatch({ type: 'SET_PLAN', payload: plan });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load your plan.' });
    }
  }, []);

  const markRead = useCallback(
    async (dayNumber: number) => {
      if (!state.plan) return;
      try {
        await markDayRead(state.plan.id, dayNumber);
        dispatch({ type: 'MARK_DAY_READ', payload: { dayNumber } });
      } catch (e) {
        console.error('Failed to mark day as read:', e);
      }
    },
    [state.plan]
  );

  const saveJournal = useCallback(
    async (dayNumber: number, content: string) => {
      if (!state.plan) return;
      try {
        await upsertJournalEntry(state.plan.id, dayNumber, content);
        dispatch({ type: 'SET_JOURNAL', payload: { dayNumber, content } });
      } catch (e) {
        console.error('Failed to save journal entry:', e);
      }
    },
    [state.plan]
  );

  // Hydrate plan from DB on mount
  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshPlan, markRead, saveJournal }}>
      {children}
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function usePlan(): Plan | null {
  return useApp().state.plan;
}

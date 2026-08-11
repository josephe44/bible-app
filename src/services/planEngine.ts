/**
 * Eword — Plan Engine
 * Selects and assigns Bible verses to plan days based on theme, duration, and a deterministic seed.
 */

import type { VerseEntry } from '@/types';
import type { Theme } from '@/constants/themes';

// ─────────────────────────────────────────
// Seeded Pseudo-Random Number Generator
// Ensures the same plan always produces the same verse order.
// Based on mulberry32.
// ─────────────────────────────────────────

function createSeededRandom(seed: number) {
  let s = seed;
  return function (): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(dateString: string): number {
  // Convert "YYYY-MM-DD" to a stable integer seed
  return dateString.split('-').reduce((acc, part, i) => acc + parseInt(part) * (i + 1) * 100, 0);
}

// ─────────────────────────────────────────
// Verse Filtering by Theme
// ─────────────────────────────────────────

function filterByTheme(verses: VerseEntry[], theme: Theme): VerseEntry[] {
  if (theme === 'general') return verses;
  return verses.filter((v) => v.themes.includes(theme));
}

// ─────────────────────────────────────────
// Shuffle with seeded PRNG
// ─────────────────────────────────────────

function seededShuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─────────────────────────────────────────
// Main: Generate Plan Days
// ─────────────────────────────────────────

export interface PlanDayAssignment {
  dayNumber: number;
  verseId: string;
}

/**
 * Generates a deterministic list of verse assignments for a plan.
 *
 * - Filters the verse library by theme
 * - If the duration > available verses, cycles through them with shuffled repeats
 * - Uses a seeded PRNG so the same startDate + theme always yields the same plan
 */
export function generatePlanDays(
  allVerses: VerseEntry[],
  theme: Theme,
  durationDays: number,
  startDate: string
): PlanDayAssignment[] {
  const seed = seedFromDate(startDate);
  const random = createSeededRandom(seed);

  let pool = filterByTheme(allVerses, theme);

  // Fallback: if theme has no verses, use all verses
  if (pool.length === 0) {
    pool = allVerses;
  }

  // Build enough verses for the full plan duration
  let selected: VerseEntry[] = [];
  while (selected.length < durationDays) {
    const shuffled = seededShuffle(pool, random);
    selected = [...selected, ...shuffled];
  }

  return selected.slice(0, durationDays).map((verse, index) => ({
    dayNumber: index + 1,
    verseId: verse.id,
  }));
}

// ─────────────────────────────────────────
// Utility: Get Today's Day Number
// ─────────────────────────────────────────

/**
 * Returns the current day number (1-based) relative to the plan start date.
 * Returns null if the plan hasn't started yet.
 * Returns durationDays if the plan is complete.
 */
export function getTodayDayNumber(startDate: string, durationDays: number): number | null {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null; // Plan hasn't started
  return Math.min(diffDays + 1, durationDays);
}

/**
 * Checks if a day is today
 */
export function isToday(startDate: string, dayNumber: number): boolean {
  return getTodayDayNumber(startDate, dayNumber) === dayNumber;
}

/**
 * Checks if the plan is complete
 */
export function isPlanComplete(startDate: string, durationDays: number): boolean {
  const todayDay = getTodayDayNumber(startDate, durationDays);
  return todayDay !== null && todayDay >= durationDays;
}

// ─────────────────────────────────────────
// Streak Calculation
// ─────────────────────────────────────────

export interface StreakInfo {
  current: number;
  longest: number;
  totalRead: number;
}

/**
 * Calculates the reading streak from plan_days read history.
 * A streak is consecutive days read, counting backwards from today.
 * Grace period: 1 missed day is allowed (streak doesn't break if yesterday was missed).
 */
export function calculateStreak(
  days: { dayNumber: number; isRead: boolean; readAt: string | null }[],
  startDate: string
): StreakInfo {
  const todayDay = getTodayDayNumber(startDate, days.length) ?? 0;
  const readSet = new Set(days.filter((d) => d.isRead).map((d) => d.dayNumber));
  const totalRead = readSet.size;

  // Calculate current streak (backwards from today)
  let current = 0;
  let missed = 0;
  for (let day = todayDay; day >= 1; day--) {
    if (readSet.has(day)) {
      current++;
      missed = 0;
    } else {
      missed++;
      if (missed > 1) break; // Only 1 grace day allowed
    }
  }

  // Calculate longest streak
  let longest = 0;
  let runLength = 0;
  let runMissed = 0;
  for (let day = 1; day <= todayDay; day++) {
    if (readSet.has(day)) {
      runLength++;
      runMissed = 0;
      longest = Math.max(longest, runLength);
    } else {
      runMissed++;
      if (runMissed > 1) {
        runLength = 0;
        runMissed = 0;
      }
    }
  }

  return { current, longest, totalRead };
}

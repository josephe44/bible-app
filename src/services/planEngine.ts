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

function seedFromPlan(theme: string, startDate: string): number {
  // FNV-1a hash of "theme|YYYY-MM-DD". Hashing (rather than summing the date
  // parts) keeps different dates and themes from sharing a seed.
  const input = `${theme}|${startDate}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
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
 * - Each pass through the library lists the theme's verses first, then the
 *   rest, each group shuffled, so no verse repeats until every verse has been
 *   used. A theme with few verses (or none) is topped up from the library
 *   rather than repeating the same verses.
 * - If the duration exceeds the library, further passes are reshuffled; a pass
 *   never starts with the verse the previous one ended on.
 * - Uses a seeded PRNG so the same theme + startDate always yields the same plan.
 */
export function generatePlanDays(
  allVerses: VerseEntry[],
  theme: Theme,
  durationDays: number,
  startDate: string
): PlanDayAssignment[] {
  const random = createSeededRandom(seedFromPlan(theme, startDate));

  const themed = filterByTheme(allVerses, theme);
  const themedIds = new Set(themed.map((v) => v.id));
  const rest = allVerses.filter((v) => !themedIds.has(v.id));

  const selected: VerseEntry[] = [];
  while (selected.length < durationDays && allVerses.length > 0) {
    const pass = [...seededShuffle(themed, random), ...seededShuffle(rest, random)];

    // Avoid the same verse on back-to-back days across the seam between passes
    const last = selected[selected.length - 1];
    if (last && pass.length > 1 && pass[0].id === last.id) {
      [pass[0], pass[1]] = [pass[1], pass[0]];
    }
    selected.push(...pass);
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
export function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
}

/** Formats a date as "YYYY-MM-DD" in the device's local time zone (not UTC). */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole calendar days from the plan's start date to today (0 on the start day). */
function daysSinceStart(startDate: string): number {
  const start = parseLocalDate(startDate);
  const today = new Date();

  // Convert to UTC midnights for the calendar dates to avoid Daylight Saving Time (DST) edge cases
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.floor((todayUtc - startUtc) / (1000 * 60 * 60 * 24));
}

export function getTodayDayNumber(startDate: string, durationDays: number): number | null {
  const diffDays = daysSinceStart(startDate);

  if (diffDays < 0) return null; // Plan hasn't started
  return Math.min(diffDays + 1, durationDays);
}

export type PlanPhase = 'upcoming' | 'active' | 'finished';

/**
 * Tells "on the last day" apart from "past the end", which getTodayDayNumber
 * cannot (it clamps both to durationDays).
 * - upcoming: the start date is in the future
 * - active:   dayNumber is today's day, 1..durationDays
 * - finished: today is after the last day; dayNumber is durationDays
 */
export function getPlanPhase(
  startDate: string,
  durationDays: number
): { phase: PlanPhase; dayNumber: number } {
  const diffDays = daysSinceStart(startDate);

  if (diffDays < 0) return { phase: 'upcoming', dayNumber: 1 };
  if (diffDays >= durationDays) return { phase: 'finished', dayNumber: durationDays };
  return { phase: 'active', dayNumber: diffDays + 1 };
}

/**
 * Checks if a day is today
 */
export function isToday(startDate: string, dayNumber: number): boolean {
  return daysSinceStart(startDate) + 1 === dayNumber;
}

/**
 * Checks if the plan is over: today is after its last day.
 * (On the last day itself the plan is still active.)
 */
export function isPlanComplete(startDate: string, durationDays: number): boolean {
  return getPlanPhase(startDate, durationDays).phase === 'finished';
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
    } else if (day === todayDay) {
      continue; // Today is still open; it isn't a miss until the day is over
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

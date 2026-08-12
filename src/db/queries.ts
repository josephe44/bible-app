/**
 * Eword — Database Query Helpers
 * CRUD operations for plan, plan_days, and journal tables.
 */

import { getDatabase } from './schema';
import type { Plan, PlanDay, JournalEntry } from '@/types';

// ─────────────────────────────────────────
// Plan
// ─────────────────────────────────────────

export async function createPlan(params: {
  theme: string;
  translation: string;
  durationDays: number;
  startDate: string;
  notificationTime: string | null;
}): Promise<number> {
  const db = await getDatabase();
  // Deactivate any existing active plan
  await db.runAsync('UPDATE plan SET is_active = 0 WHERE is_active = 1');

  const result = await db.runAsync(
    `INSERT INTO plan (theme, translation, duration_days, start_date, notification_time, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [
      params.theme,
      params.translation,
      params.durationDays,
      params.startDate,
      params.notificationTime,
      new Date().toISOString(),
    ]
  );
  return result.lastInsertRowId;
}

export async function getActivePlan(): Promise<Plan | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    theme: string;
    translation: string;
    duration_days: number;
    start_date: string;
    notification_time: string | null;
    created_at: string;
  }>('SELECT * FROM plan WHERE is_active = 1 LIMIT 1');

  if (!row) return null;

  const days = await getPlanDays(row.id);
  const journalEntries = await getJournalEntries(row.id);

  // Attach journal entries to the corresponding days
  const daysWithJournals = days.map(day => {
    const entry = journalEntries.find(j => j.dayNumber === day.dayNumber);
    return {
      ...day,
      journalEntry: entry ? entry.content : null,
    };
  });

  return {
    id: row.id,
    theme: row.theme as Plan['theme'],
    translation: row.translation as Plan['translation'],
    durationDays: row.duration_days,
    startDate: row.start_date,
    notificationTime: row.notification_time,
    createdAt: row.created_at,
    days: daysWithJournals,
  };
}

export async function deleteActivePlan(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM plan WHERE is_active = 1');
}

export async function updatePlanNotificationTime(
  planId: number,
  time: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE plan SET notification_time = ? WHERE id = ?', [time, planId]);
}

export async function updatePlanTranslation(
  planId: number,
  translation: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE plan SET translation = ? WHERE id = ?', [translation, planId]);
}

// ─────────────────────────────────────────
// Plan Days
// ─────────────────────────────────────────

export async function insertPlanDays(
  planId: number,
  days: { dayNumber: number; verseId: string }[]
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const day of days) {
      await db.runAsync(
        'INSERT OR IGNORE INTO plan_days (plan_id, day_number, verse_id) VALUES (?, ?, ?)',
        [planId, day.dayNumber, day.verseId]
      );
    }
  });
}

export async function getPlanDays(planId: number): Promise<PlanDay[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    day_number: number;
    verse_id: string;
    is_read: number;
    read_at: string | null;
  }>('SELECT * FROM plan_days WHERE plan_id = ? ORDER BY day_number ASC', [planId]);

  return rows.map((r) => ({
    id: r.id,
    dayNumber: r.day_number,
    verseId: r.verse_id,
    isRead: r.is_read === 1,
    readAt: r.read_at,
    journalEntry: null, // populated separately
  }));
}

export async function markDayRead(planId: number, dayNumber: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE plan_days SET is_read = 1, read_at = ? WHERE plan_id = ? AND day_number = ?',
    [new Date().toISOString(), planId, dayNumber]
  );
}

// ─────────────────────────────────────────
// Journal
// ─────────────────────────────────────────

export async function upsertJournalEntry(
  planId: number,
  dayNumber: number,
  content: string
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO journal (plan_id, day_number, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(plan_id, day_number) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
    [planId, dayNumber, content, now, now]
  );
}

export async function getJournalEntries(planId: number): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    day_number: number;
    content: string;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM journal WHERE plan_id = ? ORDER BY day_number ASC', [planId]);

  return rows.map((r) => ({
    id: r.id,
    dayNumber: r.day_number,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getJournalEntry(
  planId: number,
  dayNumber: number
): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    day_number: number;
    content: string;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM journal WHERE plan_id = ? AND day_number = ?', [planId, dayNumber]);

  if (!row) return null;
  return {
    id: row.id,
    dayNumber: row.day_number,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

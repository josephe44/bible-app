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
  for (const day of days) {
    await db.runAsync(
      `INSERT INTO plan_days (plan_id, day_number, verse_id) 
       VALUES (?, ?, ?)
       ON CONFLICT(plan_id, day_number) DO UPDATE SET verse_id = excluded.verse_id`,
      [planId, day.dayNumber, day.verseId]
    );
  }
}

import { generatePlanDays } from '@/services/planEngine';
import allVerses from '@/content/verses.json';
import type { Theme } from '@/constants/themes';

export async function updateActivePlanSettings(
  planId: number,
  newTheme: Theme,
  newDuration: number,
  startDate: string,
  startGeneratingFromDay: number
) {
  const db = await getDatabase();
  
  // 1. Update the plan table
  await db.runAsync(
    'UPDATE plan SET theme = ?, duration_days = ? WHERE id = ?',
    [newTheme, newDuration, planId]
  );
  
  // 2. Delete all future days that we are going to regenerate
  await db.runAsync(
    'DELETE FROM plan_days WHERE plan_id = ? AND day_number >= ?',
    [planId, startGeneratingFromDay]
  );
  
  // 3. Generate a full plan sequence to ensure we get the correct random pool
  const fullNewDays = generatePlanDays(allVerses as any, newTheme, newDuration, startDate);
  
  // Filter only the days we need to insert
  const daysToInsert = fullNewDays.filter(d => d.dayNumber >= startGeneratingFromDay);
  
  // Insert the days
  if (daysToInsert.length > 0) {
    await insertPlanDays(planId, daysToInsert);
  }
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

export async function getAllReadDates(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ read_at: string }>(
    'SELECT read_at FROM plan_days WHERE is_read = 1 AND read_at IS NOT NULL'
  );
  return rows.map(r => r.read_at);
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
  
  const existing = await getJournalEntry(planId, dayNumber);
  
  if (existing) {
    const versions = existing.versions || [];
    versions.push({ content, timestamp: now });
    const versionsJson = JSON.stringify(versions);
    await db.runAsync(
      'UPDATE journal SET content = ?, updated_at = ?, versions = ? WHERE plan_id = ? AND day_number = ?',
      [content, now, versionsJson, planId, dayNumber]
    );
  } else {
    const versions = [{ content, timestamp: now }];
    const versionsJson = JSON.stringify(versions);
    await db.runAsync(
      'INSERT INTO journal (plan_id, day_number, content, created_at, updated_at, versions) VALUES (?, ?, ?, ?, ?, ?)',
      [planId, dayNumber, content, now, now, versionsJson]
    );
  }
}

export async function getJournalEntries(planId: number): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    day_number: number;
    content: string;
    created_at: string;
    updated_at: string;
    versions: string | null;
  }>('SELECT * FROM journal WHERE plan_id = ? ORDER BY day_number ASC', [planId]);

  return rows.map((r) => {
    let parsedVersions = [];
    try {
      if (r.versions) parsedVersions = JSON.parse(r.versions);
    } catch(e) {}
    
    return {
      id: r.id,
      dayNumber: r.day_number,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      versions: parsedVersions,
    };
  });
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
    versions: string | null;
  }>('SELECT * FROM journal WHERE plan_id = ? AND day_number = ?', [planId, dayNumber]);

  if (!row) return null;
  
  let parsedVersions = [];
  try {
    if (row.versions) parsedVersions = JSON.parse(row.versions);
  } catch(e) {}

  return {
    id: row.id,
    dayNumber: row.day_number,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    versions: parsedVersions,
  };
}

// ─────────────────────────────────────────
// Notes & Unified Feed
// ─────────────────────────────────────────

export async function upsertNote(
  noteId: number | null,
  content: string
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  if (noteId) {
    const existing = await db.getFirstAsync<{ versions: string | null }>(
      'SELECT versions FROM notes WHERE id = ?', [noteId]
    );
    if (existing) {
      let versions = [];
      try {
        if (existing.versions) versions = JSON.parse(existing.versions);
      } catch(e) {}
      
      versions.push({ content, timestamp: now });
      const versionsJson = JSON.stringify(versions);
      await db.runAsync(
        'UPDATE notes SET content = ?, updated_at = ?, versions = ? WHERE id = ?',
        [content, now, versionsJson, noteId]
      );
      return;
    }
  }
  
  const versions = [{ content, timestamp: now }];
  const versionsJson = JSON.stringify(versions);
  await db.runAsync(
    'INSERT INTO notes (content, created_at, updated_at, versions) VALUES (?, ?, ?, ?)',
    [content, now, now, versionsJson]
  );
}

export async function getNote(id: number): Promise<FeedItem | null> {
  const db = await getDatabase();
  const r = await db.getFirstAsync<{
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    versions: string | null;
  }>('SELECT * FROM notes WHERE id = ?', [id]);
  
  if (!r) return null;
  
  let parsedVersions = [];
  try { if (r.versions) parsedVersions = JSON.parse(r.versions); } catch(e) {}
  
  return {
    type: 'note',
    id: r.id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    versions: parsedVersions,
  };
}

import type { FeedItem } from '@/types';

export async function getUnifiedJournalFeed(planId: number | null): Promise<FeedItem[]> {
  const db = await getDatabase();
  const items: FeedItem[] = [];

  // Fetch journal entries if plan exists
  if (planId) {
    const journalRows = await db.getAllAsync<{
      id: number;
      day_number: number;
      content: string;
      created_at: string;
      updated_at: string;
      versions: string | null;
    }>('SELECT * FROM journal WHERE plan_id = ?', [planId]);

    journalRows.forEach(r => {
      let parsedVersions = [];
      try { if (r.versions) parsedVersions = JSON.parse(r.versions); } catch(e) {}
      items.push({
        type: 'journal',
        id: r.id,
        dayNumber: r.day_number,
        content: r.content,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        versions: parsedVersions,
      });
    });
  }

  // Fetch standalone notes
  const noteRows = await db.getAllAsync<{
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    versions: string | null;
  }>('SELECT * FROM notes');

  noteRows.forEach(r => {
    let parsedVersions = [];
    try { if (r.versions) parsedVersions = JSON.parse(r.versions); } catch(e) {}
    items.push({
      type: 'note',
      id: r.id,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      versions: parsedVersions,
    });
  });

  // Sort by createdAt descending (newest first)
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return items;
}

/**
 * Eword — Global TypeScript Types
 */

import type { Theme, Translation } from '@/constants/themes';

// ─────────────────────────────────────────
// Verse / Content
// ─────────────────────────────────────────

export interface VerseEntry {
  id: string;                  // e.g. "PSA-23-1"
  reference: string;           // "Psalm 23:1"
  book: string;
  chapter: number;
  verse: number;
  themes: Theme[];
  text: string;                // KJV verse text
  lesson: string;              // 200–400 word devotional
  key_takeaway: string;        // 1-sentence practical application
  context_before: string;      // 2 verses of context before (KJV)
  context_after: string;       // 2 verses of context after (KJV)
}

// ─────────────────────────────────────────
// Plan
// ─────────────────────────────────────────

export interface Plan {
  id: number;
  theme: Theme;
  translation: 'kjv';
  durationDays: number;
  startDate: string;           // ISO date "YYYY-MM-DD"
  notificationTime: string | null;  // "HH:MM"
  createdAt: string;
  days: PlanDay[];
}

export interface PlanDay {
  id: number;
  dayNumber: number;           // 1-based
  verseId: string;
  isRead: boolean;
  readAt: string | null;
  journalEntry: string | null;
}

// ─────────────────────────────────────────
// Journal
// ─────────────────────────────────────────

export interface JournalEntry {
  id: number;
  dayNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  versions?: { content: string; timestamp: string }[];
}

// ─────────────────────────────────────────
// Plan Setup Wizard
// ─────────────────────────────────────────

export interface PlanSetupState {
  theme: Theme;
  translation: Translation;
  durationDays: number;
  customDays: number | null;
  startDate: string;
  notificationTime: string | null;
  notificationsEnabled: boolean;
}

export interface NoteEntry {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  versions?: { content: string; timestamp: string }[];
}

export type FeedItem = 
  | (JournalEntry & { type: 'journal' })
  | (NoteEntry & { type: 'note' });

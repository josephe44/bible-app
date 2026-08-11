# 📖 DailyWord — Bible Verse App: Full Product & Engineering Plan

> **Scope**: Everything from ideation → design → development → engineering → shipping.  
> **Workspace**: `/Users/osuohiaemmanuel/tech/bible-app`  
> **Stack**: Expo SDK 57 · React Native 0.86 · Expo Router v4 · TypeScript · React 19

---

## Table of Contents
1. [Product Vision & Thinking](#1-product-vision--thinking)
2. [Product Requirements Document (PRD)](#2-product-requirements-document-prd)
3. [Software Requirements Specification (SRS)](#3-software-requirements-specification-srs)
4. [Design System & UX](#4-design-system--ux)
5. [Architecture & Engineering](#5-architecture--engineering)
6. [Data Model](#6-data-model)
7. [Screen Inventory & Navigation Map](#7-screen-inventory--navigation-map)
8. [Feature Development Plan (Sprint Breakdown)](#8-feature-development-plan-sprint-breakdown)
9. [API & Integration Plan](#9-api--integration-plan)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment & Release Plan](#11-deployment--release-plan)
12. [Open Questions for User](#12-open-questions-for-user)

---

## 1. Product Vision & Thinking

### 1.1 The Problem
People want to grow spiritually through daily Bible reading, but they:
- Don't know where to start in a 66-book Bible
- Forget to read without reminders
- Read verses without understanding context or practical lesson
- Give up after a few days without a structured programme

### 1.2 The Solution — **DailyWord**
A guided, personalised daily Bible verse companion. The user commits to a reading plan (30 days or custom duration), receives one curated verse per day with a rich lesson/commentary, tracks their streak, and reflects with journaling.

### 1.3 North Star Metric
> **Daily Active Rate ≥ 60% by Day 14** — more than half of users who start a plan still reading by the midpoint.

### 1.4 Design Philosophy
- **Calm & Sacred** — soft warm palette, generous whitespace, serif typography for verse text
- **Habit-forming** — streaks, progress rings, gentle daily push notification
- **Personal** — user picks their plan, themes (Hope, Strength, Peace, etc.), translation
- **Offline-first** — all 30-day content downloaded at plan start; no internet required daily

---

## 2. Product Requirements Document (PRD)

### 2.1 Target Users
| Persona | Description |
|---|---|
| **New Believer** | Wants structured intro to the Bible with explanations |
| **Busy Professional** | 5-minute daily devotional, needs notification & brevity |
| **Small Group Leader** | Shares verse + lesson with their group |
| **Returning Reader** | Wants thematic plans (e.g., "30 Days of Peace") |

### 2.2 Core Features (MVP — v1.0)

#### F1 — Onboarding & Plan Setup
- Welcome screens (3-step carousel)
- Choose plan duration: **7 / 14 / 30 / 60 / 90 days** or **custom range**
- Choose a theme: General, Hope, Faith, Strength, Peace, Wisdom, Gratitude, Healing
- Choose Bible translation: **NIV, ESV, KJV, NKJV, NLT, AMP**
- Set daily reminder time (push notification)
- Start date defaults to today; can be set to any future date

#### F2 — Home / Today's Verse
- Shows Day N of M progress pill
- Highlighted verse card (book, chapter, verse reference)
- Full verse text in chosen translation
- **Lesson section**: 200–400 word devotional reflection tied to the verse
- **Key takeaway** bullet (1-sentence practical application)
- Mark as "Read" button → updates streak

#### F3 — Verse Detail / Deep Dive
- Full chapter context (3 verses before/after)
- Audio read-aloud of the verse (TTS via expo-speech)
- Highlight & copy verse text
- Share as image card (verse + reference beautifully styled)

#### F4 — 30-Day Plan Overview
- Horizontal calendar strip showing all days
- Completed days: filled circle ✓
- Current day: pulsing indicator
- Upcoming days: empty circle
- Tap any past day to review its verse and lesson

#### F5 — Streak & Progress
- Current streak counter with flame icon
- Longest streak badge
- Completion percentage ring
- Motivational message on milestone days (7, 14, 21, 30)

#### F6 — Journal / Reflection
- Per-day journal entry (500 char max)
- Saved locally (AsyncStorage / SQLite)
- View all past entries in a timeline

#### F7 — Settings
- Change translation mid-plan (re-fetches same verses in new translation)
- Change reminder time
- Reset progress / start new plan
- Theme toggle (Light / Dark / System)
- About & app version

### 2.3 Post-MVP Features (v1.1+)
- **Community** — share daily verse to social feed within app
- **Multiple concurrent plans** — e.g., personal plan + a group plan
- **AI Reflection** — ask a question about the verse, get an AI-powered answer
- **Offline audio** — pre-download narrated readings
- **Widget** — iOS/Android home screen widget showing today's verse

### 2.4 Non-Goals (explicitly out of scope for v1.0)
- Full Bible reader / concordance
- User accounts / cloud sync (local-only in v1.0)
- Social network / comments
- In-app purchases

---

## 3. Software Requirements Specification (SRS)

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | User can create a reading plan with a chosen duration (7–90 days or custom) | Must |
| FR-02 | System assigns one unique Bible verse per day for the plan duration | Must |
| FR-03 | Each verse has a lesson (devotional text, key takeaway) | Must |
| FR-04 | User can mark today's verse as read | Must |
| FR-05 | Streak is calculated and displayed | Must |
| FR-06 | Daily push notification at user-chosen time | Must |
| FR-07 | Plan overview calendar shows past/present/future days | Must |
| FR-08 | User can review any previously completed day | Must |
| FR-09 | User can write a journal entry per day | Should |
| FR-10 | User can share verse as an image | Should |
| FR-11 | Verse can be read aloud via TTS | Should |
| FR-12 | User can switch Bible translation | Should |
| FR-13 | All plan content is available offline after first load | Must |
| FR-14 | App supports Dark Mode | Must |
| FR-15 | User can start a new plan (replacing or alongside current) | Should |

### 3.2 Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | App cold start time | < 2 seconds on mid-range device |
| NFR-02 | Verse + lesson load time (cached) | < 100ms |
| NFR-03 | Offline availability | 100% of plan content after initial setup |
| NFR-04 | Crash-free rate | ≥ 99.5% |
| NFR-05 | Accessibility | WCAG AA, dynamic type, screen reader support |
| NFR-06 | Bundle size | < 50MB download |
| NFR-07 | Notification delivery | ≥ 95% within 5 min of scheduled time |

### 3.3 Platform Requirements
- **iOS**: 16.0+
- **Android**: API 26+ (Android 8.0)
- **Web**: Not a primary target but Expo web must not crash

### 3.4 Permissions Required
| Permission | Reason |
|---|---|
| `NOTIFICATIONS` | Daily verse reminders |
| `SCHEDULE_EXACT_ALARM` (Android) | Precise notification scheduling |

---

## 4. Design System & UX

### 4.1 Visual Identity

| Token | Value |
|---|---|
| Primary | `#C8862A` (warm gold — wisdom, scripture) |
| Primary Dark | `#8B5E1A` |
| Accent | `#4A7C59` (forest green — growth, life) |
| Background Light | `#FAF6F0` (warm cream) |
| Background Dark | `#1A1208` (deep warm black) |
| Surface Light | `#FFFFFF` |
| Surface Dark | `#2A1E0F` |
| Text Primary Light | `#1C0F00` |
| Text Primary Dark | `#F5EDD8` |
| Text Secondary | `#7A6952` |
| Streak/Fire | `#FF6B2B` |
| Success | `#4CAF50` |

### 4.2 Typography
| Role | Font | Size | Weight |
|---|---|---|---|
| Verse Text | `Lora` (Serif) | 22px | 400 |
| Verse Reference | `Lora` (Serif) | 14px | 600 |
| Lesson Body | `Inter` | 16px | 400 |
| Key Takeaway | `Inter` | 15px | 500 |
| Heading | `Inter` | 24px | 700 |
| Caption | `Inter` | 12px | 400 |

### 4.3 UX Flow — First Launch
```
Splash Screen
     ↓
Onboarding Carousel (3 slides)
     ↓
Plan Setup Wizard
  Step 1: Choose Duration
  Step 2: Choose Theme
  Step 3: Choose Translation + Notification Time
     ↓
Plan Generation (loading state — "Preparing your 30-day journey...")
     ↓
Home / Day 1
```

### 4.4 UX Flow — Returning User
```
Splash Screen (< 1s)
     ↓
Home / Today's Verse
  (notification deep-links directly here)
```

### 4.5 Key UX Principles
- One primary action per screen — reduce cognitive load
- Verse card uses generous padding, soft shadow, subtle texture
- Lesson is collapsible to reduce overwhelm for quick readers
- Streak is celebrated but losing it doesn't feel punishing (grace period: 1 missed day allowed)
- All animations < 300ms, spring-based (Reanimated 4)

---

## 5. Architecture & Engineering

### 5.1 Tech Stack
| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 |
| Language | TypeScript 6 |
| Navigation | Expo Router v4 (file-based) |
| Animations | React Native Reanimated 4 |
| Local Storage | expo-sqlite (SQLite for plan data + journal) |
| Notifications | expo-notifications |
| TTS | expo-speech |
| Sharing | expo-sharing + expo-view-shot |
| HTTP Client | fetch (native) |
| State Management | React Context + useReducer (no Redux — app is simple enough) |
| Bible Content | Local JSON bundle (static, curated 90 verses w/ lessons) |

### 5.2 Content Strategy
The app ships with a **bundled content library** — a curated JSON file of:
- **90 unique verse entries** (covers up to 90-day plan)
- Each entry has: `reference`, `text_niv`, `text_esv`, `text_kjv`, `text_nkjv`, `text_nlt`, `text_amp`, `lesson`, `key_takeaway`, `theme[]`
- At plan creation, the algorithm selects N verses from the user's chosen theme, shuffled with a seed based on the start date (deterministic — same plan always gives same verses)
- No API call required after the initial content bundle loads

### 5.3 Folder Structure
```
src/
├── app/
│   ├── _layout.tsx               # Root layout, providers
│   ├── index.tsx                 # Entry → redirect to onboarding or home
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx           # 3-slide carousel
│   │   └── setup.tsx             # Plan setup wizard
│   ├── (main)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── home.tsx              # Today's verse
│   │   ├── plan.tsx              # 30-day calendar overview
│   │   ├── journal.tsx           # Journal timeline
│   │   └── settings.tsx          # Settings screen
│   └── verse/
│       └── [day].tsx             # Verse detail / deep dive
├── components/
│   ├── ui/
│   │   ├── VerseCard.tsx
│   │   ├── LessonSection.tsx
│   │   ├── StreakBadge.tsx
│   │   ├── DayCalendarStrip.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── PlanSetupStep.tsx
│   │   ├── JournalEntry.tsx
│   │   └── ShareCard.tsx
│   └── layout/
│       ├── ScreenWrapper.tsx
│       └── SectionHeader.tsx
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── themes.ts
├── content/
│   └── verses.json               # 90 curated verse entries
├── db/
│   ├── schema.ts                 # SQLite table definitions
│   └── queries.ts                # CRUD helpers
├── hooks/
│   ├── usePlan.ts                # Plan state, today's verse
│   ├── useStreak.ts              # Streak calculation
│   ├── useNotifications.ts       # Schedule/cancel notifications
│   └── useTheme.ts               # Light/dark theme
├── services/
│   ├── planEngine.ts             # Plan generation algorithm
│   └── shareService.ts           # Generate share image
├── context/
│   └── AppContext.tsx            # Global app state
└── global.css
```

### 5.4 Database Schema (SQLite via expo-sqlite)

```sql
-- Plan configuration
CREATE TABLE plan (
  id INTEGER PRIMARY KEY,
  theme TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'NIV',
  duration_days INTEGER NOT NULL,
  start_date TEXT NOT NULL,       -- ISO date string
  notification_time TEXT,         -- "HH:MM"
  created_at TEXT NOT NULL
);

-- Daily assigned verses
CREATE TABLE plan_days (
  id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES plan(id),
  day_number INTEGER NOT NULL,    -- 1-based
  verse_id TEXT NOT NULL,         -- references verses.json
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT                    -- ISO timestamp
);

-- Journal entries
CREATE TABLE journal (
  id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES plan(id),
  day_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 6. Data Model

### 6.1 Verse Entry (verses.json)
```typescript
interface VerseEntry {
  id: string;                    // e.g. "PSA-23-1"
  reference: string;             // "Psalm 23:1"
  book: string;                  // "Psalms"
  chapter: number;
  verse: number;
  themes: Theme[];               // ["peace", "hope"]
  translations: {
    niv: string;
    esv: string;
    kjv: string;
    nkjv: string;
    nlt: string;
    amp: string;
  };
  lesson: string;                // 200-400 word devotional
  key_takeaway: string;          // 1-sentence practical application
  context_before: string;        // 2 verses before (NIV)
  context_after: string;         // 2 verses after (NIV)
}
```

### 6.2 Plan State (in-memory, hydrated from SQLite)
```typescript
interface Plan {
  id: number;
  theme: Theme;
  translation: Translation;
  durationDays: number;
  startDate: string;
  notificationTime: string | null;
  days: PlanDay[];
}

interface PlanDay {
  dayNumber: number;
  verseId: string;
  isRead: boolean;
  readAt: string | null;
  journalEntry: string | null;
}
```

---

## 7. Screen Inventory & Navigation Map

```
Root Stack
├── (onboarding) — shown only if no plan exists
│   ├── welcome          → Splash + 3-slide intro carousel
│   └── setup            → 3-step plan wizard
│
└── (main) — Tab Navigator (shown when plan exists)
    ├── Tab: Home        → Today's verse + lesson + read button
    ├── Tab: Plan        → 30-day calendar overview
    ├── Tab: Journal     → Journal timeline + editor
    └── Tab: Settings    → App settings
        └── Modal: verse/[day] → Verse deep-dive (pushed from Home or Plan)
```

### Tab Bar Icons
| Tab | Icon (expo-symbols) | Label |
|---|---|---|
| Home | `book.fill` | Today |
| Plan | `calendar` | My Plan |
| Journal | `pencil.and.list.clipboard` | Journal |
| Settings | `gear` | Settings |

---

## 8. Feature Development Plan (Sprint Breakdown)

> Sprint = 1 week. Assumes solo developer.

### Sprint 0 — Foundation (Week 1)
- [x] Repo exists at `/Users/osuohiaemmanuel/tech/bible-app`
- [ ] Set up expo-sqlite, expo-notifications, expo-speech dependencies
- [ ] Create SQLite schema & migration runner
- [ ] Create `verses.json` content library (start with 30 entries, expand to 90)
- [ ] Build `planEngine.ts` — verse selection algorithm
- [ ] Set up `AppContext.tsx` with plan state
- [ ] Set up `useTheme.ts` with light/dark token system
- [ ] Define all design tokens in `constants/`

### Sprint 1 — Onboarding & Plan Setup (Week 2)
- [ ] `(onboarding)/welcome.tsx` — animated 3-slide carousel
- [ ] `(onboarding)/setup.tsx` — 3-step wizard (Duration → Theme → Translation + Notification)
- [ ] Plan generation on wizard completion → save to SQLite
- [ ] Notification scheduling via `expo-notifications`
- [ ] Redirect logic: first-launch → onboarding, returning → home

### Sprint 2 — Home & Verse Reading (Week 3)
- [ ] `(main)/home.tsx` — Today's Verse screen
- [ ] `VerseCard` component — animated entrance, gold border
- [ ] `LessonSection` component — collapsible, with key takeaway pill
- [ ] `StreakBadge` component — flame + count
- [ ] "Mark as Read" interaction — confetti burst + streak update
- [ ] `verse/[day].tsx` — deep-dive detail screen (context, TTS, share)
- [ ] expo-speech integration for read-aloud

### Sprint 3 — Plan Overview & Calendar (Week 4)
- [ ] `(main)/plan.tsx` — full calendar overview
- [ ] `DayCalendarStrip` component — horizontal scrolling strip
- [ ] `ProgressRing` component — circular SVG progress
- [ ] Milestone celebration modals (Day 7, 14, 21, 30)
- [ ] Tap past day → navigate to `verse/[day]` in review mode

### Sprint 4 — Journal & Settings (Week 5)
- [ ] `(main)/journal.tsx` — journal timeline view
- [ ] `JournalEntry` component — per-day card with text
- [ ] Journal editor — inline or modal text input, auto-save
- [ ] `(main)/settings.tsx` — all settings controls
- [ ] Translation switcher (updates plan_days with new translation key)
- [ ] Notification rescheduler (change time)
- [ ] Dark/light/system theme picker
- [ ] Reset plan + start new plan flow

### Sprint 5 — Polish, Sharing & QA (Week 6)
- [ ] `shareService.ts` — generate share card image (expo-view-shot)
- [ ] `ShareCard` component — styled verse image for social
- [ ] Full accessibility audit (screen reader labels, dynamic type)
- [ ] Performance profiling (Flashlist if needed for calendar)
- [ ] Edge cases: plan complete state, no verse assigned, notification permissions denied
- [ ] Onboarding skip + re-onboarding flow
- [ ] App icon, splash screen, metadata finalised

### Sprint 6 — Deployment Prep (Week 7)
- [ ] EAS Build configuration (`eas.json`)
- [ ] App Store Connect setup (bundle ID, metadata, screenshots)
- [ ] Google Play Console setup
- [ ] Internal TestFlight build
- [ ] Beta testing (5–10 testers)
- [ ] Fix beta feedback
- [ ] App Store submission

---

## 9. API & Integration Plan

### 9.1 Bible Content — Static Bundle (v1.0)
All verse data is **bundled inside the app** as `src/content/verses.json`.

**No API key required.** No network call for core reading.

Content to be manually curated and quality-checked before shipping.
- 90 verse entries × 6 translations × lesson + takeaway = ~450KB JSON (acceptable)

### 9.2 Push Notifications — expo-notifications
```typescript
// useNotifications.ts
import * as Notifications from 'expo-notifications';

// Request permission on plan setup
// Schedule a daily repeating notification at user's chosen time
// Notification deep-links to today's home screen
// Reschedule when user changes time in settings
// Cancel all when plan is reset
```

### 9.3 Text-to-Speech — expo-speech
```typescript
import * as Speech from 'expo-speech';

Speech.speak(verseText, {
  language: 'en-US',
  rate: 0.85,       // Slightly slower for reverence
  pitch: 1.0,
});
```

### 9.4 Share Card — expo-view-shot + expo-sharing
```typescript
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// Render a styled <ShareCard /> off-screen
// Capture as PNG
// Share via native share sheet
```

> [!NOTE]
> `react-native-view-shot` needs to be added to `package.json`. Alternatively, use `expo-print` to generate a PDF share card if view-shot has issues on new arch.

---

## 10. Testing Strategy

### 10.1 Unit Tests
- `planEngine.ts` — verify correct number of verses assigned, correct theme filtering, deterministic seeding
- `useStreak.ts` — streak calculation logic (consecutive days, grace period)
- Database queries — CRUD operations on plan, plan_days, journal

### 10.2 Component Tests (via `@testing-library/react-native`)
- `VerseCard` renders reference + text correctly
- `DayCalendarStrip` shows correct read/unread state
- `StreakBadge` displays correct count

### 10.3 E2E Tests (via Maestro)
- Onboarding → plan creation → home screen flow
- Mark verse as read → streak increments
- Navigate to past day → correct verse shown
- Settings: change translation → verse text updates

### 10.4 Manual QA Checklist
- [ ] iOS 16, 17, 18 (iPhone SE, iPhone 15)
- [ ] Android API 26, 30, 34 (low-end + flagship)
- [ ] Dark mode on both platforms
- [ ] Notification fires at correct time
- [ ] App works fully offline (airplane mode after plan creation)
- [ ] Share card looks correct on Instagram, WhatsApp
- [ ] Screen reader (VoiceOver / TalkBack) navigates all key screens

---

## 11. Deployment & Release Plan

### 11.1 Environments
| Environment | Method | Audience |
|---|---|---|
| Local Dev | `expo start` | Developer |
| Internal Preview | EAS Build `--profile preview` | Team (5 people) |
| TestFlight / Internal Track | EAS Submit | Beta testers (10–20) |
| Production | EAS Submit + App Store review | Public |

### 11.2 EAS Build Profiles (eas.json)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "YOUR_APPLE_ID" },
      "android": { "serviceAccountKeyPath": "./google-play-key.json" }
    }
  }
}
```

### 11.3 App Store Metadata
- **App Name**: DailyWord — Bible Verse Plan
- **Subtitle**: Daily Scripture & Devotional
- **Category**: Lifestyle → Reference
- **Age Rating**: 4+
- **Keywords**: bible, devotional, daily verse, scripture, christian, reading plan, faith

### 11.4 Launch Checklist
- [ ] Privacy Policy URL (required for App Store)
- [ ] App icon 1024×1024 (no alpha)
- [ ] Screenshots: 6.5", 5.5" iPhone + tablet
- [ ] Preview video (optional but boosts conversion)
- [ ] App Store description (< 4000 chars)
- [ ] What's New text (for version 1.0: "Initial release")
- [ ] Android: feature graphic 1024×500

---

## 12. Open Questions for User

> [!IMPORTANT]
> The following questions need your input before we begin Sprint 0 development.

### Q1 — App Name
The plan uses **DailyWord** as a working title. Do you want to keep this or have a preferred app name?

### Q2 — Content Ownership
The 90-verse lesson library needs to be written. Options:
- **A** — I write the lessons myself (you review + refine)
- **B** — We use AI to draft all 90 lessons (you review)
- **C** — We use a mix: AI draft + you personalise key ones

### Q3 — Monetisation (v1.1)
- **A** — Free forever (no IAP)
- **B** — Freemium: 7 days free, then one-time unlock (e.g. $2.99)
- **C** — Freemium: 7 days free, then subscription ($0.99/month)

### Q4 — Cloud Sync (v1.1 scope)
Should reading progress, journal entries, and streaks sync across devices?
- **A** — Yes, add a user account system (Supabase/Firebase)
- **B** — No, local-only is fine for now

### Q5 — Starting Point
The workspace already has an Expo 57 app scaffold. Do you want to:
- **A** — Build on top of the existing scaffold (keep it)
- **B** — Reset and start clean (`node scripts/reset-project.js`)

### Q6 — Priority Feature for v1.0 cutoff
If we run short on time, which feature can be cut from v1.0?
- **A** — Journal (add in v1.1)
- **B** — Share card image
- **C** — Text-to-speech read-aloud
- **D** — None — all are required

---

*Document created: 2026-08-11 | Version: 1.0 | Status: Awaiting User Approval*

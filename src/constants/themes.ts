/**
 * Eword — Plan Themes & Translations
 */

export const PLAN_THEMES = [
  { id: 'general',    label: 'General',    emoji: '📖', description: 'A balanced journey through scripture' },
  { id: 'hope',       label: 'Hope',       emoji: '🌅', description: 'Verses to lift your spirit and restore faith' },
  { id: 'faith',      label: 'Faith',      emoji: '✝️',  description: 'Deepen your trust in God\'s promises' },
  { id: 'strength',   label: 'Strength',   emoji: '💪', description: 'Find courage and resilience in God\'s word' },
  { id: 'peace',      label: 'Peace',      emoji: '🕊️',  description: 'Calm your heart with God\'s peace' },
  { id: 'wisdom',     label: 'Wisdom',     emoji: '🌟', description: 'Grow in godly wisdom and understanding' },
  { id: 'gratitude',  label: 'Gratitude',  emoji: '🙏', description: 'Cultivate a thankful heart' },
  { id: 'healing',    label: 'Healing',    emoji: '💚', description: 'Find restoration and wholeness' },
] as const;

export type Theme = typeof PLAN_THEMES[number]['id'];

export const PLAN_DURATIONS = [
  { days: 7,   label: '7 Days',   subtitle: 'A week of devotion' },
  { days: 14,  label: '14 Days',  subtitle: 'Two weeks of growth' },
  { days: 30,  label: '30 Days',  subtitle: 'A month of transformation' },
  { days: 60,  label: '60 Days',  subtitle: 'Two months of renewal' },
  { days: 90,  label: '90 Days',  subtitle: 'A season of deep study' },
] as const;

export type PlanDurationPreset = typeof PLAN_DURATIONS[number]['days'];

export const TRANSLATIONS = [
  { id: 'niv',  label: 'NIV',  fullName: 'New International Version' },
  { id: 'esv',  label: 'ESV',  fullName: 'English Standard Version' },
  { id: 'kjv',  label: 'KJV',  fullName: 'King James Version' },
  { id: 'nkjv', label: 'NKJV', fullName: 'New King James Version' },
  { id: 'nlt',  label: 'NLT',  fullName: 'New Living Translation' },
  { id: 'amp',  label: 'AMP',  fullName: 'Amplified Bible' },
] as const;

export type Translation = typeof TRANSLATIONS[number]['id'];

/** Milestone days that trigger celebration screens */
export const MILESTONE_DAYS = [7, 14, 21, 30, 60, 90] as const;

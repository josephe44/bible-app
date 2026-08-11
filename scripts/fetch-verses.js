#!/usr/bin/env node
/**
 * Eword — Verse Content Fetcher Script
 * Fetches 30 curated Bible verses from bible-api.com across all 6 translations.
 * Run: node scripts/fetch-verses.js
 * Output: src/content/verses.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Our 30 curated verses: 6 per theme
const VERSE_PLAN = [
  // ── HOPE ──
  { id: 'JER-29-11',   ref: 'jeremiah 29:11',    book: 'Jeremiah',       chapter: 29, verse: 11, themes: ['hope', 'general'] },
  { id: 'ROM-15-13',   ref: 'romans 15:13',       book: 'Romans',         chapter: 15, verse: 13, themes: ['hope'] },
  { id: 'ROM-8-28',    ref: 'romans 8:28',        book: 'Romans',         chapter: 8,  verse: 28, themes: ['hope', 'faith'] },
  { id: 'ISA-40-31',   ref: 'isaiah 40:31',       book: 'Isaiah',         chapter: 40, verse: 31, themes: ['hope', 'strength'] },
  { id: 'PSA-62-5',    ref: 'psalms 62:5',        book: 'Psalms',         chapter: 62, verse: 5,  themes: ['hope', 'peace'] },
  { id: 'LAM-3-22',    ref: 'lamentations 3:22',  book: 'Lamentations',   chapter: 3,  verse: 22, themes: ['hope', 'gratitude'] },

  // ── FAITH ──
  { id: 'HEB-11-1',    ref: 'hebrews 11:1',       book: 'Hebrews',        chapter: 11, verse: 1,  themes: ['faith'] },
  { id: 'EPH-2-8',     ref: 'ephesians 2:8',      book: 'Ephesians',      chapter: 2,  verse: 8,  themes: ['faith'] },
  { id: 'MAT-17-20',   ref: 'matthew 17:20',      book: 'Matthew',        chapter: 17, verse: 20, themes: ['faith'] },
  { id: 'GAL-2-20',    ref: 'galatians 2:20',     book: 'Galatians',      chapter: 2,  verse: 20, themes: ['faith'] },
  { id: 'JAS-2-17',    ref: 'james 2:17',         book: 'James',          chapter: 2,  verse: 17, themes: ['faith'] },
  { id: 'MRK-11-24',   ref: 'mark 11:24',         book: 'Mark',           chapter: 11, verse: 24, themes: ['faith'] },

  // ── STRENGTH ──
  { id: 'PHP-4-13',    ref: 'philippians 4:13',   book: 'Philippians',    chapter: 4,  verse: 13, themes: ['strength', 'general'] },
  { id: 'ISA-41-10',   ref: 'isaiah 41:10',       book: 'Isaiah',         chapter: 41, verse: 10, themes: ['strength'] },
  { id: '2CO-12-9',    ref: '2 corinthians 12:9', book: '2 Corinthians',  chapter: 12, verse: 9,  themes: ['strength'] },
  { id: 'PSA-46-1',    ref: 'psalms 46:1',        book: 'Psalms',         chapter: 46, verse: 1,  themes: ['strength', 'peace'] },
  { id: 'NEH-8-10',    ref: 'nehemiah 8:10',      book: 'Nehemiah',       chapter: 8,  verse: 10, themes: ['strength', 'gratitude'] },
  { id: 'JOS-1-9',     ref: 'joshua 1:9',         book: 'Joshua',         chapter: 1,  verse: 9,  themes: ['strength', 'faith'] },

  // ── PEACE ──
  { id: 'JHN-14-27',   ref: 'john 14:27',         book: 'John',           chapter: 14, verse: 27, themes: ['peace', 'general'] },
  { id: 'PHP-4-6',     ref: 'philippians 4:6',    book: 'Philippians',    chapter: 4,  verse: 6,  themes: ['peace'] },
  { id: 'ISA-26-3',    ref: 'isaiah 26:3',        book: 'Isaiah',         chapter: 26, verse: 3,  themes: ['peace'] },
  { id: 'PSA-23-1',    ref: 'psalms 23:1',        book: 'Psalms',         chapter: 23, verse: 1,  themes: ['peace', 'hope'] },
  { id: 'MAT-11-28',   ref: 'matthew 11:28',      book: 'Matthew',        chapter: 11, verse: 28, themes: ['peace', 'strength'] },
  { id: 'COL-3-15',    ref: 'colossians 3:15',    book: 'Colossians',     chapter: 3,  verse: 15, themes: ['peace'] },

  // ── WISDOM ──
  { id: 'PRO-3-5',     ref: 'proverbs 3:5',       book: 'Proverbs',       chapter: 3,  verse: 5,  themes: ['wisdom', 'faith'] },
  { id: 'JAS-1-5',     ref: 'james 1:5',          book: 'James',          chapter: 1,  verse: 5,  themes: ['wisdom'] },
  { id: 'PSA-119-105', ref: 'psalms 119:105',     book: 'Psalms',         chapter: 119,verse: 105,themes: ['wisdom'] },
  { id: 'PRO-1-7',     ref: 'proverbs 1:7',       book: 'Proverbs',       chapter: 1,  verse: 7,  themes: ['wisdom'] },
  { id: 'PRO-4-7',     ref: 'proverbs 4:7',       book: 'Proverbs',       chapter: 4,  verse: 7,  themes: ['wisdom'] },
  { id: 'JHN-1-1',     ref: 'john 1:1',           book: 'John',           chapter: 1,  verse: 1,  themes: ['wisdom', 'general'] },
];

// Translations available on bible-api.com (all public domain)
const TRANSLATIONS = ['kjv', 'web', 'asv', 'bbe', 'darby', 'dra'];

function fetchVerse(ref, translation) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(ref);
    const url = `https://bible-api.com/${encoded}?translation=${translation}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.text ? json.text.trim().replace(/\s+/g, ' ') : '');
        } catch {
          resolve('');
        }
      });
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`📖 Fetching ${VERSE_PLAN.length} verses × ${TRANSLATIONS.length} translations...`);
  const results = [];

  for (let i = 0; i < VERSE_PLAN.length; i++) {
    const verse = VERSE_PLAN[i];
    console.log(`  [${i + 1}/${VERSE_PLAN.length}] ${verse.id} ...`);

    const translations = {};
    for (const trans of TRANSLATIONS) {
      try {
        translations[trans] = await fetchVerse(verse.ref, trans);
        await delay(500); // Respect rate limit: 15 req / 30s
      } catch (e) {
        console.warn(`    ⚠️  Failed to fetch ${verse.id} in ${trans}`);
        translations[trans] = '';
      }
    }

    results.push({
      id: verse.id,
      reference: '', // will be filled from API response
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      themes: verse.themes,
      translations,
      // Lesson placeholders — to be filled by user
      lesson: `[LESSON for ${verse.id}] — Write your 200-400 word devotional lesson here. Reflect on what this verse means in daily life, its biblical context, and how it applies to the reader today.`,
      key_takeaway: `[TAKEAWAY for ${verse.id}] — Write a single practical sentence the reader can carry through their day.`,
      context_before: '',
      context_after: '',
    });
  }

  const outputPath = path.join(__dirname, '..', 'src', 'content', 'verses.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Done! Saved ${results.length} verses to ${outputPath}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Open src/content/verses.json`);
  console.log(`   2. Fill in the [LESSON] and [TAKEAWAY] fields for each verse`);
  console.log(`   3. Optionally add context_before and context_after text`);
}

main().catch(console.error);

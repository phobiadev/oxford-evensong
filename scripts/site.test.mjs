// Run: node --test scripts/
// Covers the browser modules under assets/ that back the site's routing and
// "now" handling: the Oxford-week arithmetic port, the Europe/London clock
// (including the October clock change), and the Tonight day-selection rule.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import * as browser from '../assets/oxweeks.js';
import { nowParts, clockLabel, timeLabel } from '../assets/london.js';
import { chooseDay } from '../assets/schedule.js';
import * as node from './oxweeks.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const MT = { id: '2026-MT', ...readJSON('data/index.json').terms['2026-MT'] };
const TT = readJSON('data/terms/2026-TT.json').term;

test('assets/oxweeks.js matches scripts/oxweeks.mjs across weeks -2..10', () => {
  for (const term of [MT, TT]) {
    for (let w = -2; w <= 10; w++) {
      for (const d of browser.DAYS) {
        const iso = browser.dateForWeekDay(term, w, d);
        assert.equal(iso, node.dateForWeekDay(term.id, w, d), `${term.id} ${w} ${d}`);
        assert.deepEqual(browser.weekDayForDate(term, iso), node.weekDayForDate(term.id, iso));
      }
    }
  }
});

test('termForDate picks the term whose -2..10 window holds the date', () => {
  const terms = [MT, TT];
  assert.equal(browser.termForDate(terms, '2026-05-12').id, '2026-TT');
  assert.equal(browser.termForDate(terms, '2026-10-25').id, '2026-MT');
  assert.equal(browser.termForDate(terms, '2026-08-01'), null);
});

test('the BST->GMT change (Sun 25 Oct 2026) does not drift a day', () => {
  // Michaelmas 2026 3rd Week is Sun 25 Oct .. Sat 31 Oct.
  assert.deepEqual(browser.weekDayForDate(MT, '2026-10-25'), { week: 3, day: 'Sun' });
  assert.deepEqual(browser.weekDayForDate(MT, '2026-10-26'), { week: 3, day: 'Mon' });
  assert.equal(browser.dateForWeekDay(MT, 3, 'Sun'), '2026-10-25');
});

test('nowParts parses a ?now= override as London wall-time', () => {
  const p = nowParts('2026-10-25T01:30');
  assert.equal(p.date, '2026-10-25');
  assert.equal(p.minutes, 90);
  assert.equal(p.weekdayLong, 'Sunday');
  assert.equal(p.isOverride, true);

  const d = nowParts('2026-05-12');
  assert.equal(d.date, '2026-05-12');
  assert.equal(d.hasTime, false);
  assert.equal(d.weekdayShort, 'Tue');
});

test('nowParts real clock is well-formed and in Europe/London', () => {
  const p = nowParts(null);
  assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(p.minutes >= 0 && p.minutes < 1440);
  assert.equal(p.isOverride, false);
});

test('clock / time labels use a dot and no leading zero', () => {
  assert.equal(clockLabel(17 * 60 + 52), '5.52 pm');
  assert.equal(clockLabel(0), '12.00 am');
  assert.equal(timeLabel('18:00'), '6.00 pm');
  assert.equal(timeLabel(null), '—');
});

test('chooseDay advances once the last service has begun', () => {
  const map = new Map([
    ['2026-05-12', [{ time: '18:00' }, { time: '21:00' }]],
    ['2026-05-13', [{ time: '18:00' }]],
  ]);
  // before the last start: stay
  assert.deepEqual(
    chooseDay(map, { date: '2026-05-12', minutes: 19 * 60 }, null),
    { date: '2026-05-12', advanced: false },
  );
  // at/after the last start: advance to the next day with services
  assert.deepEqual(
    chooseDay(map, { date: '2026-05-12', minutes: 21 * 60 }, null),
    { date: '2026-05-13', advanced: true },
  );
});

test('chooseDay advances after 21:00 on an empty day, but leaves another day alone', () => {
  const map = new Map([['2026-05-16', [{ time: '18:00' }]]]);
  assert.deepEqual(
    chooseDay(map, { date: '2026-05-14', minutes: 21 * 60 + 30 }, null),
    { date: '2026-05-16', advanced: true },
  );
  // an explicit ?date= for a day that is not "today" is shown as-is
  assert.deepEqual(
    chooseDay(map, { date: '2026-05-14', minutes: 21 * 60 + 30 }, '2026-05-13'),
    { date: '2026-05-13', advanced: false },
  );
});

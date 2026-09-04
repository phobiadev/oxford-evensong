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
import { searchHits, weekHeadTitle, pickerWeekRange } from '../assets/views.js';
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

test('pickerWeekRange: default 0..8, widened only to cover weeks that hold services', () => {
  assert.deepEqual(pickerWeekRange(TT, null), [0, 8]);
  assert.deepEqual(pickerWeekRange(TT, { servicesByDate: new Map() }), [0, 8]);

  const map = new Map([
    [browser.dateForWeekDay(TT, -1, 'Wed'), [{}]],
    [browser.dateForWeekDay(TT, 9, 'Thu'), [{}]],
  ]);
  assert.deepEqual(pickerWeekRange(TT, { servicesByDate: map }), [-1, 9]);

  // empty arrays don't count; the band never exceeds MIN_WEEK..MAX_WEEK
  const empties = new Map([[browser.dateForWeekDay(TT, -2, 'Sun'), []]]);
  assert.deepEqual(pickerWeekRange(TT, { servicesByDate: empties }), [0, 8]);
});

test('termForDate picks the term whose -2..10 window holds the date', () => {
  const terms = [MT, TT];
  assert.equal(browser.termForDate(terms, '2026-05-12').id, '2026-TT');
  assert.equal(browser.termForDate(terms, '2026-10-25').id, '2026-MT');
  assert.equal(browser.termForDate(terms, '2026-08-01'), null);
});

test('weekHeadTitle names in-band weeks and falls back to "Vacation"', () => {
  assert.equal(weekHeadTitle(MT, 3), '3rd Week of Michaelmas');
  assert.equal(weekHeadTitle(MT, 0), '0th Week of Michaelmas');
  assert.equal(weekHeadTitle(MT, -2), '-2nd Week of Michaelmas');
  assert.equal(weekHeadTitle(MT, 11), 'Vacation');
  assert.equal(weekHeadTitle(MT, -9), 'Vacation');
});

test('isValidISODate rejects bad shapes and impossible calendar dates', () => {
  for (const ok of ['2026-05-12', '2027-01-01', '2024-02-29']) {
    assert.equal(browser.isValidISODate(ok), true, ok);
  }
  for (const bad of [
    'not-a-date', '2026-13-01', '2026-02-30', '2026-00-10', '2026-1-1',
    '2026/05/12', '', null, undefined, '2026-05-12T18:00',
  ]) {
    assert.equal(browser.isValidISODate(bad), false, JSON.stringify(bad));
  }
});

test('31 December resolves into the next term across the year boundary', () => {
  const HT = { id: '2027-HT', ...readJSON('data/index.json').terms['2027-HT'] };
  // MT ends 5 Dec; its +14d window stops at 19 Dec. HT starts 17 Jan; its -21d
  // window reaches back to 27 Dec. 31 Dec falls in the HT window.
  assert.equal(browser.termForDate([MT, HT], '2026-12-31').id, '2027-HT');
  // the gap between the two windows (20-26 Dec) belongs to no term
  assert.equal(browser.termForDate([MT, HT], '2026-12-23'), null);
  // and 31 Dec sits in HT's -2nd week (a Thursday), not off the end of MT
  assert.deepEqual(browser.weekDayForDate(HT, '2026-12-31'), { week: -2, day: 'Thu' });
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

test('nowParts falls back to the real clock for an impossible override date', () => {
  // ?now=2026-02-30 is shape-valid but not a real date; must not be trusted
  // (it used to crash downstream in chooseDay / week arithmetic).
  const p = nowParts('2026-02-30');
  assert.equal(p.isOverride, false);
  assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('nowParts handles a midnight override', () => {
  const p = nowParts('2026-06-01T00:00');
  assert.equal(p.date, '2026-06-01');
  assert.equal(p.minutes, 0);
  assert.equal(p.clock, '12.00 am');
  assert.equal(p.hasTime, true);
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

// ---- Find music: filter + sort (searchHits) ----

const svc = (over) => ({
  id: `${over.date}-${over.venueId}-${(over.time || '').replace(':', '')}`,
  title: over.title || 'Choral Evensong',
  time: over.time ?? '18:00',
  type: over.type || 'choral-evensong',
  music: over.music || [],
  _venue: { name: over.venueName || over.venueId, shortName: over.venueId },
  ...over,
});

const SVCS = [
  svc({ date: '2026-05-10', venueId: 'magdalen', venueName: 'Magdalen College',
    music: [{ slot: 'canticles', text: 'Howells — Collegium Regale', composer: 'Howells' }] }),
  svc({ date: '2026-05-14', venueId: 'newcollege', venueName: 'New College',
    type: 'choral-eucharist',
    music: [{ slot: 'setting', text: 'Byrd — Mass for Four Voices', composer: 'Byrd' }] }),
  svc({ date: '2026-05-20', venueId: 'magdalen', venueName: 'Magdalen College',
    music: [{ slot: 'anthem', text: 'Howells — Take him earth', composer: 'Howells' }] }),
  svc({ date: '2026-05-25', venueId: 'christ-church', venueName: 'Christ Church',
    music: [{ slot: 'canticles', text: 'Stanford in A', composer: 'Stanford' }] }),
];

test('searchHits: upcoming-only is the default and reports what it hides', () => {
  const r = searchHits(SVCS, { q: 'howells', today: '2026-05-15' });
  assert.deepEqual(r.hits.map((h) => h.s.date), ['2026-05-20']);
  assert.equal(r.hiddenPast, 1);
});

test('searchHits: past=… (upcomingOnly false) returns every match, no hidden count', () => {
  const r = searchHits(SVCS, { q: 'howells', upcomingOnly: false, today: '2026-05-15' });
  assert.deepEqual(r.hits.map((h) => h.s.date), ['2026-05-10', '2026-05-20']);
  assert.equal(r.hiddenPast, 0);
});

test('searchHits: venue and type filters narrow the matches', () => {
  assert.equal(
    searchHits(SVCS, { q: 'a', venue: 'magdalen', upcomingOnly: false, today: '2026-01-01' }).hits.length,
    2,
  );
  const byType = searchHits(SVCS, { q: 'a', type: 'choral-eucharist', upcomingOnly: false, today: '2026-01-01' });
  assert.deepEqual(byType.hits.map((h) => h.s.venueId), ['newcollege']);
});

test('searchHits: date-desc reverses the day groups; composer sort is one flat A–Z group', () => {
  const desc = searchHits(SVCS, { q: 'a', sort: 'date-desc', upcomingOnly: false, today: '2026-01-01' });
  assert.deepEqual(desc.groups.map((g) => g.items[0].s.date),
    ['2026-05-25', '2026-05-20', '2026-05-14', '2026-05-10']);

  const comp = searchHits(SVCS, { q: 'a', sort: 'composer', upcomingOnly: false, today: '2026-01-01' });
  assert.equal(comp.groups.length, 1);
  assert.deepEqual(comp.groups[0].items.map((h) => h.m.composer),
    ['Byrd', 'Howells', 'Howells', 'Stanford']);
});

test('searchHits: chapel sort groups by venue name, alphabetically', () => {
  const r = searchHits(SVCS, { q: 'a', sort: 'chapel', upcomingOnly: false, today: '2026-01-01' });
  assert.deepEqual(r.groups.map((g) => g.heading),
    ['Christ Church', 'Magdalen College', 'New College']);
  assert.deepEqual(r.groups[1].items.map((h) => h.s.date), ['2026-05-10', '2026-05-20']);
});

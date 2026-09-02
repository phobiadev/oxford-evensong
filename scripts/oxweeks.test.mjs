// Run: node --test scripts/
import test from 'node:test';
import assert from 'node:assert/strict';

import { dateForWeekDay, weekDayForDate, termForDate, resolveTerm } from './oxweeks.mjs';

test('1st Week Sunday of Michaelmas 2026 (from data/index.json)', () => {
  assert.equal(dateForWeekDay('2026-MT', 1, 'Sun'), '2026-10-11');
  assert.equal(dateForWeekDay('2026-MT', 1, 'Wed'), '2026-10-14');
  assert.deepEqual(weekDayForDate('2026-MT', '2026-10-11'), { week: 1, day: 'Sun' });
});

test('0th Week and negative weeks', () => {
  assert.equal(dateForWeekDay('2026-MT', 0, 'Sun'), '2026-10-04');
  assert.equal(dateForWeekDay('2026-MT', 0, 'Wed'), '2026-10-07');
  assert.equal(dateForWeekDay('2026-MT', -1, 'Sat'), '2026-10-03');
  assert.deepEqual(weekDayForDate('2026-MT', '2026-10-04'), { week: 0, day: 'Sun' });
  assert.deepEqual(weekDayForDate('2026-MT', '2026-10-10'), { week: 0, day: 'Sat' });
});

test('the Sunday UK clocks go back (25 Oct 2026) is in Michaelmas 3rd Week', () => {
  // BST -> GMT overnight 25 Oct 2026; date arithmetic must not drift a day.
  assert.deepEqual(weekDayForDate('2026-MT', '2026-10-25'), { week: 3, day: 'Sun' });
  assert.equal(dateForWeekDay('2026-MT', 3, 'Sun'), '2026-10-25');
  // and the day after the transition
  assert.deepEqual(weekDayForDate('2026-MT', '2026-10-26'), { week: 3, day: 'Mon' });
  assert.equal(dateForWeekDay('2026-MT', 3, 'Mon'), '2026-10-26');
});

test('term resolved from a term file when absent from index.json (TT26 fixture)', () => {
  assert.equal(dateForWeekDay('2026-TT', 3, 'Sun'), '2026-05-10');
  assert.equal(dateForWeekDay('2026-TT', 3, 'Sat'), '2026-05-16');
  assert.deepEqual(weekDayForDate('2026-TT', '2026-05-14'), { week: 3, day: 'Thu' });
});

test('dateForWeekDay <-> weekDayForDate round-trips across weeks -2..10', () => {
  for (let w = -2; w <= 10; w++) {
    for (const d of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      const iso = dateForWeekDay('2026-MT', w, d);
      assert.deepEqual(weekDayForDate('2026-MT', iso), { week: w, day: d });
    }
  }
});

test('dateForWeekDay rejects out-of-range weeks and bad day names', () => {
  assert.throws(() => dateForWeekDay('2026-MT', 11, 'Sun'), /out of range/);
  assert.throws(() => dateForWeekDay('2026-MT', -3, 'Sun'), /out of range/);
  assert.throws(() => dateForWeekDay('2026-MT', 2, 'Someday'), /day name/);
});

test('termForDate', () => {
  assert.equal(termForDate('2026-10-25'), '2026-MT');
  assert.equal(termForDate('2026-12-05'), '2026-MT'); // Saturday of 8th Week
  assert.equal(termForDate('2026-05-10'), '2026-TT'); // from the fixture term file
  assert.equal(termForDate('2026-08-01'), null); // deep in the Long Vacation
});

test('resolveTerm throws for an unknown term', () => {
  assert.throws(() => resolveTerm('1999-XT'), /Unknown term/);
});

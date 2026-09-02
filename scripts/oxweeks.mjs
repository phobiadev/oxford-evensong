// Oxford-week arithmetic. Deterministic; no dependencies.
//
// Oxford weeks run Sunday to Saturday. The Sunday of 1st Week is the start of
// Full Term (`weekOneSunday`). 0th Week is the week before; weeks -2 .. 10 are
// supported. Never do this arithmetic by hand elsewhere — call this module.
//
// Term dates are resolved from data/index.json `terms`. If a term id is not
// listed there, its own term file (data/terms/<id>.json `term` block) is used as
// a fallback — this is how the TT26 fixture works without a TT26 entry in
// index.json. See docs/data-schema.md.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_INDEX = new Map();
for (let i = 0; i < DAYS.length; i++) {
  DAY_INDEX.set(DAYS[i].toLowerCase(), i);
  DAY_INDEX.set(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][i], i);
}

const DAY_MS = 86_400_000;
const MIN_WEEK = -2;
const MAX_WEEK = 10;

// --- term registry ---------------------------------------------------------

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function indexTerms() {
  const path = join(DATA, 'index.json');
  if (!existsSync(path)) return {};
  const out = {};
  const terms = readJSON(path).terms ?? {};
  for (const [id, t] of Object.entries(terms)) out[id] = { id, ...t };
  return out;
}

function termFileBlocks() {
  const dir = join(DATA, 'terms');
  const out = {};
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    try {
      const term = readJSON(join(dir, name)).term;
      if (term && term.id) out[term.id] = term;
    } catch {
      // a malformed term file is validate.mjs's problem, not ours
    }
  }
  return out;
}

/** All terms known to the project: index.json terms plus any term files present. */
export function knownTerms() {
  return { ...indexTerms(), ...termFileBlocks() };
}

/** Resolve one term id to `{ id, name, weekOneSunday, lastSaturday, ... }`. */
export function resolveTerm(termId) {
  const term = knownTerms()[termId];
  if (!term) {
    throw new Error(`Unknown term "${termId}" — not in data/index.json or data/terms/`);
  }
  return term;
}

// --- date helpers (all arithmetic in UTC so DST never shifts a date) --------

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) throw new Error(`Not an ISO date (YYYY-MM-DD): ${iso}`);
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(ms);
  if (
    d.getUTCFullYear() !== Number(m[1]) ||
    d.getUTCMonth() !== Number(m[2]) - 1 ||
    d.getUTCDate() !== Number(m[3])
  ) {
    throw new Error(`Not a real calendar date: ${iso}`);
  }
  return ms;
}

function formatISO(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function dayIndex(dayName) {
  const i = DAY_INDEX.get(String(dayName).trim().toLowerCase());
  if (i === undefined) throw new Error(`Unknown day name: ${dayName}`);
  return i;
}

function assertWeek(week) {
  if (!Number.isInteger(week) || week < MIN_WEEK || week > MAX_WEEK) {
    throw new Error(`Week out of range (${MIN_WEEK}..${MAX_WEEK}): ${week}`);
  }
}

// --- public API -----------------------------------------------------------

/** ISO date of a given Oxford week + weekday in a term. */
export function dateForWeekDay(termId, week, dayName) {
  assertWeek(week);
  const term = resolveTerm(termId);
  const sunday = parseISO(term.weekOneSunday);
  if (new Date(sunday).getUTCDay() !== 0) {
    throw new Error(`${termId}: weekOneSunday ${term.weekOneSunday} is not a Sunday`);
  }
  return formatISO(sunday + (week - 1) * 7 * DAY_MS + dayIndex(dayName) * DAY_MS);
}

/** `{ week, day }` for an ISO date within a term (week may fall outside 0..9). */
export function weekDayForDate(termId, isoDate) {
  const term = resolveTerm(termId);
  const sunday = parseISO(term.weekOneSunday);
  const diffDays = Math.round((parseISO(isoDate) - sunday) / DAY_MS);
  const week = Math.floor(diffDays / 7) + 1;
  const day = DAYS[((diffDays % 7) + 7) % 7];
  return { week, day };
}

/**
 * Id of the term whose weeks -2..10 (i.e. [weekOneSunday - 21d, lastSaturday +
 * 14d]) contain the date, or null. Considers index.json terms and term files.
 */
export function termForDate(isoDate) {
  const ms = parseISO(isoDate);
  for (const term of Object.values(knownTerms())) {
    const lo = parseISO(term.weekOneSunday) - 21 * DAY_MS;
    const hi = parseISO(term.lastSaturday) + 14 * DAY_MS;
    if (ms >= lo && ms <= hi) return term.id;
  }
  return null;
}

export { DAYS, MIN_WEEK, MAX_WEEK };

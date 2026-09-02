// Oxford-week arithmetic for the browser. Pure: no I/O, no dependencies.
//
// This is a re-implementation of the date maths in scripts/oxweeks.mjs. That
// module reads term dates off the filesystem; this one takes resolved term
// objects ({ id, weekOneSunday, lastSaturday, ... }) as arguments, because the
// site already has the term data in memory. scripts/site.test.mjs asserts the
// two agree.
//
// Oxford weeks run Sunday to Saturday. The Sunday of 1st Week is the start of
// Full Term (weekOneSunday). 0th Week is the week before; weeks -2..10 hold.
// All arithmetic is in UTC so a daylight-saving change never shifts a date.

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_MS = 86_400_000;
const MIN_WEEK = -2;
const MAX_WEEK = 10;

const DAY_INDEX = new Map();
DAYS.forEach((d, i) => {
  DAY_INDEX.set(d.toLowerCase(), i);
  DAY_INDEX.set(
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][i],
    i,
  );
});

/** ISO date string -> UTC-midnight epoch ms. Throws on a non-date. */
export function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
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

/** UTC-midnight epoch ms -> ISO date string. */
export function formatISO(ms) {
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

/** Add n whole days to an ISO date, returning an ISO date. */
export function addDays(iso, n) {
  return formatISO(parseISO(iso) + n * DAY_MS);
}

/** ISO date of a given Oxford week + weekday within a term object. */
export function dateForWeekDay(term, week, dayName) {
  if (!Number.isInteger(week) || week < MIN_WEEK || week > MAX_WEEK) {
    throw new Error(`Week out of range (${MIN_WEEK}..${MAX_WEEK}): ${week}`);
  }
  const sunday = parseISO(term.weekOneSunday);
  if (new Date(sunday).getUTCDay() !== 0) {
    throw new Error(`${term.id}: weekOneSunday ${term.weekOneSunday} is not a Sunday`);
  }
  return formatISO(sunday + (week - 1) * 7 * DAY_MS + dayIndex(dayName) * DAY_MS);
}

/** { week, day } for an ISO date within a term (week may fall outside 0..9). */
export function weekDayForDate(term, isoDate) {
  const sunday = parseISO(term.weekOneSunday);
  const diffDays = Math.round((parseISO(isoDate) - sunday) / DAY_MS);
  const week = Math.floor(diffDays / 7) + 1;
  const day = DAYS[((diffDays % 7) + 7) % 7];
  return { week, day };
}

/**
 * The term whose weeks -2..10 (i.e. [weekOneSunday - 21d, lastSaturday + 14d])
 * contain the date, or null. `terms` is an iterable of term objects.
 */
export function termForDate(terms, isoDate) {
  const ms = parseISO(isoDate);
  for (const term of terms) {
    if (!term || !term.weekOneSunday || !term.lastSaturday) continue;
    const lo = parseISO(term.weekOneSunday) - 21 * DAY_MS;
    const hi = parseISO(term.lastSaturday) + 14 * DAY_MS;
    if (ms >= lo && ms <= hi) return term;
  }
  return null;
}

/** True when the date is within Full Term (1st-week Sunday .. 8th-week Saturday). */
export function inFullTerm(term, isoDate) {
  const ms = parseISO(isoDate);
  return ms >= parseISO(term.weekOneSunday) && ms <= parseISO(term.lastSaturday);
}

const ORDINALS = [
  '0th', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
];

/** 3 -> "3rd Week"; -1 -> "-1st Week"; out-of-list falls back to `${n}th Week`. */
export function ordinalWeek(n) {
  if (n >= 0 && n < ORDINALS.length) return `${ORDINALS[n]} Week`;
  const abs = Math.abs(n);
  const suffix = abs % 10 === 1 && abs % 100 !== 11 ? 'st'
    : abs % 10 === 2 && abs % 100 !== 12 ? 'nd'
    : abs % 10 === 3 && abs % 100 !== 13 ? 'rd' : 'th';
  return `${n}${suffix} Week`;
}

export { MIN_WEEK, MAX_WEEK };

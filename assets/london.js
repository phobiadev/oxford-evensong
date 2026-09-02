// "Now" in Europe/London — never the visitor's clock zone.
//
// Real now is read with Intl.DateTimeFormat(timeZone:'Europe/London'), which
// handles the March/October clock changes for us. A ?now= override (e.g.
// ?now=2026-10-29T17:40) is interpreted as London wall-time for testing and
// screenshots.

import { isValidISODate } from './oxweeks.js';

const DAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayIndexForISO(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** minutes since midnight -> "5.52 pm" (dot, lowercase, no leading zero). */
export function clockLabel(minutes) {
  let h = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, '0');
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}.${mm} ${ap}`;
}

/** "6.00 pm" from "HH:MM"; "—" from null. */
export function timeLabel(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  return clockLabel(h * 60 + m);
}

/**
 * @param {string|null} override  a ?now= value, or null for the real clock
 * @returns {{ date:string, minutes:number, weekdayLong:string, weekdayShort:string,
 *            clock:string, isOverride:boolean, hasTime:boolean }}
 */
export function nowParts(override) {
  if (override) {
    const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(override.trim());
    if (m && isValidISODate(m[1])) {
      const date = m[1];
      const hasTime = m[2] !== undefined;
      const minutes = hasTime ? Number(m[2]) * 60 + Number(m[3]) : 0;
      const wi = weekdayIndexForISO(date);
      return {
        date,
        minutes,
        weekdayLong: DAYS_LONG[wi],
        weekdayShort: DAYS_SHORT[wi],
        clock: clockLabel(minutes),
        isOverride: true,
        hasTime,
      };
    }
  }

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'long',
  });
  const parts = {};
  for (const p of fmt.formatToParts(new Date())) parts[p.type] = p.value;
  let hour = Number(parts.hour) % 24; // en-GB can emit "24" at midnight
  const minutes = hour * 60 + Number(parts.minute);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const wi = weekdayIndexForISO(date);
  return {
    date,
    minutes,
    weekdayLong: DAYS_LONG[wi],
    weekdayShort: DAYS_SHORT[wi],
    clock: clockLabel(minutes),
    isOverride: false,
    hasTime: true,
  };
}

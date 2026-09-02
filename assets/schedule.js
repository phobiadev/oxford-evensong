// Pure day-selection for the Tonight view. No I/O, no DOM.

import { addDays } from './oxweeks.js';

/**
 * If the requested day is "today" and its services have all begun (or there are
 * none and it is past 21:00), advance to the next day that has services.
 *
 * @param {Map<string, object[]>} servicesByDate  ISO date -> services
 * @param {{ date:string, minutes:number }} now
 * @param {string|null} requestedDate  an explicit ?date=, or null for "today"
 * @returns {{ date:string, advanced:boolean }}
 */
export function chooseDay(servicesByDate, now, requestedDate) {
  const date = requestedDate || now.date;
  if (date !== now.date) return { date, advanced: false };

  const today = (servicesByDate.get(date) || []).filter((s) => s.time);
  const lastStart = today.length
    ? Math.max(...today.map((s) => {
      const [h, m] = s.time.split(':').map(Number);
      return h * 60 + m;
    }))
    : null;

  const over = lastStart != null
    ? now.minutes >= lastStart
    : now.minutes >= 21 * 60;
  if (!over) return { date, advanced: false };

  for (let i = 1; i <= 400; i++) {
    const d = addDays(date, i);
    if ((servicesByDate.get(d) || []).length) return { date: d, advanced: true };
  }
  return { date, advanced: false };
}

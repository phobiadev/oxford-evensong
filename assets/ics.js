// "Add to calendar" — one service as an iCalendar (RFC 5545) file.
//
// `icsForService` is pure (no DOM, no clock unless you let it default) and is
// unit-tested in scripts/site.test.mjs. `downloadICS` wraps it in a Blob and
// clicks a link. No dependencies.
//
// Times are Oxford local, and the chapels publish a start only — never an end.
// So the file carries a TZID=Europe/London start (with the VTIMEZONE block
// below, so a calendar in any zone resolves it correctly) and an assumed
// duration, which the description states plainly rather than passing off as
// something a chapel said.

import { slotLabel, musicValueText, isSaid } from './entry.js';

/* Europe/London, post-1996 EU rules: BST from the last Sunday in March, GMT
   from the last Sunday in October. The same block Apple and Google emit. */
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/London',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:BST',
  'DTSTART:19810329T010000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:GMT',
  'DTSTART:19961027T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** Assumed length in minutes. Compline is short; everything else gets an hour. */
export function assumedMinutes(s) {
  const kind = `${s.type || ''} ${s.title || ''}`.toLowerCase();
  return kind.includes('compline') ? 30 : 60;
}

/** "2026-05-12" + "18:00" -> "20260512T180000" (local, paired with TZID). */
function stamp(dateISO, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${dateISO.replace(/-/g, '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
}

/** Add minutes to a local "YYYYMMDDTHHMMSS", rolling the date over midnight. */
function plusMinutes(local, minutes) {
  const y = Number(local.slice(0, 4));
  const mo = Number(local.slice(4, 6));
  const d = Number(local.slice(6, 8));
  const h = Number(local.slice(9, 11));
  const mi = Number(local.slice(11, 13));
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi + minutes));
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}`
    + `T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00`;
}

/** Date -> "20260512T164000Z". */
function utcStamp(d) {
  return `${d.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
}

/** Escape a TEXT value: backslash, semicolon, comma, newline (RFC 5545 §3.3.11). */
export function escText(v) {
  return String(v ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to 75 octets, continuations indented by one space. */
export function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return [line];
  const out = [];
  let cur = '';
  let limit = 75;
  for (const ch of line) {          // iterate code points, never split one
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ' ';
      limit = 75;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** The human-readable body of the event: the music, then where it came from. */
function description(s, minutes, url) {
  const lines = [];
  if (isSaid(s)) lines.push('Spoken; no music sung.');
  else if (s.musicStatus === 'not-yet-published') lines.push('Music not published yet.');
  else {
    for (const m of s.music ?? []) lines.push(`${slotLabel(m)}: ${musicValueText(m)}`);
  }
  if (s.choir) lines.push('', `Sung by ${s.choir}.`);
  if (s.preacher) lines.push('', `Preacher: ${s.preacher}`);
  if (s.notes) lines.push('', s.notes);
  lines.push(
    '',
    `The chapel publishes a start time only; ${minutes} minutes is this site’s `
      + 'assumption, not the chapel’s.',
  );
  if (s.source?.url) lines.push('', `Music list: ${s.source.url}`);
  if (url) lines.push(url);
  return lines.join('\n');
}

/**
 * One service as an .ics document, or null when the service has no start time
 * (nothing to schedule).
 *
 * @param s          an annotated service (has `_venue`)
 * @param {object}   opts  { url:string|null, now:Date }
 * @returns {string|null}
 */
export function icsForService(s, { url = null, now = new Date() } = {}) {
  if (!s?.time) return null;
  const venue = s._venue?.name ?? s.venueId;
  const kind = s.title || String(s.type || 'service').replace(/-/g, ' ');
  const minutes = assumedMinutes(s);
  const start = stamp(s.date, s.time);
  const location = [s._venue?.chapel, s._venue?.address].filter(Boolean).join(', ');

  const props = [
    'BEGIN:VEVENT',
    `UID:${s.id}@oxfordevensong.com`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=Europe/London:${start}`,
    `DTEND;TZID=Europe/London:${plusMinutes(start, minutes)}`,
    `SUMMARY:${escText(`${kind} — ${venue}`)}`,
    location ? `LOCATION:${escText(location)}` : null,
    `DESCRIPTION:${escText(description(s, minutes, url))}`,
    url ? `URL:${escText(url)}` : null,
    'END:VEVENT',
  ].filter(Boolean);

  const doc = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Oxford Evensong//oxfordevensong.com//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...VTIMEZONE,
    ...props,
    'END:VCALENDAR',
  ];

  // CRLF line endings are mandatory; a trailing one closes the last line.
  return doc.flatMap(fold).join('\r\n') + '\r\n';
}

/** Build the file and hand it to the browser. Returns false if unschedulable. */
export function downloadICS(service, url) {
  const text = icsForService(service, { url });
  if (!text) return false;
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${service.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return true;
}

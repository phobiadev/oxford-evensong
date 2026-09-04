// Tiny DOM / string helpers. No dependencies.

/** Escape text for interpolation into innerHTML. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Tagged template that escapes ${...} unless wrapped in raw(). */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    out += (v && v.__raw ? v.value : Array.isArray(v) ? v.join('') : esc(v)) + strings[i + 1];
  }
  return out;
}

/** Mark a string as already-safe HTML for use inside html``. */
export function raw(value) {
  return { __raw: true, value: Array.isArray(value) ? value.join('') : String(value ?? '') };
}

/** Accent- and case-insensitive fold for search. */
export function fold(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

function wd(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "2026-05-12" -> "Tuesday 12 May". */
export function longDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${DAYS_LONG[wd(iso)]} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

/** "2026-05-12" -> "Tue 10 May" (short day-group heading). */
export function shortDayDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  const dShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${dShort[wd(iso)]} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

/** "2026-05-12" -> "12 May 2026". */
export function mediumDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** "2026-05-12" -> "12 May 2026" with full month, for prose. */
export function proseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-05-12" -> "Tuesday 12 May 2026" — weekday + full date, for the share card. */
export function fullDate(iso) {
  return `${DAYS_LONG[wd(iso)]} ${proseDate(iso)}`;
}

/** Span "2026-05-10".."2026-05-16" -> "Sun 10 – Sat 16 May 2026". */
export function dateSpan(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const left = `${dShort[wd(a)]} ${ad}${am !== bm ? ` ${MONTHS[am - 1].slice(0, 3)}` : ''}`;
  const right = `${dShort[wd(b)]} ${bd} ${MONTHS[bm - 1].slice(0, 3)} ${by}`;
  return `${left} – ${right}${ay !== by ? '' : ''}`;
}

/** ISO timestamp -> "2 Sept 2026". */
export function fetchedDate(isoTs) {
  if (!isoTs) return '';
  const d = new Date(isoTs);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${mon[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Replace the app root's contents with an HTML string, then run `after`. */
export function mount(htmlStr) {
  const root = document.getElementById('app');
  root.innerHTML = htmlStr;
  return root;
}

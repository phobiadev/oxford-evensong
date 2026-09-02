// View rendering. Each view returns an HTML string for #app. The shell
// (masthead / nav / footer) wraps every view.

import { esc, longDate, shortDayDate, proseDate, dateSpan, fold } from './dom.js';
import { href } from './router.js';
import {
  weekDayForDate, dateForWeekDay, termForDate, ordinalWeek, addDays, DAYS,
} from './oxweeks.js';
import { timeLabel } from './london.js';
import { entryHTML, summaryParts, chipMusicHTML } from './entry.js';
import { servicesForVenue, venueStatusFor, allServices } from './data.js';
import { chooseDay } from './schedule.js';

export { chooseDay };

const CONTACT = 'joseph.preston@pmb.ox.ac.uk';

const CHOIR_TYPE = {
  'boys-and-men': 'boys & men',
  'student-mixed': 'mixed student choir',
  'mixed-adult': 'mixed adult choir',
};
const VENUE_STATUS_PROSE = {
  'not-yet-published': 'Music list not yet published',
  'not-found': 'No music list found this term',
  'fetch-failed': 'Music list could not be retrieved',
  'not-parsed': 'Music list not yet transcribed',
  'no-list': 'This chapel does not publish a term music list',
};

/* ---------- term helpers ---------- */

function termShort(term) {
  return term.name.split(' ')[0];
}
function termLong(term) {
  const [nm, yr] = term.name.split(' ');
  return `${nm} Term ${yr}`;
}

/**
 * The term to show for a date: the one whose weeks -2..10 cover it; else the
 * next term to start after the date; else the current term (if held); else the
 * newest held term.
 */
export function resolveTerm(data, dateISO) {
  const covering = dateISO && termForDate(data.termObjects, dateISO);
  if (covering) return covering;
  if (dateISO) {
    const upcoming = data.termObjects
      .filter((t) => t.weekOneSunday > dateISO)
      .sort((a, b) => a.weekOneSunday.localeCompare(b.weekOneSunday))[0];
    if (upcoming) return upcoming;
  }
  const cur = data.termObjects.find((t) => t.id === data.index.current);
  if (cur && data.terms.has(cur.id)) return cur;
  const held = data.termObjects.filter((t) => data.terms.has(t.id));
  return held[held.length - 1] || cur || data.termObjects[data.termObjects.length - 1] || null;
}

/* ---------- shell ---------- */

export function shell(inner, { now, view, weekSpan }) {
  const nav = [
    ['tonight', 'Tonight'],
    ['week', 'This week'],
    ['chapels', 'Chapels'],
    ['search', 'Find music'],
  ].map(([v, label]) => {
    const active = v === view || (view === 'chapel' && v === 'chapels');
    return `<a href="${esc(href({ view: v, date: null, venue: null, q: null, open: [] }))}" data-link${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');

  return `
  <div class="sheet${view === 'week' ? ' wide' : ''}">
    <header class="masthead">
      <a class="mark" href="${esc(href({ view: 'tonight', date: null, venue: null, q: null, open: [] }))}" data-link>Oxford Evensong</a>
      <span class="right">
        <span class="clock">${esc(now.weekdayLong)} · <b>${esc(now.clock)}</b></span>
        <button class="toggle" type="button" aria-label="Switch theme">☾</button>
      </span>
    </header>
    <nav aria-label="Views">${nav}</nav>
    <main id="main">${inner}</main>
    <footer>
      Sung services in Oxford’s college chapels and the cathedral, from each chapel’s own music list.
      <span class="mono">Music verbatim · times Oxford local${weekSpan ? ` · ${esc(weekSpan)}` : ''} · <a href="${esc(href({ view: 'about', date: null, venue: null, q: null, open: [] }))}" data-link>about &amp; sources</a></span>
    </footer>
  </div>`;
}

/* ---------- empty / error states ---------- */

function emptyBoard(head, htmlBody) {
  return `<div class="board">${head}<div class="empty">${htmlBody}</div></div>`;
}

export function errorView(now) {
  return shell(
    emptyBoard('', '<p>Couldn’t load the services just now.</p>'
      + `<p><a href="${esc(location.pathname + location.search)}">Try again</a></p>`),
    { now, view: 'tonight' },
  );
}

/* ---------- occasion of the day ---------- */

function dayFeast(services) {
  const occ = services.map((s) => s.occasion).filter(Boolean);
  if (!occ.length) return null;
  const counts = new Map();
  for (const o of occ) counts.set(o, (counts.get(o) || 0) + 1);
  let best = null;
  let bestN = 0;
  for (const [o, n] of counts) if (n > bestN) { best = o; bestN = n; }
  if (/\bSunday\b|\bWeek\b/i.test(best)) return null;   // a seasonal Sunday, not a feast
  if (/,\s*\d{4}\s*$/.test(best)) return null;          // "Name, 1952" — a lesser commemoration
  return best;
}

/* ---------- date-head with day/week navigation ---------- */

function dayHead(dateISO, term, feast, { picker }) {
  const { week } = weekDayForDate(term, dateISO);
  const inRange = week >= -2 && week <= 10;
  const wk = inRange
    ? `${ordinalWeek(week)} · ${esc(termLong(term))}`
      + (feast ? ` · <span class="occ">${esc(feast)}</span>` : '')
    : 'Vacation';
  return `
    <div class="datehead">
      <div class="nav-day">
        <a href="${esc(href({ date: addDays(dateISO, -1), open: [] }))}" data-link aria-label="Previous day">‹</a>
        <h1 class="daytitle"><button class="pick" type="button" data-pick aria-expanded="${picker ? 'true' : 'false'}">${esc(longDate(dateISO))}</button></h1>
        <a href="${esc(href({ date: addDays(dateISO, 1), open: [] }))}" data-link aria-label="Next day">›</a>
      </div>
      <div class="wk">${wk}</div>
    </div>
    ${picker ? pickerHTML(dateISO, term, 'tonight') : ''}`;
}

function pickerHTML(currentISO, term, view) {
  const heldDates = view; // unused marker
  let rows = '';
  for (let w = 0; w <= 8; w++) {
    let cells = `<span class="wlabel">${ordinalWeek(w).replace(' Week', '')}</span>`;
    for (const d of DAYS) {
      const iso = dateForWeekDay(term, w, d);
      const on = iso === currentISO ? ' on' : '';
      cells += `<a href="${esc(href({ view: 'tonight', date: iso, open: [] }))}" data-link class="${on.trim()}">${iso.slice(8)}</a>`;
    }
    rows += cells;
  }
  return `
    <div class="picker">
      <div class="phead"><span>${esc(termLong(term))}</span><button type="button" data-pick>Close</button></div>
      <div class="pgrid">
        <span class="ph"></span>${DAYS.map((d) => `<span class="ph">${d}</span>`).join('')}
        ${rows}
      </div>
    </div>`;
}

/* ---------- Tonight ---------- */

export function tonight(data, p, now, ui) {
  const requested = p.date || now.date;
  const term = resolveTerm(data, requested);
  if (!term) return shell(emptyBoard('', '<p>No term data available.</p>'), { now, view: 'tonight' });

  const { date, advanced } = chooseDay(data.servicesByDate, now, p.date);
  const services = (data.servicesByDate.get(date) || []);
  const feast = dayFeast(services);
  const termDoc = data.terms.get(term.id);
  const weekSpanFor = weekSpanString(term, date);

  const head = dayHead(date, term, feast, { picker: ui.picker });

  if (!services.length) {
    return shell(
      `<div class="board">${head}${vacancyState(data, term, date)}</div>`,
      { now, view: 'tonight', weekSpan: weekSpanFor },
    );
  }

  const openSet = new Set(p.open);
  const feed = services.map((s) => entryHTML(s, { open: openSet.has(s.id) })).join('');
  const note = advanced
    ? '<div class="daynote">Tonight’s services have begun — showing the next day with music.</div>'
    : '';

  const awaiting = awaitingLine(data, termDoc, term);

  return shell(`
    <div class="board">
      ${head}
      ${note}
      <div class="colhead"><span>Time</span><span>Service &amp; music</span></div>
      <div class="feed">${feed}</div>
      ${awaiting}
    </div>`, { now, view: 'tonight', weekSpan: weekSpanFor });
}

function vacancyState(data, term, date) {
  // find the next held day with services
  let nextDate = null;
  for (let i = 1; i <= 400; i++) {
    const d = addDays(date, i);
    if ((data.servicesByDate.get(d) || []).length) { nextDate = d; break; }
  }
  const { week } = weekDayForDate(term, date);
  const inTerm = week >= 1 && week <= 8;
  const lines = [`<p>Nothing sung in Oxford on ${esc(longDate(date))}.</p>`];

  // the next term to start after this date, if any
  const upcoming = data.termObjects
    .filter((t) => t.weekOneSunday > date)
    .sort((a, b) => a.weekOneSunday.localeCompare(b.weekOneSunday))[0];

  if (!inTerm && upcoming) {
    lines.push(`<span class="mono">${esc(termLong(upcoming))} begins ${esc(proseDate(upcoming.weekOneSunday))}</span>`);
  } else if (!inTerm) {
    lines.push('<span class="mono">the college chapels are in vacation</span>');
  } else {
    lines.push('<span class="mono">no lists record a service today</span>');
  }

  if (nextDate) {
    lines.push(`<p><a href="${esc(href({ view: 'tonight', date: nextDate, open: [] }))}" data-link>Next: ${esc(longDate(nextDate))}</a></p>`);
  } else {
    // nothing ahead — offer the most recent term we actually hold
    let prevDate = null;
    for (let i = 1; i <= 800; i++) {
      const d = addDays(date, -i);
      if ((data.servicesByDate.get(d) || []).length) { prevDate = d; break; }
    }
    if (prevDate) {
      const heldTerm = termForDate(data.termObjects, prevDate);
      lines.push(`<p><a href="${esc(href({ view: 'week', date: prevDate, open: [] }))}" data-link>See ${esc(heldTerm ? termLong(heldTerm) : longDate(prevDate))}</a></p>`);
    }
  }
  return `<div class="empty">${lines.join('')}</div>`;
}

function awaitingLine(data, termDoc, term) {
  if (!termDoc) return '';
  const pending = [];
  for (const v of data.venueList) {
    const st = termDoc.venueStatus?.[v.id]?.status;
    if (st && st !== 'published' && st !== 'no-list') pending.push(v.shortName || v.name);
  }
  if (!pending.length) return '';
  const shown = pending.slice(0, 3).join(', ');
  const rest = pending.length - 3;
  const tail = rest > 0 ? `, and ${rest} other chapel${rest === 1 ? '' : 's'}` : '';
  return `<div class="awaiting">Also awaited for ${esc(termLong(term))}: ${esc(shown)}${esc(tail)}.</div>`;
}

function weekSpanString(term, dateISO) {
  const { week } = weekDayForDate(term, dateISO);
  if (week < 0 || week > 9) return null;
  const sun = dateForWeekDay(term, week, 'Sun');
  const sat = dateForWeekDay(term, week, 'Sat');
  return `${ordinalWeek(week)}: ${dateSpan(sun, sat)}`;
}

/* ---------- This week ---------- */

export function week(data, p, now) {
  const anchor = p.date || now.date;
  const term = resolveTerm(data, anchor);
  if (!term) return shell(emptyBoard('', '<p>No term data available.</p>'), { now, view: 'week' });

  const { week: wk } = weekDayForDate(term, anchor);
  const sun = dateForWeekDay(term, Math.min(Math.max(wk, -2), 10), 'Sun');
  const dates = DAYS.map((_, i) => addDays(sun, i));
  const sat = dates[6];

  const prevAnchor = addDays(sun, -7);
  const nextAnchor = addDays(sun, 7);

  const head = `
    <div class="datehead">
      <div class="nav-day">
        <a href="${esc(href({ view: 'week', date: prevAnchor, open: [] }))}" data-link aria-label="Previous week">‹</a>
        <h1>${esc(ordinalWeek(wk))} of ${esc(termShort(term))}</h1>
        <a href="${esc(href({ view: 'week', date: nextAnchor, open: [] }))}" data-link aria-label="Next week">›</a>
      </div>
      <div class="wk">${esc(dateSpan(sun, sat))}</div>
    </div>`;

  const anyServices = dates.some((d) => (data.servicesByDate.get(d) || []).length);
  if (!anyServices) {
    const msg = (wk < 1 || wk > 8)
      ? `${ordinalWeek(wk)} of ${termShort(term)} is outside Full Term — no sung services.`
      : `No sung services recorded for ${ordinalWeek(wk)} of ${termShort(term)}.`;
    return shell(`<div class="board">${head}<div class="empty"><p>${esc(msg)}</p></div></div>`,
      { now, view: 'week' });
  }

  const cols = dates.map((d, i) => {
    const svc = (data.servicesByDate.get(d) || []);
    const today = d === now.date ? ' today' : '';
    const feast = dayFeast(svc);
    const dayLabel = `${DAYS[i]} <span class="n">${Number(d.slice(8))}</span>`;
    const header = `<a class="colday" href="${esc(href({ view: 'tonight', date: d, open: [] }))}" data-link>`
      + `<span class="d">${dayLabel}</span>`
      + (feast ? `<span class="occ">${esc(feast)}</span>` : '')
      + '</a>';
    const chips = svc.length
      ? svc.map((s) => weekChip(s)).join('')
      : '<span class="none">—</span>';
    return `<div class="col${today}">${header}${chips}</div>`;
  }).join('');

  const termDoc = data.terms.get(term.id);
  const awaiting = awaitingLine(data, termDoc, term);

  return shell(`
    <div class="board">
      ${head}
      <div class="wgrid">${cols}</div>
      ${awaiting}
    </div>`, { now, view: 'week' });
}

function weekKind(s) {
  return (s.title || s.type.replace(/-/g, ' '))
    .split(/\s+[–-]\s+/)[0]              // drop " - CORPORATE COMMUNION" etc.
    .replace(/\s*\([^)]*\)\s*$/, '')     // drop trailing "(Choristers)" etc.
    .trim();
}

function weekChip(s) {
  const cls = ['chip'];
  if (s.confidence === 'low') cls.push('lowconf');
  if (s.type === 'said-evensong' || s.musicStatus === 'no-music') cls.push('said');
  const mus = (s.type === 'said-evensong' || s.musicStatus === 'no-music')
    ? 'Spoken; no music sung'
    : s.musicStatus === 'not-yet-published' ? 'Music not published yet' : chipMusicHTML(s);
  return `<a class="${cls.join(' ')}" href="${esc(href({ view: 'tonight', date: s.date, open: [s.id] }))}" data-link>`
    + `<span class="t">${esc(timeLabel(s.time))}</span>`
    + `<span class="c">${esc(s._venue?.shortName || s._venue?.name || s.venueId)}</span>`
    + `<span class="k">${esc(weekKind(s))}</span>`
    + `<span class="mus">${mus}</span>`
    + '</a>';
}

/* ---------- Chapels list ---------- */

export function chapels(data, p, now) {
  const term = resolveTerm(data, now.date);
  const termDoc = term ? data.terms.get(term.id) : null;

  const rows = [...data.venueList]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((v) => {
      const ct = CHOIR_TYPE[v.choir?.type];
      const choir = [v.choir?.name, ct].filter(Boolean).join(' — ');
      const st = termDoc?.venueStatus?.[v.id]?.status;
      const chip = (st && st !== 'published')
        ? `<span class="chip-status">${esc((VENUE_STATUS_PROSE[st] || st))}</span>` : '';
      return `<li><a href="${esc(href({ view: 'chapel', venue: v.id, date: null, open: [] }))}" data-link>`
        + `<span class="name">${esc(v.name)}</span>`
        + (choir ? `<div class="choir">${esc(choir)}</div>` : '')
        + (v.typicalPattern ? `<div class="pat">${esc(v.typicalPattern)}</div>` : '')
        + chip
        + '</a></li>';
    }).join('');

  return shell(`
    <div class="board">
      <div class="datehead"><h1>Chapels</h1><div class="wk">${data.venueList.length} chapels · ${term ? esc(termLong(term)) : ''}</div></div>
      <ul class="venues">${rows}</ul>
    </div>`, { now, view: 'chapels' });
}

/* ---------- Chapel page ---------- */

export function chapel(data, p, now, ui) {
  const v = data.venues.get(p.venue);
  if (!v) {
    return shell(emptyBoard(
      `<div class="datehead"><h1>Unknown chapel</h1></div>`,
      `<p>No chapel “${esc(p.venue || '')}”.</p><p><a href="${esc(href({ view: 'chapels', venue: null, open: [] }))}" data-link>All chapels</a></p>`,
    ), { now, view: 'chapel' });
  }

  // which term / week?
  const own = data.termObjects
    .filter((t) => servicesForVenue(data, t.id, v.id).length)
    .sort((a, b) => a.weekOneSunday.localeCompare(b.weekOneSunday));
  const term = resolveTerm(data, p.date || (own[own.length - 1]?.weekOneSunday) || now.date);
  const svcAll = term ? servicesForVenue(data, term.id, v.id) : [];
  const anchor = p.date || svcAll[0]?.date || now.date;
  const { week: wk } = term ? weekDayForDate(term, anchor) : { week: 0 };

  const ct = CHOIR_TYPE[v.choir?.type];
  const choirLine = [v.chapel, [v.choir?.name, ct && `(${ct})`].filter(Boolean).join(' ')]
    .filter(Boolean).join(' · ');

  const header = `
    <div class="chapelhead">
      <div class="toprow">
        <h1>${esc(v.name)}</h1>
        <a class="back" href="${esc(href({ view: 'chapels', venue: null, open: [] }))}" data-link>‹ back to chapels</a>
      </div>
      ${choirLine ? `<div class="sub">${esc(choirLine)}</div>` : ''}
      ${v.address ? `<div class="addr">${esc(v.address)}</div>` : ''}
      ${v.typicalPattern ? `<div class="pattern">${esc(v.typicalPattern)}</div>` : ''}
      ${v.access ? `<div class="access">${esc(v.access)}</div>` : ''}
      ${v.musicList?.url ? `<a class="listlink" href="${esc(v.musicList.url)}" target="_blank" rel="noopener">Music list ↗</a>` : ''}
    </div>`;

  const status = term ? venueStatusFor(data, term.id, v.id) : null;
  if (!term || !status || status.status !== 'published') {
    const label = status ? (VENUE_STATUS_PROSE[status.status] || status.status) : 'No music list held';
    return shell(`
      <div class="board">
        ${header}
        <div class="empty"><p>${esc(label)}${term ? ` for ${esc(termLong(term))}` : ''}.</p>
        <span class="mono">its typical pattern is above</span>
        ${status?.note ? `<p style="font-size:.88rem;max-width:32rem">${esc(status.note)}</p>` : ''}</div>
      </div>`, { now, view: 'chapel' });
  }

  // week nav + services grouped by day within the chosen week
  const sun = dateForWeekDay(term, Math.min(Math.max(wk, -2), 10), 'Sun');
  const weekDates = DAYS.map((_, i) => addDays(sun, i));
  const inWeek = svcAll.filter((s) => weekDates.includes(s.date));
  const openSet = new Set(p.open);

  const nav = `
    <div class="datehead">
      <div class="nav-day">
        <a href="${esc(href({ date: addDays(sun, -7), open: [] }))}" data-link aria-label="Previous week">‹</a>
        <h2 class="wknav-title">${esc(ordinalWeek(wk))} of ${esc(termShort(term))}</h2>
        <a href="${esc(href({ date: addDays(sun, 7), open: [] }))}" data-link aria-label="Next week">›</a>
      </div>
      <div class="wk">${esc(dateSpan(weekDates[0], weekDates[6]))}</div>
    </div>`;

  let body;
  if (!inWeek.length) {
    body = `<div class="empty"><p>Nothing sung at ${esc(v.name)} this week.</p>
      <p><a href="${esc(href({ date: svcAll[0]?.date || anchor, open: [] }))}" data-link>Go to ${esc(ordinalWeek(weekDayForDate(term, svcAll[0]?.date || anchor).week))}</a></p></div>`;
  } else {
    const byDay = new Map();
    for (const s of inWeek) {
      if (!byDay.has(s.date)) byDay.set(s.date, []);
      byDay.get(s.date).push(s);
    }
    body = [...byDay.entries()].map(([d, list]) => (
      `<div class="daygroup"><h3>${esc(shortDayDate(d))}</h3>`
      + list.map((s) => entryHTML(s, { open: openSet.has(s.id) })).join('')
      + '</div>'
    )).join('');
  }

  return shell(`<div class="board">${header}${nav}${body}</div>`, { now, view: 'chapel' });
}

/* ---------- Find music (search) ---------- */

export function search(data, p, now) {
  const q = (p.q || '').trim();
  const term = resolveTerm(data, now.date);
  const box = `
    <div class="search-box">
      <label for="q">Search this term’s music — composer or work</label>
      <input id="q" type="search" name="q" value="${esc(q)}" autocomplete="off"
        placeholder="Howells · Stanford in G · Coll Reg" />
    </div>`;

  let results = '';
  if (!q) {
    results = '<div class="empty"><p>Type a composer or a piece.</p>'
      + '<span class="mono">e.g. Bairstow · Dum transisset · Missa</span></div>';
  } else {
    const needle = fold(q);
    const hits = [];
    for (const s of allServices(data)) {
      for (const m of s.music || []) {
        const hay = fold([m.text, m.composer, m.title].filter(Boolean).join(' · '));
        if (hay.includes(needle)) { hits.push({ s, m }); break; }
      }
    }
    if (!hits.length) {
      results = `<div class="empty"><p>Nothing matches “${esc(q)}”.</p></div>`;
    } else {
      const byDate = new Map();
      for (const h of hits) {
        if (!byDate.has(h.s.date)) byDate.set(h.s.date, []);
        byDate.get(h.s.date).push(h);
      }
      const days = [...byDate.keys()].sort();
      results = `<div class="search-count">${hits.length} service${hits.length === 1 ? '' : 's'}</div>`
        + days.map((d) => (
          `<div class="result-day"><h2>${esc(longDate(d))}</h2>`
          + byDate.get(d).map(({ s, m }) => {
            const hitText = [m.composer, m.title].filter(Boolean).join(', ') || m.text;
            return `<a class="r" href="${esc(href({ view: 'tonight', date: s.date, open: [s.id] }))}" data-link>`
              + `<span class="t">${esc(timeLabel(s.time))}</span>`
              + `<span class="c">${esc(s._venue?.shortName || s.venueId)}</span>`
              + `<span class="hit">${highlight(hitText, q)} <span class="mid">— ${esc(s.title)}</span></span>`
              + '</a>';
          }).join('')
          + '</div>'
        )).join('');
    }
  }

  return shell(`
    <div class="board">
      <div class="datehead"><h1>Find music</h1><div class="wk">${term ? esc(termLong(term)) : ''}</div></div>
      ${box}
      <div class="results" role="status" aria-live="polite">${results}</div>
    </div>`, { now, view: 'search' });
}

function highlight(text, q) {
  const f = fold(text);
  const n = fold(q);
  const i = f.indexOf(n);
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}

/* ---------- About ---------- */

export function about(data, p, now) {
  const updated = data.generatedAt
    ? `Last updated ${proseDate(data.generatedAt.slice(0, 10))}` : '';
  const subject = encodeURIComponent('Oxford Evensong — correction');
  const venues = [...data.venueList]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((v) => {
      const link = v.chapelPage || v.website;
      return `<li>${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(v.name)}</a>` : esc(v.name)}`
        + (v.musicList?.url ? ` · <a href="${esc(v.musicList.url)}" target="_blank" rel="noopener">music list ↗</a>` : '')
        + '</li>';
    }).join('');

  return shell(`
    <div class="board">
      <div class="datehead"><h1>About</h1><div class="wk">${esc(updated)}</div></div>
      <div class="about">
        <p>Oxford Evensong lists the sung services in Oxford’s college chapels and
        the cathedral — what is on each day, when, and what music is sung.</p>
        <p>Every service here is taken from the chapel’s own published music list.
        Music is reproduced as the list gives it; where a slot is our reading of
        an unlabelled list it is marked, and each service links to its source.
        Where a list does not say something, nothing is shown — never a guess.</p>
        <p>Times are Europe/London local.</p>

        <h2>Report an error</h2>
        <p>Spotted something wrong? <a href="mailto:${CONTACT}?subject=${subject}">${CONTACT}</a>.</p>

        <h2>The chapels</h2>
        <ul>${venues}</ul>
      </div>
    </div>`, { now, view: 'about' });
}

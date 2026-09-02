// The service entry — the atom of the site. Identical on Tonight, the Week
// stacked list, and a Chapel page. Always renders its full music list into the
// DOM; a `.open` class (and CSS) decides whether the summary or the full list
// shows. That keeps expand/collapse a pure toggle, makes print work, and gives a
// real no-JS fallback.

import { esc, fetchedDate } from './dom.js';
import { href } from './router.js';
import { timeLabel } from './london.js';

const CANTICLE_SLOTS = ['canticles', 'magnificat', 'nunc-dimittis', 'setting'];
const ANTHEM_SLOTS = ['anthem', 'motet'];

/** composer, *title*  —  else *title*  —  else composer  —  else verbatim text. */
export function musicValueHTML(m) {
  if (m.composer && m.title) return `${esc(m.composer)}, <em>${esc(m.title)}</em>`;
  if (m.title) return `<em>${esc(m.title)}</em>`;
  if (m.composer) return esc(m.composer);
  return esc(m.text);
}

function slotLabel(m) {
  return m.slot === 'other' ? m.label : m.slot.replace(/-/g, ' ');
}

/** [canticles/setting, anthem/motet] as HTML fragments, for the collapsed summary. */
export function summaryParts(s) {
  const music = s.music ?? [];
  const pick = (slots) => music.find((m) => slots.includes(m.slot));
  const parts = [];
  const a = pick(CANTICLE_SLOTS);
  const b = pick(ANTHEM_SLOTS);
  if (a) parts.push(musicValueHTML(a));
  if (b) parts.push(musicValueHTML(b));
  if (!parts.length && music.length) parts.push(musicValueHTML(music[0]));
  return parts;
}

/** One-line music summary for a Week chip (";"-separated, plain). */
export function chipMusicHTML(s) {
  return summaryParts(s).join('; ');
}

function isSaid(s) {
  return s.type === 'said-evensong' || s.musicStatus === 'no-music';
}

function flagSentence(s) {
  if (s.confidence === 'low') {
    return 'The music below is our reading of a list that gives few or no slot '
      + 'labels; it needs checking against the source.';
  }
  if (s.confidence === 'medium') {
    return 'Some slots here are assigned by position, not labelled in the '
      + "chapel's own list.";
  }
  return null;
}

function timeCell(hhmm) {
  const label = timeLabel(hhmm);
  if (label === '—') return '<div class="time">—</div>';
  const [num, ap] = label.split(' ');
  return `<div class="time">${esc(num)}<span class="m">${esc(ap)}</span></div>`;
}

function musicBlock(s) {
  const rows = (s.music ?? []).map((m) => (
    `<div class="row"><dt>${esc(slotLabel(m))}</dt><dd>${musicValueHTML(m)}</dd></div>`
  )).join('');
  const flag = flagSentence(s);
  const src = s.source?.url
    ? `<div class="src"><a href="${esc(s.source.url)}" target="_blank" rel="noopener">`
      + `${esc(s._venue?.name ?? 'Chapel')} music list</a>`
      + (s.source.fetchedAt ? ` — fetched ${esc(fetchedDate(s.source.fetchedAt))}` : '')
      + (s.source.locator ? `, ${esc(s.source.locator)}` : '')
      + '</div>'
    : '';
  return '<div class="music"><dl>' + rows + '</dl>'
    + (flag ? `<div class="flag">${esc(flag)}</div>` : '')
    + src
    + '</div>';
}

/**
 * @param s      an annotated service (has _venue, _venueStatus, _termId)
 * @param opts   { open:boolean }
 */
export function entryHTML(s, opts = {}) {
  const venueName = s._venue?.name ?? s.venueId;
  const chapelLink = `<a href="${esc(href({ view: 'chapel', venue: s.venueId, date: s.date, open: [] }))}" data-link>${esc(venueName)}</a>`;
  const kind = esc(s.title || s.type.replace(/-/g, ' '));
  const occ = s.occasion ? `<span class="occ">${esc(s.occasion)}</span>` : '';
  const choir = s.choir ? `<div class="choir">${esc(s.choir)}</div>` : '';
  const preacher = s.preacher
    ? `<div class="preacher"><b>Preacher</b>${esc(s.preacher)}</div>` : '';
  const notes = s.notes ? `<div class="notes">${esc(s.notes)}</div>` : '';

  // said / no music
  if (isSaid(s)) {
    const src = s.source?.url
      ? `<div class="src"><a href="${esc(s.source.url)}" target="_blank" rel="noopener">source</a></div>` : '';
    return `<div class="entry said" id="s-${esc(s.id)}">`
      + timeCell(s.time)
      + `<div class="body"><span class="chapel">${chapelLink}</span>`
      + `<span class="kind">${kind}</span>${occ}`
      + '<div class="summary">Spoken; no music sung</div>'
      + notes + src + '</div></div>';
  }

  // service known, music not published yet
  if (s.musicStatus === 'not-yet-published') {
    return `<div class="entry" id="s-${esc(s.id)}">`
      + timeCell(s.time)
      + `<div class="body"><span class="chapel">${chapelLink}</span>`
      + `<span class="kind">${kind}</span>${occ}${choir}`
      + '<div class="summary" style="color:var(--mid)">Music not published yet.</div>'
      + notes + '</div></div>';
  }

  // full, collapsible entry
  const cls = ['entry', 'collapsible'];
  if (opts.open) cls.push('open');
  if (s.confidence === 'low') cls.push('lowconf');
  const q = s.confidence === 'low'
    ? '<span class="sr-only"> (interpreted from an unlabelled list)</span>' : '';
  const summary = summaryParts(s).join(' <span class="mid">·</span> ');

  return `<div class="${cls.join(' ')}" id="s-${esc(s.id)}">`
    + timeCell(s.time)
    + '<div class="body">'
    + `<span class="chapel">${chapelLink}${q}</span><span class="kind">${kind}</span>`
    + occ + choir
    + (summary ? `<div class="summary">${summary}</div>` : '')
    + preacher
    + notes
    + musicBlock(s)
    + `<button class="disclose" type="button" data-toggle="${esc(s.id)}" aria-expanded="${opts.open ? 'true' : 'false'}" aria-controls="s-${esc(s.id)}">`
    + (opts.open ? 'Close' : 'Full music list')
    + '</button>'
    + '</div></div>';
}

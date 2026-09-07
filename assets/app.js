// Oxford Evensong — client entry point. No build step; ES modules loaded
// directly by the browser. Fetches data/ at runtime and renders one of the
// views from the query string.

import { params, onChange, go, toggleOpen, href } from './router.js';
import { initTheme, bindToggle } from './theme.js';
import { nowParts } from './london.js';
import { loadData, allServices } from './data.js';
import { openShareDialog } from './share.js';
import { downloadICS } from './ics.js';
import {
  tonight, week, chapels, chapel, search, about, help, errorView, searchResultsHTML,
} from './views.js';

document.documentElement.classList.add('js');

// `pickerView` records which view the date/week picker was opened in — it closes
// as soon as the view changes (a nav click, or crossing between Day and Week).
const ui = { picker: false, pickerView: null };
let data = null;
let loadError = false;
// The "now" the current DOM was rendered against — see `refreshIfStale`.
let lastNow = null;

// What to focus after the next render. Navigation (nav click / back / forward)
// moves focus to the view heading so keyboard and screen-reader users don't
// restart at the top of the document with no cue. A disclosure toggle keeps
// focus on the control; a search keystroke leaves the search box alone. A link
// that jumps to an already-expanded entry (a Week chip or search row carrying
// ?open) lands on that entry instead of the heading.
// null → a plain navigation; set by the handlers that are NOT navigation.
let nextFocus = null;

const VIEWS = { tonight, week, chapels, chapel, search, about, help };

const TITLES = {
  tonight: 'Day', week: 'Week', chapels: 'Chapels',
  chapel: 'Chapels', search: 'Find music', about: 'About', help: 'How to use',
};

/**
 * Put a freshly-rendered shell on screen. Every view returns the whole shell
 * (masthead / nav / main / footer), but replacing all of it on each navigation
 * repaints chrome that barely changed and destroys the very link you clicked.
 * So patch the shell in place and swap only <main>: the masthead, nav and
 * footer nodes survive, and the page doesn't flicker between views.
 */
function paint(html) {
  const root = document.getElementById('app');
  const cur = root.querySelector('.sheet');
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const next = tpl.content.querySelector('.sheet');
  const curMain = cur && cur.querySelector('#main');
  const nextMain = next && next.querySelector('#main');
  // First paint (the noscript sheet), or anything unexpected: just write it.
  if (!cur || !next || !curMain || !nextMain) {
    root.innerHTML = html;
    return;
  }

  // The Week view widens the sheet.
  if (cur.className !== next.className) cur.className = next.className;

  // Nav: the labels never change, only the hrefs (they carry the current date /
  // filters) and which link is current. Patch attributes so the anchors — and
  // the focus and hover on the one just clicked — stay put.
  const curNav = cur.querySelectorAll('nav a');
  const nextNav = next.querySelectorAll('nav a');
  if (curNav.length === nextNav.length) {
    curNav.forEach((a, i) => {
      a.setAttribute('href', nextNav[i].getAttribute('href'));
      if (nextNav[i].hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  } else {
    cur.querySelector('nav').replaceWith(next.querySelector('nav'));
  }

  // Masthead: only the clock text and the logo's href move. Leave the theme
  // button alone so it keeps its handler (bindToggle is idempotent regardless).
  const clock = cur.querySelector('.clock');
  const nextClock = next.querySelector('.clock');
  if (clock && nextClock && clock.innerHTML !== nextClock.innerHTML) {
    clock.innerHTML = nextClock.innerHTML;
  }
  const mark = cur.querySelector('.mark');
  const nextMark = next.querySelector('.mark');
  if (mark && nextMark) mark.setAttribute('href', nextMark.getAttribute('href'));

  // Footer: carries the week span and view-dependent hrefs; cheap to rewrite.
  const foot = cur.querySelector('footer');
  const nextFoot = next.querySelector('footer');
  if (foot && nextFoot && foot.innerHTML !== nextFoot.innerHTML) {
    foot.innerHTML = nextFoot.innerHTML;
  }

  curMain.replaceWith(nextMain);
}

function render(p, focus) {
  const now = nowParts(p.now || null);
  lastNow = now;

  const label = TITLES[p.view] || 'Day';
  document.title = `${label} · Oxford Evensong`;

  if (loadError || !data) {
    paint(errorView(now));
    afterRender(p, focus);
    return;
  }

  const fn = VIEWS[p.view] || tonight;
  paint(fn(data, p, now, ui));
  afterRender(p, focus);
}

function applyFocus(focus) {
  if (!focus) return;
  let el = null;
  if (focus === 'main') {
    el = document.querySelector('#main h1') || document.getElementById('main');
  } else if (focus === 'pick') {
    el = document.querySelector('[data-pick]');
  } else if (focus.type === 'disclose') {
    el = document.querySelector(`[data-toggle="${CSS.escape(focus.id)}"]`);
  } else if (focus.type === 'filter') {
    el = document.getElementById(`f-${focus.id}`);
  } else if (focus.type === 'entry') {
    // A link (or a shared URL opened cold) wants this expanded entry in view:
    // bring it to the top and land focus on the entry itself, so keyboard / SR
    // users arrive on its chapel + service heading. Honour prefers-reduced-motion.
    const entry = document.getElementById(`s-${focus.id}`);
    if (entry) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      entry.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
      el = entry;
    }
  }
  if (!el) return;
  const nativelyFocusable = el.matches('a[href], button, input, select, textarea');
  if (!nativelyFocusable && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  // 'main' and 'entry' have already placed the scroll; don't let focus() re-jump.
  el.focus({ preventScroll: focus === 'main' || focus.type === 'entry' });
}

function afterRender(p, focus) {
  bindToggle(document.querySelector('.toggle'));

  // date / picker toggle
  for (const b of document.querySelectorAll('[data-pick]')) {
    b.addEventListener('click', () => {
      ui.picker = !ui.picker;
      ui.pickerView = ui.picker ? params().view : null;
      render(params(), 'pick');
    });
  }

  // share one service — opens a dialog with a preview card, a copy-able link and
  // (where the browser allows) copy-image / download / native share sheet. The
  // link is the canonical Day-view URL for that service.
  for (const b of document.querySelectorAll('[data-share]')) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = location.origin + location.pathname + href({
        view: 'tonight', date: b.dataset.shareDate, open: [b.dataset.share],
        venue: null, q: null, type: null, sort: null, past: null, now: null,
      });
      const svc = data && allServices(data).find((s) => s.id === b.dataset.share);
      if (svc) openShareDialog(svc, url);
      else navigator.clipboard?.writeText(url).catch(() => {});
    });
  }

  // add one service to a calendar — an .ics the browser hands to the OS
  for (const b of document.querySelectorAll('[data-cal]')) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const svc = data && allServices(data).find((s) => s.id === b.dataset.cal);
      if (!svc) return;
      const url = location.origin + location.pathname + href({
        view: 'tonight', date: b.dataset.calDate, open: [b.dataset.cal],
        venue: null, q: null, type: null, sort: null, past: null, now: null,
      });
      downloadICS(svc, url);
    });
  }

  // disclosure buttons
  for (const b of document.querySelectorAll('[data-toggle]')) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      nextFocus = { type: 'disclose', id: b.dataset.toggle };
      toggleOpen(b.dataset.toggle);
    });
  }

  // click a collapsed entry body to expand
  for (const el of document.querySelectorAll('.entry.collapsible:not(.open) > .body')) {
    el.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const id = el.parentElement.id.replace(/^s-/, '');
      if (!id) return;
      nextFocus = { type: 'disclose', id };
      toggleOpen(id);
    });
  }

  // search box — repaint only .results on each keystroke. A full re-render swaps
  // out this <input> node and drops in-flight keystrokes, usually a space (#7).
  const q = document.getElementById('q');
  if (q) {
    // Escape clears the box (and the ?q= in the URL) without leaving the view —
    // the keyboard counterpart to the native ✕ that only some browsers draw.
    q.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !q.value) return;
      e.preventDefault();
      e.stopPropagation();
      q.value = '';
      clearTimeout(q._t);
      go({ q: null, open: [] }, { replace: true, silent: true });
      const box = document.querySelector('.results');
      if (box && data) box.innerHTML = searchResultsHTML(data, params(), nowParts(p.now || null));
    });
    q.addEventListener('input', () => {
      clearTimeout(q._t);
      q._t = setTimeout(() => {
        const v = q.value;
        // Push the query to the URL for shareability, but silently — no re-render.
        go({ q: v.trim() || null, open: [] }, { replace: true, silent: true });
        const box = document.querySelector('.results');
        if (box && data) box.innerHTML = searchResultsHTML(data, params(), nowParts(p.now || null));
      }, 140);
    });
  }

  // search filters (chapel / service / sort / upcoming-only)
  for (const el of document.querySelectorAll('[data-filter]')) {
    el.addEventListener('change', () => {
      const key = el.dataset.filter;
      // "Upcoming only" checked is the default → no param; unchecked → past=1.
      const val = el.type === 'checkbox' ? (el.checked ? null : '1') : (el.value || null);
      nextFocus = { type: 'filter', id: key };
      go({ [key]: val, open: [] }, { replace: true });
    });
  }

  applyFocus(focus);
}

onChange((p, { fromLink = false } = {}) => {
  // The picker stays open only while you keep working its own view with a
  // specific date (grid/list cells, the day/week arrows, its term paging).
  // Anything else — a nav click, the logo, a Today / This week jump, crossing
  // between Day and Week — closes it.
  if (ui.picker && !(p.view === ui.pickerView && p.date)) {
    ui.picker = false;
    ui.pickerView = null;
  }
  let focus = nextFocus ?? 'main';
  nextFocus = null;
  // A link click that carries ?open (Week chip, search row) jumps to an
  // expanded entry — land on it, not on the view heading. The in-page
  // disclosure toggle sets nextFocus itself, so it never reaches here.
  if (focus === 'main' && fromLink && p.open.length) {
    focus = { type: 'entry', id: p.open[0] };
  }
  render(p, focus);
});

// A tab left open goes stale: the masthead clock freezes, and after the last
// service — or after midnight — the Day view is showing yesterday. Re-render
// when the page is looked at again and Europe/London has moved on. A ?now=
// override is a fixed moment by definition, so it is left alone.
function refreshIfStale() {
  const p = params();
  if (p.now || document.visibilityState !== 'visible' || !lastNow) return;
  const fresh = nowParts(null);
  if (fresh.date === lastNow.date && fresh.clock === lastNow.clock) return;
  render(p, null);
}

document.addEventListener('visibilitychange', refreshIfStale);
window.addEventListener('focus', refreshIfStale);

(async function start() {
  const p = params();
  initTheme(p.theme || null);
  try {
    data = await loadData();
  } catch (err) {
    console.error(err);
    loadError = true;
  }
  // A shared link that carries ?open should land on the first expanded entry,
  // exactly as an in-app jump does — not at the top with the service below the fold.
  render(p, p.open.length ? { type: 'entry', id: p.open[0] } : null);
})();

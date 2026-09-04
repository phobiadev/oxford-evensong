// Oxford Evensong — client entry point. No build step; ES modules loaded
// directly by the browser. Fetches data/ at runtime and renders one of the
// views from the query string.

import { params, onChange, go, toggleOpen, href } from './router.js';
import { initTheme, bindToggle } from './theme.js';
import { nowParts } from './london.js';
import { loadData } from './data.js';
import {
  tonight, week, chapels, chapel, search, about, help, errorView, searchResultsHTML,
} from './views.js';

document.documentElement.classList.add('js');

// `pickerView` records which view the date/week picker was opened in — it closes
// as soon as the view changes (a nav click, or crossing between Day and Week).
const ui = { picker: false, pickerView: null };
let data = null;
let loadError = false;

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

function render(p, focus) {
  const now = nowParts(p.now || null);
  const root = document.getElementById('app');

  const label = TITLES[p.view] || 'Day';
  document.title = `${label} · Oxford Evensong`;

  if (loadError || !data) {
    root.innerHTML = errorView(now);
    afterRender(p, focus);
    return;
  }

  const fn = VIEWS[p.view] || tonight;
  root.innerHTML = fn(data, p, now, ui);
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

  // share one service — the native share sheet on a touch device, copy-link
  // everywhere else. The link is the canonical Day-view URL for that service.
  for (const b of document.querySelectorAll('[data-share]')) {
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const url = location.origin + location.pathname + href({
        view: 'tonight', date: b.dataset.shareDate, open: [b.dataset.share],
        venue: null, q: null, type: null, sort: null, past: null, now: null,
      });
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ url }); } catch { /* dismissed */ }
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        b.textContent = 'Link copied';
        b.classList.add('done');
        clearTimeout(b._t);
        b._t = setTimeout(() => { b.textContent = 'Share'; b.classList.remove('done'); }, 1800);
      } catch { /* clipboard blocked — nothing sensible to do */ }
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

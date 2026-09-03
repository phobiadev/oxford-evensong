// Oxford Evensong — client entry point. No build step; ES modules loaded
// directly by the browser. Fetches data/ at runtime and renders one of five
// views from the query string.

import { params, onChange, go, toggleOpen } from './router.js';
import { initTheme, bindToggle } from './theme.js';
import { nowParts } from './london.js';
import { loadData } from './data.js';
import { tonight, week, chapels, chapel, search, about, errorView } from './views.js';

document.documentElement.classList.add('js');

const ui = { picker: false };
let data = null;
let loadError = false;

// What to focus after the next render. Navigation (nav click / back / forward)
// moves focus to the view heading so keyboard and screen-reader users don't
// restart at the top of the document with no cue. A disclosure toggle keeps
// focus on the control; a search keystroke leaves the search box alone.
// null → a plain navigation; set by the handlers that are NOT navigation.
let nextFocus = null;

const VIEWS = { tonight, week, chapels, chapel, search, about };

const TITLES = {
  tonight: 'Day', week: 'Week', chapels: 'Chapels',
  chapel: 'Chapels', search: 'Find music', about: 'About',
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
  }
  if (!el) return;
  const nativelyFocusable = el.matches('a[href], button, input, select, textarea');
  if (!nativelyFocusable && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: focus === 'main' });
}

function afterRender(p, focus) {
  bindToggle(document.querySelector('.toggle'));

  // date / picker toggle
  for (const b of document.querySelectorAll('[data-pick]')) {
    b.addEventListener('click', () => { ui.picker = !ui.picker; render(params(), 'pick'); });
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

  // search box
  const q = document.getElementById('q');
  if (q) {
    q.addEventListener('input', () => {
      clearTimeout(q._t);
      const v = q.value;
      q._t = setTimeout(() => {
        nextFocus = 'search';
        go({ q: v || null, open: [] }, { replace: true });
        const nq = document.getElementById('q');
        if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
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

onChange((p) => {
  // the picker serves the Day and Week views; drop it on nav elsewhere
  if (p.view !== 'tonight' && p.view !== 'week') ui.picker = false;
  const focus = nextFocus ?? 'main';
  nextFocus = null;
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
  render(p);
})();

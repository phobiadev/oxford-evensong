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

const VIEWS = { tonight, week, chapels, chapel, search, about };

function render(p) {
  const now = nowParts(p.now || null);
  const root = document.getElementById('app');

  if (loadError || !data) {
    root.innerHTML = errorView(now);
    afterRender(p);
    return;
  }

  const fn = VIEWS[p.view] || tonight;
  root.innerHTML = fn(data, p, now, ui);
  afterRender(p);
}

function afterRender(p) {
  bindToggle(document.querySelector('.toggle'));

  // date / picker toggle
  for (const b of document.querySelectorAll('[data-pick]')) {
    b.addEventListener('click', () => { ui.picker = !ui.picker; render(params()); });
  }

  // disclosure buttons
  for (const b of document.querySelectorAll('[data-toggle]')) {
    b.addEventListener('click', (e) => { e.stopPropagation(); toggleOpen(b.dataset.toggle); });
  }

  // click a collapsed entry body to expand
  for (const el of document.querySelectorAll('.entry.collapsible:not(.open) > .body')) {
    el.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const id = el.parentElement.id.replace(/^s-/, '');
      if (id) toggleOpen(id);
    });
  }

  // search box
  const q = document.getElementById('q');
  if (q) {
    q.addEventListener('input', () => {
      clearTimeout(q._t);
      const v = q.value;
      q._t = setTimeout(() => {
        go({ q: v || null, open: [] }, { replace: true });
        const nq = document.getElementById('q');
        if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
      }, 140);
    });
  }
}

// picker is a Tonight-only affordance; drop it on any navigation
onChange((p) => {
  if (p.view !== 'tonight') ui.picker = false;
  render(p);
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

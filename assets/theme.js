// Theme: system by default; the masthead button toggles and remembers the
// choice in localStorage. The button shows the theme you'd switch TO — moon in
// day, sun in evening. A ?theme=light|dark query param is a one-off override
// (for shared links and screenshots) and is not persisted.

const MOON = '☾'; // ☾  shown in day     → click for evening
const SUN = '☼';  // ☼  shown in evening  → click for day
const root = document.documentElement;
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function stored() {
  const t = localStorage.getItem('theme');
  return t === 'light' || t === 'dark' ? t : null;
}

/** Apply the stored / query-param preference to <html>. Call once at startup. */
export function initTheme(queryTheme) {
  if (queryTheme === 'light' || queryTheme === 'dark') {
    root.setAttribute('data-theme', queryTheme);
  } else {
    const s = stored();
    if (s) root.setAttribute('data-theme', s);
    else root.removeAttribute('data-theme');
  }
  mq.addEventListener('change', () => paintToggle());
}

function effective() {
  const t = root.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return mq.matches ? 'dark' : 'light';
}

/** Update a freshly-rendered toggle button's glyph + label. */
export function paintToggle(btn) {
  const b = btn || document.querySelector('.toggle');
  if (!b) return;
  const dark = effective() === 'dark';
  b.textContent = dark ? SUN : MOON;
  b.setAttribute('aria-label', dark ? 'Switch to day theme' : 'Switch to evening theme');
}

/** Wire a rendered toggle button. */
export function bindToggle(btn) {
  if (!btn) return;
  paintToggle(btn);
  btn.addEventListener('click', () => {
    const next = effective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    paintToggle(btn);
  });
}

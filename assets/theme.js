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
  paintThemeColor();
  mq.addEventListener('change', () => paintToggle());
}

/** The theme actually in force right now: an explicit choice, else the OS. */
export function effectiveTheme() {
  const t = root.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return mq.matches ? 'dark' : 'light';
}

/**
 * Keep the browser / phone chrome in step with a manually chosen theme. The
 * two authored <meta name="theme-color"> tags are scoped to prefers-color-scheme,
 * so they answer the OS, not the toggle: switching to evening on a light phone
 * otherwise leaves a pale address bar above a dark page. While the choice is
 * "system" the authored tags are already right, so leave them alone.
 */
function paintThemeColor() {
  const t = root.getAttribute('data-theme');
  if (t !== 'light' && t !== 'dark') return;
  const paper = getComputedStyle(root).getPropertyValue('--paper').trim();
  if (!paper) return;
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
    m.setAttribute('content', paper);
  }
}

/** Update a freshly-rendered toggle button's glyph + label. */
export function paintToggle(btn) {
  const b = btn || document.querySelector('.toggle');
  if (!b) return;
  const dark = effectiveTheme() === 'dark';
  b.textContent = dark ? SUN : MOON;
  b.setAttribute('aria-label', dark ? 'Switch to day theme' : 'Switch to evening theme');
}

/** Wire a rendered toggle button. Idempotent: the masthead survives a view
    change now, so this is called again on a button that is already wired. */
const wired = new WeakSet();
export function bindToggle(btn) {
  if (!btn) return;
  paintToggle(btn);
  if (wired.has(btn)) return;
  wired.add(btn);
  btn.addEventListener('click', () => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    paintToggle(btn);
    paintThemeColor();
  });
}

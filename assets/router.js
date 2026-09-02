// Query-parameter routing. Every view is shareable by URL:
//   ?view=tonight&date=2026-05-12&open=<serviceId>
//   ?view=week&date=2026-10-27
//   ?view=chapel&venue=magdalen
//   ?view=search&q=howells
//   ?view=about
// plus ?now=<ISO> to override "now" and ?theme=light|dark to force a palette.
// The path never changes, so this works as static files under a Pages sub-path.

const KEYS = ['view', 'date', 'venue', 'q', 'now', 'theme', 'open'];
let listener = () => {};

/** Current params as a plain object; `open` is an array of service ids. */
export function params() {
  const sp = new URLSearchParams(location.search);
  const out = {};
  for (const k of KEYS) {
    const v = sp.get(k);
    if (v != null && v !== '') out[k] = v;
  }
  out.view = out.view || 'tonight';
  out.open = out.open ? out.open.split(',').filter(Boolean) : [];
  return out;
}

/** Build a href for a patched set of params (for real, right-clickable anchors). */
export function href(patch) {
  const cur = params();
  const next = { ...cur, ...patch };
  const sp = new URLSearchParams();
  for (const k of KEYS) {
    if (k === 'open') continue;
    if (next[k] != null && next[k] !== '') sp.set(k, next[k]);
  }
  const open = patch.open !== undefined ? patch.open : cur.open;
  if (open && open.length) sp.set('open', open.join(','));
  const qs = sp.toString();
  return qs ? `?${qs}` : location.pathname;
}

/** Navigate: merge `patch`, push history, re-render. */
export function go(patch, { replace = false } = {}) {
  const url = href(patch);
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  listener(params());
}

/** Toggle a service id in the `open` list and navigate (replaceState). */
export function toggleOpen(id) {
  const open = new Set(params().open);
  if (open.has(id)) open.delete(id);
  else open.add(id);
  go({ open: [...open] }, { replace: true });
}

export function onChange(fn) {
  listener = fn;
  window.addEventListener('popstate', () => listener(params()));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    history.pushState(null, '', a.getAttribute('href'));
    listener(params());
    window.scrollTo(0, 0);
  });
}

/* Oxford Evensong — small progressive-enhancement layer.
   Theme: system by default; the masthead button toggles and remembers. The button
   shows the theme you'd switch TO (moon in day, sun in evening). */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.toggle');
  var MOON = '☾';        /* ☾  shown in day mode  → click for evening */
  var SUN = '☼';         /* ☼  shown in evening   → click for day     */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  var saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  function effective() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mq.matches ? 'dark' : 'light';
  }

  function paint() {
    if (!btn) return;
    var dark = effective() === 'dark';
    btn.textContent = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'Switch to day theme' : 'Switch to evening theme');
  }

  paint();
  mq.addEventListener('change', paint);

  if (btn) btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    paint();
  });
})();

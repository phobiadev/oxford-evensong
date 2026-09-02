# Pre-launch review

Three passes over the built site (`index.html` + `assets/`) against `CLAUDE.md`
and `docs/design-brief.md`, rendered locally against the `2026-TT` fixture with
headless Chromium. Findings first; the fixes applied and the judgement calls left
for a human are at the end.

Legend: **[bug]** clear defect · **[brief]** violates the design brief ·
**[judgement]** needs a human decision · **[note]** context, no action.

---

## 1. Accessibility auditor

### Keyboard / focus

- **[bug] A malformed `?date=` crashes the whole app to a blank page.**
  `?date=not-a-date`, `?date=2026-02-30`, `?date=2026-13-01` all throw an
  uncaught `Not an ISO date` / `Not a real calendar date` out of `parseISO`
  (via `addDays` / `weekDayForDate`), leaving `#app` empty. `?now=2026-02-30`
  (format-valid, calendar-invalid) crashes the same way through `chooseDay`.
  A stale or hand-edited shared link takes the reader to a white screen — brief
  §10 ("never a blank board").
- **[bug] Focus is dropped on every expand/collapse.** `toggleOpen()` re-renders
  `#app` wholesale; the `FULL MUSIC LIST` / `CLOSE` button the user just
  activated is destroyed and focus falls back to `<body>`. A keyboard user
  loses their place on every toggle.
- **[bug] Focus is dropped on every in-app navigation.** `a[data-link]` clicks
  `pushState` + re-render + `scrollTo(0,0)` with no focus move. Screen-reader
  and keyboard users get no signal that the view changed and restart from the
  top of the document.
- **[note]** Collapsed entries expand on a click anywhere in `.body`, but `.body`
  is a plain `<div>` (not focusable / not a button). Keyboard users still have
  the real `<button class="disclose">`, so this is acceptable per brief §11 — the
  whole-row click is a mouse affordance only.
- **[note]** The day-picker opens without moving focus into it, isn't focus-
  trapped, and doesn't restore focus to the trigger on close. Minor; it is a
  small grid of real links and `Esc`-free by design.

### Screen-reader semantics

- **[brief][bug] The Tonight view has no `<h1>` at all.** Brief §14: "one `<h1>`
  per view (the date / week / chapel name)". The date is rendered as a bare
  `<button class="pick">`, so the primary screen has zero headings — and, because
  the button only inherits `font-size` from `.datehead` (19px), the date also
  renders at ~19px instead of the brief's 2.3rem / 1.75rem (`docs/design-brief.md`
  §4; the reference mock `design/tonight.html` has `<h1>Tuesday 12 May</h1>` at
  full size). Wrapping the button in `<h1 class="daytitle">` fixes both.
- **[brief][bug] The Chapel page has two `<h1>`s** — the chapel name and the
  week-nav label (`<h1 style="font-size:1.4rem">3rd Week of Trinity</h1>`).
  Heading order there is h1 → h1 → h2 (day groups).
- **[bug] No `<main>` landmark on any view.** Only `<nav>` and `<footer>` are
  exposed. `.masthead` is a bare `<div>`, not `<header>`. Screen-reader users
  have no "skip to main content" target and no main region.
- **[brief][bug] Search results are not announced.** No `aria-live` / `role=status`
  anywhere (`grep` confirms zero live regions). Brief §14 and the audit brief
  both call for a results live region; typing in the box silently swaps the
  whole document.
- **[bug] `document.title` never changes** between views. SPA orientation for
  screen-reader users and browser history both rely on it; every view is
  "Oxford Evensong".
- **[note]** `aria-current="page"` on the active nav item ✓. `lang="en"` ✓.
  `<meta name="color-scheme">` ✓. `.disclose` has correct `aria-expanded`
  true/false and a label that flips `Full music list` / `Close` ✓.
- **[note]** `aria-controls` on the disclosure points at the entry wrapper
  (`s-<id>`), which contains the button itself, rather than the `.music` region
  (which has no id). Harmless but not strictly correct.
- **[note]** The `confidence:"low"` `?` marker carries an `sr-only`
  "(interpreted from an unlabelled list)" ✓ (brief §8.1).

### Colour contrast (measured against the brief palette)

| Token / use | Light on `--board` | Evening on `--board` | AA normal text (4.5) |
|---|---|---|---|
| `--ink` body | 14.0 | 12.9 | pass |
| `--mid` (kind, footer prose, preacher, clock) | 4.79 | 5.53 | pass (thin) |
| `--faint` (slot labels, colhead, **footer colophon + "about & sources" link**, week day-numbers) | **3.21** | **4.03** | **fail** |
| `--accent` (bars, underlines, today marker — all non-text) | 2.48 | 7.12 | n/a decorative |
| `--accent-ink` (links, occasion, disclosure) | 5.11 | 9.19 | pass |
| `.pgrid a.on` white-on-`--accent` (picker selected day) | ~2.9 | ~4.0 | **fail** |

- **[judgement] `--faint` fails 4.5:1 in both palettes.** Brief §12/§14 knowingly
  permits ~3.3:1 "for all-caps scaffolding with the value at full contrast
  alongside", and offers darker fall-backs (`#7B7565` light / `#948C7B` evening).
  But `--faint` also paints the **footer colophon** and the **"about & sources"
  link** (sentence-case, 11px, not scaffolding) and the week-grid day numbers.
  Decision needed: adopt the darker `--faint`, or move the footer colophon to
  `--mid`.
- **[judgement] Picker selected-day cell** is white text on flat `--accent`
  (~2.9:1). Use `--accent-ink` text on `--accent-tint`, or darken.

### Zoom / reflow

- **[note]** 200% (and 390px) reflow cleanly: nav stays 4-up, board and feed
  wrap, no horizontal scrolling, nothing clipped. The ≤520px rules (kind on its
  own line, single-column music rows, 3.7rem time gutter) do their job.

### Reduced motion

- **[note] Correct.** The only animation (`ox-reveal`, opacity, 130ms) is gated
  behind `@media (prefers-reduced-motion: no-preference)`; reduced-motion users
  get an instant toggle. No load fades, no scroll effects (brief §12) ✓.

### Touch targets (390px)

- **[bug] Day-nav arrows `‹ ›` and the `FULL MUSIC LIST` disclosure are under
  24×24 CSS px.** The arrows are ~21px glyphs with `padding:0 .1rem`; the
  disclosure is a single ~10px line of text. WCAG 2.5.8 (AA, 2.2) wants 24px
  minimum. Nav cells (~34px tall) and the date `.pick` button are fine; the
  whole collapsed row is a large mouse target but keyboard/AT users rely on the
  small button.

---

## 2. Front-end engineer

### Date / timezone

- **[note]** `assets/oxweeks.js` ↔ `scripts/oxweeks.mjs` parity is asserted for
  weeks −2..10 over two terms (`site.test.mjs`). All week maths is UTC, so DST
  never shifts a date; the BST→GMT Sunday (25 Oct 2026) is covered.
- **[note]** `london.nowParts` reads real "now" via
  `Intl.DateTimeFormat('en-GB', timeZone:'Europe/London')` and defends against
  the `"24"` midnight hour (`% 24`). A `?now=` override is parsed as London
  wall-time.
- **[bug]** `nowParts` validates only the *shape* of an override date
  (`\d{4}-\d{2}-\d{2}`), not that it is a real calendar date — so
  `?now=2026-02-30` is accepted and then crashes downstream (see §1).
- **[judgement] 31 Dec across a term boundary.** `?now=2026-12-31` resolves to
  Hilary 2027 (its −2..+10 window reaches back to 27 Dec) and the date band
  reads **"−2ND WEEK · HILARY TERM 2027"**. Correct by the weeks-−2..10
  convention, but "−2nd Week" is opaque to a lay reader; `?now=2026-12-23` (in
  the gap between MT+14d and HT−21d) more sensibly shows "VACATION". Consider
  showing "Vacation" for any week < 0.
- **[judgement] A term with no next term file.** `?view=week&date=2027-05-01`
  (Trinity 2027 is in `index.json` but has no file) shows *"No sung services
  recorded for 1st Week of Trinity"* — the same wording as a real in-term blank.
  Brief §10 has a distinct "Term not yet published … + link to the most recent
  term we hold" state; Tonight's `vacancyState` does the right thing here, the
  Week view does not.
- **[note]** Midnight: `?now=…T00:00` → `minutes: 0` → clock "12.00 am" ✓.

### Failure modes

- **[note] A term file that 404s / fails to parse is swallowed**
  (`getJSON(...).catch(() => null)`), so one bad term file degrades gracefully to
  the others.
- **[judgement] `index.json` loads but the resolved term has no file.** With
  only `index.json` up (all term files down), Tonight falls through to
  `vacancyState` ("Nothing sung … Michaelmas Term begins …") rather than brief
  §10's "Couldn't load the services just now." The `errorView` only fires when
  `index.json` *or* `venues.json` itself fails. Arguably fine (the index did
  load), but a reader on a flaky connection sees "nothing on" instead of "try
  again".
- **[bug] Doc drift.** `docs/data-schema.md` (`termFiles` row) and
  `docs/decisions.md` ("termFiles" section) both still say the site fetches
  `{current} ∪ keys(terms) ∪ termFiles`. Since commit `dbad39b` the code fetches
  **only** `index.termFiles`. Docs should match the code.

### Caching / GitHub Pages

- **[note]** `data.js` fetches with `{ cache: 'no-cache' }` — the browser
  revalidates (conditional `If-None-Match`) on every load, so GitHub Pages'
  `Cache-Control: max-age=600` can't serve silently-stale JSON; a changed file
  is a 200, an unchanged one a cheap 304. This is a reasonable substitute for a
  cache-busting query; a `generated.at`-derived `?v=` param would only help the
  term files (not `index.json`, which is fetched first) and isn't worth the
  complexity. No action.
- **[judgement]** If you want belt-and-braces freshness, `index.json` could use
  `{ cache: 'no-store' }` (it's 452 bytes).

### Console / network

- **[note]** No console errors or unhandled rejections on any of the eight views
  or the edge routes (`?view=chapel` with no/unknown venue, `?open=<bogus>`,
  `?now=<garbage>` → falls back to real clock, `?q=é`).
- **[bug] `GET /favicon.ico` 404s** on every first load (no `<link rel="icon">`).
  Harmless but noisy; a data-URI icon removes it.

### Payload / slow connection

- **[note]** JSON is small: `venues.json` 46 KB, `2026-TT.json` 28 KB,
  `index.json` 0.5 KB — ~20 KB gzipped total. Fonts dominate first paint
  (24 woff2 files, 328 KB on disk; 7 preloaded ≈ 90 KB) but `font-display: swap`
  keeps text visible. No blocking third-party requests (brief §15) ✓.
- **[note]** Search re-renders the entire `#app` on every keystroke (140ms
  debounce, then refocus + caret restore). Works, but janky on a long list and
  disruptive to AT. Acceptable for the fixture; worth watching once several
  terms are held.

### Hard-coded assumptions

- **[note]** `pickerHTML` hard-codes weeks 0–8; `vacancyState` scans ±400/800
  days for the nearest populated day; `dayFeast` drops occasions matching
  `/Sunday|Week/i` or `/, \d{4}$/`. All bounded and reasonable.
- **[note]** `CONTACT` in `views.js` is `joseph.preston@pmb.ox.ac.uk`
  (hard-coded, appears on the About page). Intentional, but it's the one place a
  personal address ships in the HTML.

---

## 3. Typographer

- **[note] Type scale is honoured.** Root 16px, body 19px Spectral; date/week
  heading 2.3rem/1.75rem; masthead & chapel names Spectral SC; times, labels,
  nav, colophon in Spline Sans Mono. The serif/mono "content vs structure"
  split (brief §3) is kept strict — no mono reading text, no serif labels.
- **[note] Small caps are real.** `--serif-sc` is the genuine *Spectral SC*
  family (`spectral-sc-*.woff2`), not `font-variant: small-caps` and not
  `text-transform`. Confirmed: no `font-variant-caps` / `font-feature-settings`
  anywhere.
- **[judgement] No small-caps fallback.** If *Spectral SC* fails to load, the
  stack falls to plain *Spectral* with **no** synthesis — chapel names and the
  wordmark would render as ordinary mixed case. A `font-variant-caps:
  all-small-caps` on `.chapel` / `.mark` / `.venues .name` / `.chip .c` would
  hold the effect.
- **[judgement] Figures are genuine but unmanaged.** No `font-variant-numeric`
  or `font-feature-settings` is set. Times align because Spline Sans Mono is
  monospaced, not because `tabular-nums` is applied; the serif running text uses
  Spectral's default lining figures. If the "printed register" feel wants
  old-style figures in the serif, that's a deliberate addition.
- **[note] Time alignment is correct.** `.entry > .time` is right-aligned in a
  fixed 5rem (3.7rem ≤520px) column, mono, with the am/pm on its own line —
  "6.00 / 6.15 / 11.00 / 9.00" line up cleanly (screenshots).
- **[bug/typo] Widows in the music summaries.** On the 390px layout the
  collapsed summary and week-chip music lines routinely drop a single word:
  "…Those who / **follow**", "Plainsong Ad coenam Agni / **providi**",
  "…O clap your / **hands**", "…timent / **Dominum**". No `text-wrap: pretty`
  or widow control on `.summary`, `.chip .mus`, `.flag`. Brief §13 explicitly
  lists widows as a concern.
- **[note] Line length is capped** — `.music` / `.flag` / `.summary` / `.about`
  at ~43–44rem (≈ 74 chars) inside a 57rem board, per brief §4. No `hyphens`,
  but text is ragged-right so there are no rivers.
- **[judgement] Internal wording leaks to the reader.**
  `VENUE_STATUS_PROSE['not-parsed']` = *"Music list not yet transcribed"* and the
  verbatim `venueStatus.note` (*"Fixture term card - only magdalen, merton and
  keble are transcribed."*) both show on the Chapels list and chapel pages.
  "Transcribed" is pipeline jargon; the note is a build artefact. Mostly
  self-corrects with real term files, but the `VENUE_STATUS_PROSE` copy is a
  choice. The notes also use `-` (hyphen-minus) where an en-dash belongs.
- **[judgement] Week-grid `kind`.** Brief §9 says the week view shows the plain
  `type` ("Choral Evensong"), not the list's title. The build (`weekKind()`)
  shows the title minus parentheticals — so Magdalen Friday reads "Choral
  Evening Prayer" on the grid, not "Choral Evensong".
- **[note] Print sets well.** Every service prints expanded, palette forced to
  black-on-white, nav / toggle / arrows / disclosures hidden, `break-inside:
  avoid` on entries, board frame solid black (brief §13). Two nits: (a) `.src a`
  and `footer a` keep their underline in print (brief §13: "links lose
  underlines"); (b) the masthead clock ("Tuesday · 5.40 pm") still prints.
- **[judgement] "−2nd Week" heading** (see §2) is also a typographic wart — a
  hyphen-minus prefix on an ordinal.

---

## Fixes applied in this pass

1. **Malformed `?date=` / `?now=` no longer crash.** `router.params()` drops a
   `date` that isn't a real ISO calendar date; `london.nowParts()` ignores an
   invalid override date and falls back to the real clock. Added
   `isValidISODate` to `assets/oxweeks.js` and a regression test.
2. **Tonight view gets an `<h1>`** — the date `.pick` button is wrapped in
   `<h1 class="daytitle">`, which also restores the date to the brief's 2.3rem /
   1.75rem (it was rendering at 19px).
3. **Chapel page has one `<h1>`** — the week-nav label is now `<h2>`, day-group
   headings `<h3>`.
4. **`<main>` landmark** wraps every view's content; `.masthead` is now
   `<header>`.
5. **Search results live region** — the count + results container carry
   `role="status" aria-live="polite"`.
6. **Focus management** — after an expand/collapse the disclosure button keeps
   focus; after an in-app navigation focus moves to the view's `<h1>`
   (`tabindex="-1"`). `document.title` is set per view.
7. **Touch targets** — day-nav arrows and the disclosure get ≥24px hit areas at
   ≤520px (padding + negative margin, no visual change).
8. **Widows** — `text-wrap: pretty` on `.summary`, `.chip .mus`, `.flag`,
   `.entry .notes`.
9. **Print** — `.src a` / `footer a` lose their underline; the masthead clock is
   hidden.
10. **Favicon** — inline data-URI SVG, kills the `/favicon.ico` 404.
11. **Docs** — `data-schema.md` and `decisions.md` updated to say the site
    fetches exactly `index.termFiles`.

## Left for a human decision

- `--faint` contrast (3.2 : 1 light / 4.0 : 1 dark) vs. the brief's sanctioned
  exception — adopt the darker `--faint`, or reclassify the footer colophon.
- Picker selected-day cell contrast (white on flat `--accent`).
- `VENUE_STATUS_PROSE` wording ("transcribed") and whether `venueStatus.note`
  should be shown verbatim to readers.
- Week-grid `kind`: list title vs. plain `type` (brief §9).
- Week view's missing "term not yet published" empty state.
- "Vacation" vs. "−2nd Week" for weeks < 0 in the date band.
- Partial-load behaviour: index up, all term files down → "nothing on" vs.
  "couldn't load".
- Old-style figures in the serif, and a `font-variant-caps` fallback for
  Spectral SC.
- No-JS: the page is still blank without JavaScript (only `<noscript>`);
  deferred in `docs/later.md` — confirm that's acceptable for launch.
- Search term-label uses `resolveTerm(now)`, so in production before Michaelmas
  it will read "Michaelmas 2026" while showing Trinity results (cosmetic).

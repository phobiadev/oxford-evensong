# Later

Work deliberately deferred. Not a backlog of bugs — a map of what this skeleton
leaves for future phases.

## The site UI

- `index.html` + `assets/` — plain HTML/CSS/ES-modules, no build. Fetches
  `data/index.json` then `data/terms/<current>.json` at runtime.
- Must work under a GitHub Pages sub-path — relative URLs only.
- Built against `data/terms/2026-TT.json` (the fixture).
- Needs `docs/design-brief.md` written first.
- Surfaces `confidence: "low"` / `"medium"` to the reader; never shows
  `parserNote` as body text.

## Site: deferred from the first build

- **True no-JS render.** The brief (§14) wants the core "what's on today" read to
  work without JavaScript. The site fetches JSON at runtime, so this needs a
  build step that bakes today's / this week's HTML into `index.html`. Out of
  scope for a no-build site; `<noscript>` currently points at the data and the
  about page. Revisit if a static pre-render step becomes acceptable.
- **Find music: filters + history.** v1 search is a plain box (see the brief §9).
  Add chapel / week / service-type filters and search across held past terms.
- **Structured venue patterns.** `venues.json` `typicalPattern` is prose. A
  structured form (day + time + service type) would let Tonight/Week show the
  brief's "ghost" rows (a chapel whose list isn't out, at its usual slot, clearly
  marked as a pattern not a claim) instead of only the trailing "also awaited"
  line. It would also give the chapel-page "list not published" state a short
  "usually Tue, Thu, Sun at 18:15" line.
- **Per-service `flag` / première fields.** The honesty markers (§8.1) currently
  render a generic sentence by `confidence`, and the "FIRST PERFORMANCE" note
  rides in `notes`. A structured per-service `flag` string and a per-music-item
  `firstPerformance` flag would let the UI match the mock's specificity without
  ever surfacing `parserNote`.
- **Date picker.** Ships as a term-week grid over the date heading. A month
  calendar was considered; revisit if users want to jump across terms.
- **Week view print.** Prints as a stacked summary sheet (chips), not
  fully-expanded music per service — that belongs to Tonight / Chapel. Fine for
  now; reconsider if a full week order-of-service printout is wanted.

## `scripts/fetch.mjs`

Deterministic downloader: for a term, read `data/venues.json`, fetch each venue's
current list (scraping the chapel page for the live link where the URL is opaque —
Balliol, Merton, Pusey, St Peter's, St Edmund Hall, …), save raw files under
`sources/<termId>/`, and write a `venueStatus` skeleton. No parsing.

## `.claude/skills/update-termcard`

The interpretive half: read the downloaded lists, produce `data/terms/<termId>.json`
to the schema, write a report under `reports/`. Works on a branch, opens a PR,
never commits to `main`.

## Known hard cases (from `docs/sources-survey.md` §6, and `docs/decisions.md`)

- **Christ Church** — monthly lists, Cathedral-School term boundaries.
- **Exeter** — `.docx` parsing.
- **Worcester, Somerville** — image-only PDFs; OCR or manual entry.
- **Hertford, Corpus Christi, St Hugh's, Brasenose, Pembroke** — confirm whether a
  public list exists at all; "no list" must be a normal state.
- **New College** — list hosted on the college site or the choir site, varying by term.
- **Free Church venues** — scope and labelling for non-Evensong sung services.

## Data / tooling

- Replace the `2026-TT` fixture with real term files; add each term to
  `data/index.json` once ox.ac.uk confirms its (currently provisional) dates.
- Decide a `time: null` convention for the `<HHMM>` part of a service id.
- CI: run `node scripts/validate.mjs` and `node --test scripts/` on push.

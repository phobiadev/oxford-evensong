# Oxford Evensong

A static site listing sung services in Oxford's college chapels and the cathedral:
what's on each day, when, and what music is sung, taken from the chapels' own
published music lists.

## Principles

- `data/` is the single source of truth. The site renders it and contains no
  hard-coded services.
- Never invent data. Every service carries a source URL, fetch time and locator.
  Unknown means `null`, never a guess. If a list says nothing about a day, there
  is no record for that day.
- Music text is verbatim from the list (whitespace normalised). Optional structured
  fields (`composer`, `title`) are extras; the `text` is the record.
- Deterministic work is scripts (dates, validation, downloads). Reading and parsing
  lists is done by the `update-termcard` skill.
- The site: plain HTML/CSS/JS (ES modules), no framework, no build step, no runtime
  dependencies. It fetches JSON at runtime. Node is only for `scripts/`.
- Hosted on GitHub Pages from `main`, root folder, so it must work under a sub-path
  like `https://USER.github.io/oxford-evensong/`. `.nojekyll` is committed.
- Design brief: `docs/design-brief.md`. Elegant and stripped back; not
  cliché-minimalist.

## Layout

| Path | What |
|---|---|
| `index.html` | the site shell (loads `assets/fonts.css`, `assets/style.css`, `assets/app.js`) |
| `assets/*.js` | ES modules: `app` (entry) · `router` (query params) · `data` (fetch + merge) · `oxweeks` (browser week arithmetic) · `london` (Europe/London "now") · `schedule` (Tonight day rule) · `entry` (the service-entry component) · `views` · `theme` · `dom` |
| `assets/style.css` | tokens + components (was `design/style.css`) |
| `data/venues.json` | venue registry |
| `data/index.json` | `{ current, terms }` — term ids and dates |
| `data/terms/<termId>.json` | one file per term (schema: `docs/data-schema.md`) |
| `sources/<termId>/` | raw downloaded lists per term, committed for audit, never linked from the site |
| `sources/samples/` | the survey's sample lists |
| `reports/` | reports written by the update skill |
| `scripts/` | `oxweeks.mjs`, `validate.mjs`, `fetch.mjs`, plus `*.test.mjs` |
| `docs/` | `sources-survey.md`, `data-schema.md`, `design-brief.md`, `decisions.md`, `later.md` |
| `.claude/skills/update-termcard/` | `SKILL.md` (procedure) + `parsing-notes.md` (per-venue parsing memory) |

## Commands

- `python3 -m http.server 8000` — preview at `http://localhost:8000/`
- `node scripts/validate.mjs [--strict]` — validate all data files
- `node --test scripts/` — run the script tests (includes `site.test.mjs`, the
  browser modules)
- `/update-termcard "<Term Year>" [venueId …]` — refresh a term's data from the
  chapels' published lists (branch + PR; never commits to `main`)

## The site

- Plain HTML/CSS/ES-modules, no build. `index.html` fetches `data/` at runtime.
  All URLs relative so it works under a Pages sub-path.
- **Routing is query parameters** (the path never changes): `?view=tonight|week|
  chapels|chapel|search|about`, `?date=YYYY-MM-DD`, `?venue=<id>`, `?q=<text>`,
  `?open=<serviceId>[,<serviceId>]` (expanded services). This supersedes the
  hash-routing sketch in `docs/design-brief.md` §11.
- **`?now=<ISO>`** overrides "now" for testing / screenshots, read as
  Europe/London wall-time, e.g. `?now=2026-10-29T17:40` or `?now=2026-05-12`.
  Real "now" is `Intl.DateTimeFormat(timeZone:'Europe/London')`.
- **`?theme=light|dark`** forces a palette for a shared link / screenshot
  (not persisted; the masthead toggle is what persists, in `localStorage`).
- Screenshots for review: headless Chromium via Playwright (dev-only; not a repo
  dependency — `/package.json` and `/package-lock.json` are git-ignored).

## Conventions

- Oxford weeks run Sunday–Saturday; Sunday of 1st Week = start of Full Term; 0th
  Week precedes it. Use `scripts/oxweeks.mjs`; never do week arithmetic by hand.
- Term dates come from `data/index.json`; a term file may carry its own dates as a
  fallback when the term is not yet in `index.json` (see `docs/data-schema.md`).
- Times are Europe/London local, `"HH:MM"`. Dates are ISO. Term ids are
  `<year>-MT|HT|TT`. Service ids are `<date>-<venueId>-<HHMM>`.
- Controlled vocabularies are in `docs/data-schema.md`; extend them there first.
- Commit after each phase. The update skill works on a branch and opens a PR; it
  never commits to `main`.

## State (2026-09)

- Sources survey done (`docs/sources-survey.md`), registry populated
  (`data/venues.json`, 30 venues).
- **Pipeline built.** `scripts/fetch.mjs` (dependency-free downloader: PDF →
  `pdftotext`, `.docx` → unzip `document.xml`, text-layer check) and the
  `update-termcard` skill (`.claude/skills/update-termcard/` — procedure +
  `parsing-notes.md` memory). The skill fetches each chapel's list, parses it to
  the schema, validates, writes a `reports/` file, opens a PR, never touches `main`.
- `data/index.json` lists Michaelmas 2026 onward (the dates ox.ac.uk publishes).
  `current` is `2026-MT`, whose lists are not out yet. `2026-TT` stays out of
  `terms{}` (resolved from its own term file) but is in `termFiles`.
- `data/terms/2026-TT.json` is a **full-term parse** (update-termcard run
  2026-09-02): ~460 sung services across 20 venues for Trinity 2026, plus honest
  per-venue status for the rest. It superseded the earlier 3-venue/1-week fixture.
  See `reports/2026-TT-2026-09-02.md`. `validate.mjs` passes with 0 errors;
  `--strict` still fails on expected low-confidence + `index.json` warnings.
- **Design done. `docs/design-brief.md` is the definitive spec** (direction H2:
  serif + small caps, monospace scaffolding, one bounded "board", warm paper + one
  sage accent, light + evening palettes). Reference mocks: `design/tonight.html`,
  `design/week.html`; `docs/design-directions.md` logs the rejected options.
- **Site built.** `index.html` + `assets/` render all five views (Tonight, This
  week, Chapels + chapel page, Find music, About) from `data/` at runtime, against
  the `2026-TT` fixture. `data/index.json` gained `"termFiles"` (the list of term
  files that physically exist) so the app knows what to fetch. Search is built
  (basic; filters deferred — see `docs/later.md`). Now runs against the real
  `2026-TT` term file.

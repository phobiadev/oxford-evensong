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
| `index.html`, `assets/` | the site (later phase) |
| `data/venues.json` | venue registry |
| `data/index.json` | `{ current, terms }` — term ids and dates |
| `data/terms/<termId>.json` | one file per term (schema: `docs/data-schema.md`) |
| `sources/<termId>/` | raw downloaded lists per term, committed for audit, never linked from the site |
| `sources/samples/` | the survey's sample lists |
| `reports/` | reports written by the update skill |
| `scripts/` | `oxweeks.mjs`, `validate.mjs`, `fetch.mjs` (later) |
| `docs/` | `sources-survey.md`, `data-schema.md`, `design-brief.md`, `decisions.md`, `later.md` |
| `.claude/skills/` | skills (later phase) |

## Commands

- `python3 -m http.server 8000` — preview at `http://localhost:8000/`
- `node scripts/validate.mjs [--strict]` — validate all data files
- `node --test scripts/` — run the script tests
- `/update-termcard "<Term Year>"` — refresh a term's data (skill, later)

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
  (`data/venues.json`, 30 venues). Scraper / `fetch.mjs` not started.
- `data/index.json` lists Michaelmas 2026 onward (the dates ox.ac.uk publishes).
  `current` is `2026-MT`, whose lists are not out yet.
- `data/terms/2026-TT.json` is a **hand-built fixture**: 3rd Week of Trinity 2026,
  three venues (magdalen, merton, keble), transcribed from `sources/samples/`. It
  is what the site UI is built against. `validate.mjs --strict` reports 3 expected
  warnings against the current data (see `docs/decisions.md`).
- **Design done. `docs/design-brief.md` is the definitive spec** (direction H2:
  serif + small caps, monospace scaffolding, one bounded "board", warm paper + one
  sage accent, light + evening palettes). Reference mocks: `design/tonight.html`,
  `design/week.html`; tokens/components in `design/style.css`, enhancement layer
  `design/app.js`, self-hosted fonts in `assets/fonts/`. `docs/design-directions.md`
  logs the rejected options. **Next: build `index.html` + render/routing** (promote
  `design/style.css`+`app.js` to `assets/`). Search deferred.

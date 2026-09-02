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

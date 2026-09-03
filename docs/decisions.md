# Decisions

Running log of choices that shaped the project and aren't obvious from the code.

## Fixed at the start (project brief, Sept 2026)

- **Static site, no build.** Plain HTML/CSS/JS (ES modules). No framework, no
  bundler, no build step, no runtime dependencies. The site fetches JSON at
  runtime. Node is used only for `scripts/`.
- **GitHub Pages from `main`, root folder.** Must work under a sub-path
  (`https://USER.github.io/oxford-evensong/`). `.nojekyll` is committed. Use
  relative paths everywhere in the site.
- **`data/` is the single source of truth.** No service is ever hard-coded in the
  site. Nothing is guessed: unknown is `null`.
- **Deterministic vs. interpretive work is split.** Dates, validation and (later)
  downloads are plain scripts in `scripts/`. Reading and parsing music lists is the
  `update-termcard` skill's job. The skill works on a branch and opens a PR — it
  never commits to `main`.
- **Verbatim music text.** `music[].text` is exactly what the list says (whitespace
  normalised). `composer` / `title` are search extras and must never be the only
  place a fact lives.

## `data/index.json` holds only ox.ac.uk's published terms

`docs/sources-survey.md` records Full-Term dates for **Michaelmas 2026 onward**
only (Trinity 2026 and earlier are not on the university's "dates of term" page any
more). Decision: `data/index.json` lists exactly those terms — `2026-MT`, `2027-HT`,
`2027-TT` — and nothing derived. `current` is `2026-MT`.

Consequence: the Trinity 2026 fixture's term is **not** in `index.json`.
`scripts/oxweeks.mjs` and `scripts/validate.mjs` therefore fall back to a term
file's own `term` block when a term id is absent from `index.json`. The fixture's
`weekOneSunday` (2026-04-26) / `lastSaturday` (2026-06-20) were read off the
Trinity 2026 sample lists (Wadham, Oriel). See `docs/data-schema.md` → "Term
resolution".

## `data/index.json` `termFiles` (added with the site build)

The site can't list a directory, so it needs to be told which term files exist.
`termFiles` is that list — `["2026-TT"]` now. It is deliberately separate from
`terms`: `terms` stays authoritative (ox.ac.uk-published Full-Term dates only, the
fixture excluded, per the decision above), while `termFiles` just says "this file
is on disk, fetch it". When real term files land they go in both.

The site fetches **exactly** the ids in `termFiles` (commit `dbad39b` — no more
speculative fetches of `current` / `keys(terms)` that 404 in the console). It
still tolerates a 404 on a listed file. `validate.mjs` keeps `termFiles` and the
files on disk in step.

## Site routing: query parameters, not the hash

`docs/design-brief.md` §11 sketched hash routing (`#/week/2026-TT/3`). The build
uses query parameters instead (`?view=week&date=…`, `?venue=…`, `?q=…`, `?open=…`,
`?now=…`, `?theme=…`) — the build brief called for shareable `?…` URLs with those
exact shapes. The path never changes so it still works under the Pages sub-path.
Brief §11/§9 updated with a note; behaviour is unchanged.

## The fixture: `data/terms/2026-TT.json`

- **Trinity 2026, 3rd Week only** (Sun 2026-05-10 – Sat 2026-05-16), three venues:
  - `magdalen` — a boys-and-men daily foundation (per-service times, week+day layout).
  - `merton` — a student-mixed college (Sunday Choral Eucharist with a setting; a
    "Choral Vespers" recorded as `type: "other"`; visiting-choir wording).
  - `keble` — the most awkward format: an Anglo-Catholic, calendar-date list that
    prints almost no slot labels. Its music slots are assigned by position and
    flagged (`confidence: "medium"`/`"low"`, `parserNote` on every service).
- Transcribed faithfully from `sources/samples/{magdalen,merton,keble}.pdf`, which
  are also copied to `sources/2026-TT/` for audit.
- Said Morning Prayer, midday said Eucharists, organ recitals and one-off
  memorial/wedding services are **omitted** — only sung choral services.
- This file is what the site UI will be built against; its shape matters more than
  its size.

## `validate.mjs --strict` currently reports 3 warnings (expected)

1. `index.json current` names `2026-MT`, which has no term file yet — normal before
   a term's lists are published.
2. The `2026-TT` fixture isn't in `index.json` — by the decision above.
3. Keble's Sunday Eucharist is `confidence: "low"` — deliberately, because its
   music slots are interpreted.

Plain `node scripts/validate.mjs` exits 0. `--strict` will exit 1 until real term
files replace the fixture and `index.json` catches up.

## The pipeline: `scripts/fetch.mjs` + `update-termcard` (Sept 2026)

- **`scripts/fetch.mjs`** — one URL per invocation, no dependencies. Follows
  redirects, writes the raw file, and: for a PDF runs `pdftotext -layout`; for a
  `.docx` runs `unzip -p … word/document.xml` and strips tags to text (there is no
  `pandoc`; `unzip` is a system tool like `pdftotext`). Reports whether the text
  layer looks usable (> 200 non-whitespace chars/page). The **skill** paces
  between venues; the script does not sleep. User-Agent is the repo URL only, **no
  contact email** (JP's choice, 2026-09-02).
- **`update-termcard`** works on a branch, opens a PR, never commits to `main`.
  `disable-model-invocation: true` — always user-started. Detailed per-venue
  parsing lives in `parsing-notes.md`, updated at the end of every run.

## First real run: Trinity 2026 (2026-09-02)

`/update-termcard "Trinity 2026"` replaced the 3-venue/1-week fixture with a
full-term parse: **~460 sung services across 20 venues**. Method notes:

- Every TT26 list fetched fresh matched its `sources/samples/` copy byte-for-byte
  (the lists have not changed since the survey), so the sample-based
  `parsing-notes.md` applied directly.
- **20 venues published.** The rest carry an honest status: `worcester`
  (image-only PDF → `not-parsed`, needs OCR); `corpus-christi` / `somerville` /
  `university-church` (`not-found` — no current list on the page when fetched);
  `hertford` / `st-hughs` (`not-yet-published`); five Free-Church / no-chapel
  venues `no-list`.
- **Christ Church** is monthly: the April, May and June 2026 PDFs were all fetched;
  only the 26 Apr – 20 Jun services are in the term file. Each service's
  `source.url` points at its own month's PDF.
- **`music[].text` is verbatim; structured `composer`/`title` extras were not
  populated** for the newly-parsed venues this run (they are optional search aids;
  the `text` is the record). Populating them across the term is deferred.
- Unlabelled Anglo-Catholic lists (Keble, Pusey House) and New College's
  minimally-labelled list have position-inferred slots at `confidence: medium`
  with a blanket `parserNote`. 12 services are `confidence: low` (listed in the
  report).
- Roman Catholic Masses hosted in chapels (Queen's 3 Jun, Exeter 12 Jun, Magdalen
  18 May, LMH 9 Jun) are out of scope and omitted.

## Nav cells renamed "Day" / "Week"; picker pages across terms (Sept 2026)

The nav cells were **"Tonight" / "This week"** (brief §9 froze the first label).
Renamed to **"Day" / "Week"**: the `.datehead` band — arrows, the clickable
date/week heading, the picker — is the actual navigator, so the cell only names
the mode. Internal view ids stay `tonight` / `week`; only the visible label,
`<title>`, and the mocks changed.

Same pass: the term-week picker gained ‹ › term paging in its head (it renders
one term's grid; the arrows write `?date=` into the adjacent term's 1st-week
Sunday and `resolveTerm` re-resolves), and the **Week** view got the same picker.
A "Today" / "This week" link appears by the arrows when the shown date/week is
not the current one. The Week head now guards out-of-band weeks: past weeks
−2..10 it reads **"Vacation"** (matching `dayHead`) instead of "-5th Week of
Trinity", and its Sunday is computed by `addDays` rather than a clamped
`dateForWeekDay`, which had frozen prev/next navigation at the boundary. The
identical latent bug in `chapel()` was fixed too. `weekHeadTitle()` in
`assets/views.js` is the shared, unit-tested guard.

## Open questions carried from the survey (`docs/sources-survey.md` §6)

- **Christ Church publishes monthly, not termly** — the update process must
  re-scrape the worship page each calendar month and track Cathedral School term
  boundaries.
- **Exeter publishes a `.docx`** — confirm it's durable; decide parse vs. OCR the
  image-only term-card PDF.
- **Worcester and Somerville music lists are image-only PDFs** — OCR or treat as
  manual-entry venues.
- **Hertford, Corpus Christi, St Hugh's, Brasenose** — current-term list missing or
  nonexistent. Treat "no list yet" as a normal per-venue state, not an error; mark
  per-venue whether a list is expected at all.
- **New College** hosting flips between the college site and the choir site term to
  term — check both.
- **Free Church venues** (Regent's Park, Mansfield, Harris Manchester) hold sung
  services that are not Choral Evensong — confirm scope and labelling.
- **Full Term 2026–27 dates are "provisional"** on ox.ac.uk — re-check before launch.

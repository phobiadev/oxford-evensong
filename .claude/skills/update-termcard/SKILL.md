---
name: update-termcard
description: 'Refresh a term''s evensong data from the chapels'' published music lists. Usage: /update-termcard "Michaelmas 2026" [venueId …]'
argument-hint: '<Term Year> [venueId ...]'
disable-model-invocation: true
---

# update-termcard

Rebuild `data/terms/<termId>.json` for one term by reading each chapel's own
published music list. Deterministic work (dates, downloads, validation) is done by
`scripts/`; the reading and interpreting is done here, by you, carefully.

**Read `parsing-notes.md` (next to this file) before step 5.** It is the memory
between terms: per-venue layouts, the heading→slot map, and the traps. Update it at
the end of every run.

## Ground rules (not negotiable)

- **Never invent data.** Every service comes from a line you actually read in the
  fetched document. A day the list does not mention produces **no record** — do
  not fill gaps from `typicalPattern`. Unknown fields are `null`, never a guess.
- **`music[].text` is verbatim** from the list, whitespace normalised, in the
  list's own order. `composer`/`title` are optional search extras and must never
  be the only place a fact lives.
- **A confident guess is the only wrong answer.** Anything you interpreted — an
  ambiguous week label, a service you think is said, a smudged line, a page that
  ran out mid-week, a slot assigned by position — gets `confidence: "low"` and a
  `parserNote` saying why. `low` is a fine outcome.
- **Work on a branch, open a PR, never merge, never touch `main`.**
- **Do not edit `data/venues.json`**, with one exception: if a venue's list has
  plainly moved to a new URL, update `musicList.url` and say so in the report.
- Spend at most a few minutes per venue. Never loop.

## Procedure

### 1. Resolve the term and the venue set

- Turn `$ARGUMENTS` into a `termId`: `"<Season> <Year>"` → `<Year>-MT|HT|TT`
  (Michaelmas→MT, Hilary→HT, Trinity→TT). e.g. `"Trinity 2026"` → `2026-TT`.
- Confirm the term is resolvable by `scripts/oxweeks.mjs`:
  `node -e "import('./scripts/oxweeks.mjs').then(m=>console.log(m.resolveTerm('<termId>')))"`.
  It looks in `data/index.json` `terms{}` first, then the term file's own `term`
  block (`docs/data-schema.md` → "Term resolution").
- If it is **not** resolvable: look up Full Term on ox.ac.uk. The live page
  (`https://www.ox.ac.uk/about/the-university/facts-and-figures/dates-of-term`)
  returns 403 to automated fetches — use the Wayback Machine
  (`http://web.archive.org/web/2026*/https://www.ox.ac.uk/about/the-university/facts-and-figures/dates-of-term`).
  The "From" date is the **Sunday of 1st Week**, the "To" date the **Saturday of
  8th Week**. Show the user both dates and **wait for confirmation** before adding
  the term to `data/index.json` `terms{}`. Do not add a term whose dates
  ox.ac.uk no longer publishes (see `docs/decisions.md`).
- Further arguments after the term are `venueId`s: restrict the run to those.
  Otherwise the run covers **every venue in `data/venues.json` with
  `musicList.format !== "none"`**.

### 2. Branch

- `git status` must be clean. If not, stop and tell the user.
- `git checkout -b update/<termId>-<YYYY-MM-DD>` (today's date, Europe/London).

### 3. Load the previous term file (this is a merge, not a wipe)

- If `data/terms/<termId>.json` exists, load it. Keep its `term` block.
- Any venue that fails to fetch or parse **this** run keeps its **previous**
  `services` and a `venueStatus` entry carried over from the previous file, with a
  short note appended that this run could not refresh it. A failed venue never
  loses data it already had.

### 4. Fetch each venue's current list

For each venue in scope, in registry order:

1. Load `musicList.url` (the chapel/music page).
2. Find the link to **this term's** list. Match the term name or its abbreviation
   **and the year** in the link text or href. The previous term's list often stays
   on the page — do not take it. `parsing-notes.md` records each venue's filename
   scheme and the "scrape the page, the URL is opaque" cases (Balliol, Merton,
   Pusey House, St Peter's, St Edmund Hall) and New College's college-site ↔
   choir-site flip.
3. Download it: `node scripts/fetch.mjs "<listUrl>" sources/<termId>/<venueId>.<ext>`
   (`ext` = `pdf` / `docx` / `html`). **Wait ~1 second between venues.**
4. Read the text: the `.txt` beside a PDF/docx if `fetch.mjs` reported it USABLE;
   otherwise open the PDF itself with the Read tool; for HTML read the saved file.
5. Record a `venueStatus` for the venue:
   - `published` — a current list was found and read.
   - `not-yet-published` — the venue says the list is forthcoming / not up yet.
   - `not-found` — a list was expected here but this term's could not be located
     (record the URL you checked).
   - `fetch-failed` — a URL was found but the download failed twice.
   - `not-parsed` — fetched but its music cannot be transcribed this run
     (image-only PDF needing OCR, etc.). Explain in `note`.
   - `no-list` — the venue never publishes a term music list.

If a fresh fetch fails or the page has changed and there is a committed sample at
`sources/samples/<venueId>.*`, you may fall back to it: copy it into
`sources/<termId>/` and record in the report that the sample was used and why.

### 5. Parse each list into service records

Follow `docs/data-schema.md` and `parsing-notes.md`. For every service:

- **Only services in the document.** No gap-filling.
- **Date** from the Oxford week + day via `scripts/oxweeks.mjs` — run it, never do
  the arithmetic yourself:
  `node -e "import('./scripts/oxweeks.mjs').then(m=>console.log(m.dateForWeekDay('<termId>',<week>,'<Day>')))"`.
  If the list uses calendar dates, use those, and check they agree with the week
  the list states (`weekDayForDate`); flag a disagreement `low`.
- **`music[]`**: verbatim `text`, whitespace normalised, list order preserved. Map
  each heading to a slot from `parsing-notes.md`. An unknown heading →
  `slot: "other"` with the heading in `label`. Readings, sermons and non-musical
  items are **not** recorded.
- **`time`**: from the list if given. Else from `venues.json` `typicalPattern` for
  that day — `confidence: "medium"`, `parserNote: "time from venue pattern"`. Else
  `time: null`, `confidence: "low"`.
- **`type` / `title` / `occasion` / `choir` / `preacher` / `notes`**: per the
  schema. `choir` is set **only** for singers who are not the venue's own choir or
  one of its sub-groups. Feast days can change `type` (e.g. Ascension Day
  Eucharist → `choral-eucharist`).
- **`confidence`**: `high` only when unambiguous. Anything interpreted → `low` (or
  `medium` for a by-position slot / a pattern time) with a `parserNote`.
- **`source`**: `{ url, fetchedAt, locator }` on every service. `locator` must let
  the user find the entry in the source in ~10 seconds — `"PDF p.11, 'THIRD WEEK -
  13 WEDNESDAY', 6.00 pm"`, `"Booklet p.7, '12 Tuesday'"`, `"HTML, 'Sunday 17
  May'"`.
- **`id`**: `<date>-<venueId>-<HHMM>`; if `time` is `null`, use `0000` as the
  placeholder (the validator only checks the `<date>-<venueId>-` prefix then).

### 6. Write `data/terms/<termId>.json`

- `term`: preserve the existing block, or create it from the resolved term.
  `timezone` is always `"Europe/London"`.
- `generated`: `{ at: <ISO now>, by: "update-termcard", notes: "<one paragraph:
  venues covered, venues skipped and why, anything unusual>", sources:
  "sources/<termId>/" }`.
- `venueStatus`: an entry for **every** venue in `data/venues.json` (carry over
  `not-parsed` / `no-list` for those out of scope). `services` count must equal
  that venue's number of service objects.
- `services`: sorted by `date`, then `time` (`null` last), then `venueId`.
- `data/index.json`: add `<termId>` to `termFiles` if missing. Set `current` to
  `<termId>` **only if** `<termId>` is the current or next term relative to
  today (compare today to term windows via `oxweeks`); otherwise leave `current`.

### 7. Validate

- `node scripts/validate.mjs` — must exit 0 (**zero errors**).
- `node scripts/validate.mjs --strict` and `node --test scripts/` — run both,
  paste their output into the report.
- Expected, non-blocking warnings: every `confidence: "low"` service; `current`
  naming a term with no file; a term file not in `index.json` `terms{}`.
- Fix **real** errors by correcting the parse — never by deleting records. If a
  venue's data cannot be made valid, revert that venue's services to the previous
  run's, set its status to `not-parsed`, and explain in the report.

### 8. Write the report — `reports/<termId>-<YYYY-MM-DD>.md`

- **Venue table**: every venue — status, source URL, services found, weeks
  covered, and counts of `high` / `medium` / `low`.
- **Diff** against the previous `reports/<termId>-*.md` (if any): services added,
  changed, removed, per venue.
- **Every low-confidence service**, with the raw source excerpt it came from and
  why it is `low`.
- **Every venue skipped or not published**, and why.
- **Needs a human**: anything you could not resolve.
- **Spot-check**: pick three services at random; print, side by side, the raw
  source text and the record you produced.

### 9. Commit and open a PR

- `git add sources/<termId>/ data/ reports/` and commit. End the commit message
  with the repo's trailers (`Co-Authored-By: …`, `Claude-Session: …`).
- `git push -u origin <branch>`.
- `gh pr create --title "Term card: <Term Year> (<YYYY-MM-DD>)" --body "<the
  report's summary>"`.
- If `gh` is unavailable: stop after committing and pushing (or after committing
  if push fails) and tell the user. **Never merge.**

### 10. Summarise in chat

Venues published / not-yet-published / failed (counts), total services recorded,
and the three things most worth the user's eye.

### 11. Update `parsing-notes.md`

Add anything new this run taught you — a new heading, a new week-header style, a
venue that moved, a feast that changed a service type. Commit it on the branch.

## Idempotence

Running twice on the same day with unchanged sources must produce **no diff**:

- Emit JSON with stable key order and the sort from step 6.
- Only bump a service's `source.fetchedAt` when the downloaded bytes actually
  changed (compare against the committed `sources/<termId>/` file first; if
  identical, keep the previous `fetchedAt`).
- `generated.at` changes every run by design — it is the one field allowed to
  differ. If nothing else changed, restore the previous `generated.at` so the
  file is byte-identical and `git diff` is truly empty.

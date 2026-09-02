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
- **Find music: history + week filter.** Search now has chapel / service-type
  filters, an upcoming-only toggle (on by default) and sort (date ↑/↓, composer,
  chapel). Still missing: a week filter, searching across held *past* terms, and
  composer sort keys on `m.text` where `m.composer` is absent (rough A–Z).
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

## ~~`scripts/fetch.mjs`~~ — done (Sept 2026)

Built. Also handles `.docx` (Exeter). See `docs/decisions.md`.

## ~~`.claude/skills/update-termcard`~~ — done (Sept 2026)

Built and run once (Trinity 2026). Deferred within it:

- **Structured `composer`/`title` extras** across the term (verbatim `text` is
  complete; the extras are optional search aids — populate on a later pass).
- **Idempotence hardening.** The skill describes byte-stable output and a stable
  `generated.at` when nothing else changed; the current run used a hand-run
  builder, so re-running the skill needs that logic wired in.
- **Oriel** publishes its per-service music on a separate chapel web page that was
  not located this run — its services are recorded from the term card without
  music. Find the page.
- **Worcester** needs OCR (or manual entry) for its image-only PDF.

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

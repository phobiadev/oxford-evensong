# Oxford Evensong

**[phobiadev.github.io/oxford-evensong](https://phobiadev.github.io/oxford-evensong/)**

A static site listing the sung services in Oxford's college chapels and the
cathedral: what is on each day, when, and what music is sung — taken from the
chapels' own published music lists.

Five views, all routed by query parameter (the path never changes):

| View | URL |
|---|---|
| Tonight | `?view=tonight` (default) |
| This week | `?view=week` |
| Chapels | `?view=chapels`, one chapel `?view=chapel&venue=<id>` |
| Find music | `?view=search&q=<text>` |
| About & sources | `?view=about` |

`?now=<ISO>` overrides "now" for testing (read as Europe/London wall-time, e.g.
`?now=2026-05-12T17:40`). `?theme=light|dark` forces a palette for a shared link.

## How the data works

`data/` is the single source of truth. The site is plain HTML/CSS/ES-modules with
no build step; it fetches the JSON at runtime and renders it. There are no
hard-coded services.

| File | What |
|---|---|
| `data/venues.json` | the venue registry — one entry per chapel, compiled by hand from each chapel's website |
| `data/index.json` | `{ current, termFiles, terms }` — term ids, their Full-Term dates, and which term files exist |
| `data/terms/<termId>.json` | one file per term: every sung service that term, plus honest per-venue status |
| `sources/<termId>/` | the raw downloaded lists (PDF/`.docx`/HTML), committed for audit, never linked from the site |

Rules (see `docs/data-schema.md` for the full schema and vocabularies):

- **Never invent data.** Every service carries a source URL, fetch time and
  locator. Unknown is `null`, never a guess. If a list says nothing about a day,
  there is no record for that day.
- **Music text is verbatim** from the list (whitespace normalised). `composer`
  and `title` are optional extras; the `text` is the record.
- Term ids are `<year>-MT|HT|TT`. Service ids are `<date>-<venueId>-<HHMM>`.
  Times are Europe/London local `"HH:MM"`; dates are ISO.

## Run locally

```sh
python3 -m http.server 8000      # then open http://localhost:8000/
```

All URLs are relative, so the site also works under a sub-path (as it does on
GitHub Pages).

```sh
node scripts/validate.mjs [--strict]   # validate every data file
node --test scripts/                   # run the script + browser-module tests
```

## Run the termly update

When a term's music lists are published, refresh that term's data with the
`update-termcard` skill (Claude Code):

```
/update-termcard "Michaelmas 2026" [venueId …]
```

It fetches each chapel's list (`scripts/fetch.mjs` handles the download and text
extraction), parses it to the schema, runs `validate.mjs`, writes a report under
`reports/`, and opens a pull request. It works on a branch and **never commits to
`main`**. Procedure and per-venue parsing memory live in
`.claude/skills/update-termcard/`.

## Add a venue

1. Add an entry to the `venues` array in `data/venues.json`. Required-ish fields:
   `id` (kebab-case, stable — it appears in service ids and URLs), `name`,
   `shortName`, `chapel`, `kind`, `website`, `chapelPage`, `musicList`
   (`url`, `format`, `organisation`, `notes`), `choir`, `typicalPattern`,
   `access`, `lastChecked`. Use `null` for anything genuinely unknown. See the
   existing entries and `docs/data-schema.md` for the field definitions and the
   `kind` / `format` vocabularies.
2. If you add a new value to a controlled vocabulary, add it to
   `docs/data-schema.md` first.
3. Run `node scripts/validate.mjs`.
4. The venue shows up on the site immediately (Chapels view). Its services appear
   once a term file includes them — i.e. after the next `update-termcard` run
   that covers it.

## Deployment

GitHub Pages serves `main`, root folder. `.nojekyll` is committed. Pushing to
`main` publishes.

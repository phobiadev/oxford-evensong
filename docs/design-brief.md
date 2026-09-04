# Design brief

The definitive brief for the site UI. `design/style.css` is the authoritative
source for exact values (tokens, sizes, spacing); this document records the intent,
the component contracts, and the decisions behind them. Where the two ever
disagree, `style.css` wins and this file is wrong — fix it.

Chosen direction: **H2**, after A → D/E/F → G/H/I → H1/H2/H3 (history in
`docs/design-directions.md`).

## 1. What it is

An order of service crossed with a printed register. Serif text with small caps;
a monospace for everything structural (times, labels, nav); the day's or week's
services held inside **one bounded rectangle** ("the board"). Warm paper, one sage
accent, hairlines and thin rules — never boxes-within-boxes or shadows. Light by
default; an "evening" palette follows `prefers-color-scheme` and a manual toggle.
It should read on a phone in a chapel doorway and print as a clean sheet.

The **service entry** is the atom: it is identical on the Tonight view, the This-week
grid, and a chapel page. Design it once.

## 2. Files

| Path | What |
|---|---|
| `index.html` | shell; loads `assets/fonts.css`, the site CSS, the ES-module JS |
| `assets/fonts.css` + `assets/fonts/*.woff2` | self-hosted fonts (below) |
| `assets/style.css` | tokens + components (currently `design/style.css`) |
| `assets/app.js` (+ modules) | routing, data fetch, render, the theme toggle |
| `design/tonight.html`, `design/week.html` | **reference mocks** — the built views must match these |
| `design/style.css`, `design/app.js` | the reference stylesheet / enhancement layer, to be promoted to `assets/` |

The site fetches `data/index.json` then the relevant `data/terms/<id>.json` at
runtime and renders. No build step. All paths relative (Pages sub-path).

## 3. Typefaces

Self-hosted from Google Fonts (all OFL), **latin + latin-ext** subsets,
`font-display: swap`. Files live in `assets/fonts/` named
`<family>-<weight>[i]-<subset>.woff2`; `@font-face` blocks in `assets/fonts.css`.
Regenerate with `scratchpad`-style script from Google's `css2` output if weights
change.

| Family | Role | Weights held | Fallback stack |
|---|---|---|---|
| **Spectral** (Production Type) | reading text, service kind (italic), the date | 400, 400i, 500, 600 | `"Spectral","Iowan Old Style",Georgia,"Times New Roman",serif` |
| **Spectral SC** (Production Type) | chapel names, masthead — a *real* small-caps family, not synthesised | 500, 600 | `"Spectral SC","Spectral","Iowan Old Style",Georgia,serif` |
| **Spline Sans Mono** (Studio Triple) | times, nav, slot labels, week line, occasion, dashed tags, footer colophon | 400, 500 | `"Spline Sans Mono",ui-monospace,"Cascadia Mono",Menlo,Consolas,monospace` |

Exposed as `--serif`, `--serif-sc`, `--mono`. The serif/mono split *is* the
signal for "content vs. structure"; keep it strict — the mono never sets reading
text, the serif never sets a label.

## 4. Type scale

Root stays at 16px; body text is set to 19px for a generous read. Sizes as
implemented (`style.css`), rem / approx px:

| Element | Family | Size | Weight | Case / tracking |
|---|---|---|---|---|
| Date / week heading | Spectral | 2.3rem (37) · 1.75rem (28) ≤520px | 500 | — |
| Masthead wordmark | Spectral SC | 1.15rem (18) | 600 | small caps · .05em |
| Chapel name | Spectral SC | 1.16rem (19) | 500 | small caps · .03em |
| Reading text (summary, music values, flag, prose) | Spectral | 19px (body) / `.music dd` 1rem (16) | 400 | — |
| Service kind | Spectral italic | 1rem (16) | 400 italic | — |
| Day-nav arrows ‹ › | mono | 1.3rem (21) | 400 | — |
| Time (gutter) | mono | .8rem (13) + `.m` .63rem | 500 | — |
| Nav items | mono | .67rem (11) | 400 | uppercase · .06em |
| Slot labels, column header, occasion, tags | mono | .58–.65rem (9–10) | 400 | uppercase · .04–.1em |
| Source line, preacher, footer prose | Spectral | .8–.83rem (13) | 400 | — |
| Footer colophon | mono | .68rem (11) | 400 | — |

Reading measure is capped (`.music`, `.flag` ≈ 43–44rem) even though the board is
~57rem, so lines never run too long.

## 5. Spacing

No formal 8px grid; the rhythm is set by these repeated values (rem):

- **Page**: `.sheet` max-width **57rem** (68rem for the week grid only), centred;
  body padding `1.9rem 1.4rem 3rem` (`1.5rem 1rem 2.5rem` ≤520px).
- **Board**: 1px frame; the date band and column header padded `~1.05rem 1.15rem`.
- **Entry**: time gutter is a fixed **5rem** column (3.7rem ≤520px) with a 1px
  right rule; body padded `1.05rem 1.15rem`. Dividers between entries are 1px
  hairlines; the board frame, column rule, date/header/footer rules are 1px `--rule`.
- **Within an entry**: chapel→kind inline; `.choir`/`.occ`/`.summary` stack at
  `.2–.4rem`; the disclosure sits `.8rem` below; the expanded `.music` block opens
  with a `.9rem` top margin and a 1px `--rule` divider.
- **Music rows**: label column **6.6rem**, `.28rem` vertical padding per row, no
  per-row rules (row-gap only). Collapses to label-over-value ≤520px.
- Vertical space between major regions (masthead / nav / board / footer): `1.4–1.7rem`.

Keep it tight, not lavish — the content should not sit below the fold on a phone.

## 6. Colour tokens

Defined on `:root` (light); the evening palette is applied under
`@media (prefers-color-scheme: dark)` to `:root:not([data-theme="light"])` and
under `:root[data-theme="dark"]`. Never define a colour only inside a media / theme
block. `body` and `.board` always paint an explicit background.

| Token | Light | Evening | Use |
|---|---|---|---|
| `--paper` | `#F1EEE3` | `#191813` | page ground |
| `--board` | `#F1EEE3` | `#211F19` | the bounded feed rectangle (lifts a hair in the dark) |
| `--ink` | `#22201A` | `#E9E3D4` | body text |
| `--mid` | `#6C685C` | `#9C9585` | service kind, said / not-published rows, footer, clock |
| `--faint` | `#8A8474` | `#847D6D` | slot labels, column header (~3.3 : 1 — see §12) |
| `--hair` | `#D8D3C4` | `#37332A` | dividers between entries |
| `--rule` | `#C3BDAB` | `#453F34` | board frame, column rule, date / header / footer rules |
| `--accent` | `#83A07E` | `#93B38D` | sage — flag left-bar, nav underline, tint base, today marker |
| `--accent-ink` | `#4F6B4C` | `#AEC9A8` | sage text — occasion, links, disclosure, clock highlight |
| `--accent-tint` | `rgba(131,160,126,.12)` | `rgba(147,179,141,.13)` | background of an expanded entry / the "today" column |

Sage rather than a red or blue: a muted liturgical green that belongs to chapels
without being Oxford blue or a rubric red.

The **theme toggle** (`.toggle` in the masthead) shows the theme you'd switch *to*
— `☾` in day, `☼` in evening — updates its `aria-label` to match, respects the
system setting until first click, then remembers the choice in `localStorage`.

## 7. Layout skeleton

```
.sheet (max 57rem, centred)
  .masthead   wordmark (Spectral SC) · right: clock (mono) + ☾/☼ toggle · 1px rule under
  nav         four ruled cells (Day · Week · Chapels · Find music);
              active cell = --accent-tint fill + --accent underline
  .board      1px --rule frame:
    .datehead   ‹ [date or week] ›  +  .wk line (mono caps; occasion in --accent-ink)
    .colhead    TIME | SERVICE & MUSIC  (mono caps; Tonight & chapel pages only)
    .feed       the entries / the week grid
    .awaiting / .weeknote   trailing note about chapels whose lists aren't in
  footer      one sentence (Spectral) + mono colophon incl. "about & sources" · 1px rule over
```

Nav is four items only; no hamburger, no "About" in the bar (it lives in the footer
colophon). `Find music` stays in the nav even while deferred — see §9.

## 8. The service entry

The atom. Grid: `[5rem time] [1fr body]`, 1px right rule on the time cell, 1px
hairline under the entry.

**Collapsed**

```
6.00  KEBLE COLLEGE · Choral Evensong
 pm   [sung by … / (Choristers)]           ← from the list's own wording only
      GREGORY DIX, 1952                     ← occasion, mono caps, --accent-ink, if present
      Walmisley in D minor · Bainton, And I saw a new heaven   ← summary
      PREACHER  The Revd …                  ← if present
      FULL MUSIC LIST                       ← disclosure (mono, --accent-ink, underlined)
```

- **Chapel** in small caps; **kind** in italic after a middot. The kind is the
  list's own title verbatim (`"Choral Evening Prayer (Choristers)"`), not a
  normalised type. On a dense overview (week grid) the plain `type` may be shown
  instead — see §9.
- **Summary** = the two things people choose on: canticles/setting · anthem/motet.
  Prefer `composer, title` where the structured fields exist; fall back to the
  verbatim `text`. Titles in italic.
- `time` `null` → show `—` in the gutter and, if the venue has a known pattern, a
  note ("usual Tuesday time"); never invent a clock time.

**Expanded** — the summary is replaced by the full list; a 1px `--rule` divider,
then `slot → value` rows (mono label, serif value), then:

```
       HYMN        NEH 114
       ORGAN       Buxtehude, Kommt her du mir, BuxWV 201
       …
       ┃ Keble's list labels only the responses and psalm; the other slots
       ┃ here are our reading of an unlabelled list.        ← flag (§8.1)
       Keble College music list — fetched 2 Sept 2026, p. 6 ← source line
       CLOSE
```

- Slot label = the controlled `slot`, uppercased; for `slot: "other"` use the
  list's own `label` ("Antiphon", "Organ", "Final Responses").
- Value = `composer, title` if present, else verbatim `text`. A `"FIRST
  PERFORMANCE" / première` note rides the value as a small mono tag
  (`.music .first-perf`).
- The whole expanded entry gets `--accent-tint` behind it, so an open service is a
  clearly bounded region within the board.
- **Source line** is always shown when expanded: linked list title + `fetchedAt` +
  `locator`. Never show `parserNote`.

### 8.1 Markers (honesty)

| Case | Data | Treatment |
|---|---|---|
| **Interpreted content** | `confidence: "low"` (or slots assigned by position) | `?` after the chapel name (`.entry.lowconf`), in `--accent-ink`; plus a **flag** — our own one-sentence explanation with a 3px `--accent` left bar, italic. Never the raw `parserNote`. `confidence: "medium"` gets the flag but not the `?`. |
| **Said service** | `type: "said-evensong"` / `musicStatus: "no-music"` | `.entry.said`: chapel + kind in `--mid`; summary "Spoken; no music sung", italic. No disclosure. |
| **Service known, music not out** | `musicStatus: "not-yet-published"` | summary line "music not published yet", `--mid`; no disclosure. |
| **Whole venue's list not out** | `venueStatus.status` ∈ `not-yet-published`, `not-found`, `not-parsed` | `.entry.ghost`: greyed; a dashed mono tag **`LIST NOT PUBLISHED`**; if the registry has a pattern, one muted sentence ("usually sings Choral Evensong at this time on Tuesdays") — clearly a pattern, not a claim about today. |
| **Nothing recorded for a day** | no service objects | the day simply has no entry — **not** a "cancelled" or "no service" row. The day view shows the empty state (§11). |

## 9. The views

### Tonight (`design/tonight.html`)

The default screen; answers "what's on tonight and what are they singing" with no
tap. `.datehead` = **`‹ Tuesday 12 May ›`** (day arrows, mono, 1.3rem) + `.wk`
line (`3rd Week · Trinity Term 2026`; the day's feast in `--accent-ink` if any).
Then `.colhead`, then the feed (entries earliest first). Trailing `.awaiting`
sentence counts venues whose lists aren't in.

**Day selection.** The default is this view with the date = today. The arrows step
one day; the date is itself a control — clicking it opens a picker over the term's
weeks (`scripts/oxweeks.mjs` does the arithmetic), and the picker head pages ‹ ›
across the adjacent terms. Each day-cell in **Week** links here. When the date is
not today a mono **"Today"** link sits by the arrows. The nav cell reads **"Day"**
— it is only a mode switch; the date band is the navigator. If the shown day falls
outside weeks −2..10 the `.wk` line reads **"Vacation"** in place of the week name.

### Week (`design/week.html`)

A **seven-column grid**, Sun–Sat, inside the board (`.sheet` widened to 68rem for
this view only). Each column: a `.colday` header (`Sun 10`; the feast under it in
`--accent-ink`; min-height so headers align), then service **chips** stacked by
time. A chip = mono time · small-caps chapel (short name) · italic kind (plain
`type` here, not the full title) · a 2-line-clamped music line
(`canticles/setting; anthem`). `.col.today` gets `--accent-tint` + an `--accent`
underline on its header. Columns divided by 1px `--rule`; ragged column bottoms are
fine (it's a calendar).

**Below ~820px the grid becomes a stacked list** — `.wgrid{display:block}`, each
`.col` a full-width day-block with its header as a section divider, chips
full-width and unclamped. This is the phone view; it reads like the Tonight feed.

Week arrows step one Oxford week; `.datehead` h1 = `3rd Week of Trinity`, `.wk` =
`Sun 10 – Sat 16 May 2026`. The h1 is a picker control: it opens a plain list of
the term's weeks (`.wlist` — week name + `Sun 10 – Sat 16 May` span per row; the
shown week gets a 1px accent frame over `--wk-sel`; the real current week, when
different, carries a mono "this week" tag), its head paging ‹ › across terms.
The list runs weeks 0–8, widened to any week that actually holds a service. Out
of weeks −2..10 the h1 reads **"Vacation"** with the date span still in `.wk`. A
mono **"This week"** link on its own line under the arrows returns to the current
week.

### Chapels (list + chapel page)

**List**: the ~30 venues, each a row — small-caps name, choir name + type
(`boys-and-men` / `student-mixed` / …), the one-line `typicalPattern`, and a
status chip if their list isn't in. Grouped college / hall / cathedral / church or
plain alphabetical (build decides; alphabetical is fine).

**Chapel page** — a **chapel header** block, then that chapel's term services:

```
MAGDALEN COLLEGE                                    ‹ back to chapels
Magdalen College Chapel · The Choir of Magdalen College (boys & men)
High Street, Oxford OX1 4AU
Choral Evensong daily except Monday at 6.00pm (Tue Choristers; Fri
Clerks; Sat Consort of Voices); Sunday 11.00am Sung Eucharist.
All welcome.                                        MUSIC LIST ↗
─────────────────────────────────────────────────────────────────
[ ‹ 3rd Week of Trinity › ]        ← same week nav as This week
   SUN 10 MAY
     6.00 pm  Choral Evensong   Bairstow in D · Moore, All wisdom …
   …
```

Header uses: `venues.json` `name`, `chapel`, `choir.name`, `choir.type` (spelled
out), `address`, `typicalPattern` (prose, as written), `access` (if present),
`musicList.url` (the "MUSIC LIST ↗" link — the chapel's own page, opens in a new
tab). The service list below is the **same entry component**, grouped by day within
the chosen week, week-navigable. If the venue's list isn't in, the body is the
"list not published" state with its status and `note`.

### Find music

Built in v1 as a **basic** search: a box over `?view=search&q=`, matching the
query (case- and accent-insensitive) against `music[].text`, `composer` and
`title` for every held term, results grouped by date, each a link to that day's
Tonight view with the service expanded. **Filters** (chapel / week / service type)
and past-term search are deferred — see `docs/later.md`.

## 10. Empty & edge states

| State | Copy | Style |
|---|---|---|
| No services on a day | "Nothing sung in Oxford on Tuesday 12 May." + mono sub "the college chapels are in vacation" / "no lists record a service today" | `.empty` — centred, italic, `--mid`, inside the board |
| Whole week empty (vacation) | "3rd Week of Trinity is outside Full Term — no sung services." — or, past weeks −2..10, "No sung services — this week falls outside term." with the head reading "Vacation" | `.empty` |
| Term not yet published | "Michaelmas 2026 lists are not out yet." + link to the most recent term we hold | `.empty` |
| Data fetch failed | "Couldn't load the services just now." + a retry link | `.empty`; never a blank board |
| A chapel with no list all term | the chapel page body = the "list not published" state + `venueStatus.note` verbatim | — |

## 11. Interaction

> **Routing note (build).** The site uses **query parameters**, not the hash
> sketched below: `?view=tonight|week|chapels|chapel|search|about`, `?date=`,
> `?venue=`, `?q=`, `?open=<serviceId>[,…]`, plus `?now=` and `?theme=`. The path
> never changes, so it still works as static files under the Pages sub-path. The
> `#…` forms below are superseded; the behaviour they describe is unchanged.

- **Expand / collapse** a service: click anywhere on a collapsed entry, or the
  `FULL MUSIC LIST` / `CLOSE` control. State is in the URL (`?open=<serviceId>`), so
  an expanded service is linkable and survives reload. One entry open at a time is
  not required — multiple may be open.
- **Day / week navigation**: arrows and the date-picker change the query
  (`?date=2026-05-12`, `?view=week&date=…`, `?view=chapel&venue=magdalen&date=…`).
  No server config, works under the Pages sub-path.
- **Theme toggle**: as §6.
- **Keyboard**: entries and controls are real `<button>` / `<a>`; visible focus
  ring; the grid chips and day headers are links.
- **Hover**: a collapsed entry and a grid chip take a faint `--accent-tint` on
  hover; nothing else moves.

## 12. Motion

- Expand / collapse: a height/opacity transition ≤ 150ms, `ease`. Nothing else
  animates.
- Respect `prefers-reduced-motion: reduce` — instant, no transition.
- No scroll-triggered anything, no parallax, no fades on load.

## 13. Print

`@media print` (in `style.css`): palette forced to black on white, `--accent`
→ black, tint → transparent; the toggle, nav, disclosures and day-nav arrows are
hidden; **every service prints expanded** (the build must serialise open state for
print, or print-styles force `.music` visible); `.entry` and `.music` use
`break-inside: avoid`; links lose underlines; the board frame goes solid black. A
day or a week should print as a clean order-of-service sheet on one or two sides of
A4.

## 14. Accessibility

- Target WCAG AA. Body text and headings clear it comfortably. **Slot labels /
  column header sit at ~3.3 : 1** (`--faint` on `--board`) — acceptable for
  all-caps scaffolding with the value at full contrast alongside, but if it must
  clear 4.5 : 1, darken `--faint` to `#7B7565` (light) / `#948C7B` (evening).
- `lang="en"`; one `<h1>` per view (the date / week / chapel name); nav is a
  `<nav>` with `aria-current` on the active item.
- The `?` marker has an accessible label ("interpreted from an unlabelled list");
  the dashed tag is real text.
- Works without JavaScript for the core "what's on today" read: the server-less
  site renders the current day and week from the fetched JSON; expand/collapse and
  the picker are progressive enhancement (a no-JS expanded view falls back to
  showing all music inline).

## 15. What this design refuses to do

- **No cards.** No box around a single service, no shadow, no rounded corners, no
  raised tiles. Structure is the one board frame + hairlines.
- **No hero, no masthead art, no "welcome" copy.** The content is the interface.
- **No hamburger menu** for four links; no mega-nav; no sticky header.
- **No icon set.** The only glyphs are the theme `☾/☼`, the day arrows `‹ ›`, and
  a `↗` on an external link.
- **No second accent colour.** Sage does occasion, links, the flag bar, the "today"
  marker — nothing gets its own hue.
- **No Oxford blue, no crest, no heraldry, no college shields**, no gothic display
  face, no "dreaming spires" photography.
- **No colour-coding by chapel, choir type, or service type.** A Eucharist and an
  Evensong look the same; you read which it is.
- **No infinite scroll, no "load more", no pagination** — a day or a week is a
  finite, bounded list.
- **No tracking, no analytics, no cookie banner, no fonts or assets from a CDN**,
  no third-party embeds. Everything self-hosted.
- **No guessing.** Unknown is shown as unknown; interpreted content is marked;
  `parserNote` is never surfaced.
- **Never invent a service** to fill an empty day, and never show a pattern-derived
  time without saying it's the usual pattern.

## 16. Open for the build

- Promote `design/style.css` + `design/app.js` to `assets/`; write `index.html` and
  the render/routing modules.
- Chapels list grouping (alphabetical vs. by kind) — decide when building it.
- The date-picker widget: the **Day** view opens a term-week calendar grid (real
  "today" ringed, days with a service dotted, month shown at boundaries); the
  **Week** view opens a plain list of the term's weeks with date spans (shown
  week framed, current week tagged). Both heads page ‹ › across terms, and both
  cover weeks 0–8 widened to any week that holds a service (`pickerWeekRange`).
- Exact `prefers-reduced-motion` fallback for the expand.
- Whether the desktop day view ever grows a right rail (week strip) — currently no;
  the board is centred and that's enough.

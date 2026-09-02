# Design directions — history

The definitive spec is **`docs/design-brief.md`**. This file just records how we got
there, so the rejected ideas aren't re-proposed.

| Round | Options | Outcome |
|---|---|---|
| 1 | **A** *Termcard* (EB Garamond, warm paper, rubric red) · **B** *The Evening* (Spectral, evening-timeline spine) · **C** *Listings* (Newsreader, run-on paragraph per service) | A favourite; B, C dropped. A's colour felt generic, page furniture underdone, margins too wide. |
| 2 | **D** *Noticeboard* (Overpass + mono, vermilion, visible grid) · **E** *Concrete* (Fraunces, monumental) · **F** *Terminal* (Space Mono, monochrome, key-value) | D had potential but too brutalist / colour too extreme. E, F rejected. |
| 3 | **G** *Bulletin* (Hanken Grotesk + mono, brick) · **H** *Order of Service* (Newsreader + mono, small-caps chapels, pine green, no reversed bars) · **I** *Broadsheet* (Source Serif + Archivo, ochre) | **H chosen** — pastel, neat unobtrusive rectangular borders, D's structure + A's typographic voice. |
| 4 | **H1** *Ledger* (Source Serif 4 + Plex Mono, cool blue) · **H2** *Register* (Spectral + Spectral SC + Spline Sans Mono, sage, column-header row) · **H3** *Printed page* (Newsreader + DM Mono, rose) | **H2 chosen.** |
| 5 | Dark mode built; week view mocked as stacked vs. grid | **Light + evening palette both.** **Grid** week view. Day-nav arrows enlarged; theme toggle icon swaps (moon in day, sun in evening). |

Reference mocks: `design/tonight.html`, `design/week.html` (+ `style.css`, `app.js`,
self-hosted fonts in `assets/`). Screenshots in `design/screens/`.

### Things tried and rejected — do not re-propose

- An evening/dusk *timeline* (services on a vertical time-rule) — B.
- Run-on "listings paragraph" service entries — C.
- Loud/brutalist palettes: vermilion, minium, pure black bars, monochrome-only — D/E/F.
- Reversed (white-on-dark) top bars in the light theme — G kept one, H dropped it.
- Splitting "(Choristers)" / "(Cantors)" out of the service title into a separate
  "sung by" line — that field is for genuine *visiting* choirs only; the list's own
  wording stays verbatim in the title.
- A stacked (non-grid) week view — considered in round 5, grid chosen.

# Design brief

> Stub. To be written properly in the UI phase, before any HTML/CSS is committed.

## Intent

Elegant and stripped back; **not** cliché-minimalist. The site should feel like a
well-set printed service sheet — quiet typography, generous space, a clear
hierarchy of day → service → music — not a dashboard and not a wall of cards.

## Fixed constraints (see `docs/decisions.md`)

- Plain HTML/CSS/JS, no framework, no build. Works under a GitHub Pages sub-path.
- Renders `data/` only. Shows source attribution and flags low-confidence entries
  honestly; never shows `parserNote` as body text.
- Legible on a phone in a chapel doorway; works without JavaScript for the core
  "what's on today" view if reasonably possible.

## To decide here

Typeface(s); colour (likely near-monochrome with one accent); how a term / week /
day is navigated; how "no service today" reads; how music lists are laid out; how
`confidence` and "list not yet published" are shown; dark mode.

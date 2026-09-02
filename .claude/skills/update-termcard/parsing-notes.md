# Parsing notes

The memory between terms. How each venue's music list is laid out, the
heading→slot map to use, and the traps. **Update this file at the end of every
run** (SKILL.md step 11) with anything new — a heading you hadn't seen, a venue
that moved, a feast that changed a service type.

Read alongside `docs/data-schema.md` (the vocabularies) and `docs/sources-survey.md`
§3/§6 (per-venue URL schemes and known awkwardness).

---

## General

### Recognising the week header

| Style | Seen at |
|---|---|
| `THIRD WEEK` (all caps, own line) | Magdalen, Wadham (`FIRST WEEK`), University College (`WEEK 1`) |
| `Week 3` | St John's, Balliol |
| `Third Week – 10 May` | Oriel |
| `| 3rd Week` after a calendar date | Jesus |
| `(3rd week)` / `(Week 3)` in parentheses after the date | Merton, Lincoln, Corpus Christi |
| `W3` | Regent's Park |
| week + day table at the front, entries by day only | New College |
| calendar date only, no week printed | Trinity (has `Week N` too), Christ Church, Pusey House, University Church |

When the list gives **only a calendar date**, get the week/day from
`weekDayForDate(termId, isoDate)` and use the date as-is. When it gives **week +
day**, get the date from `dateForWeekDay(termId, week, day)`. When it gives
**both**, compute from the week+day and assert the printed date matches; a
mismatch is `confidence: "low"` with a `parserNote`.

Oxford weeks: run `scripts/oxweeks.mjs`, never do the arithmetic by hand
(SKILL.md step 5).

### `pdftotext -layout` damage

- **Ligature loss.** `tt`, `ﬀ`, `ﬁ`, `ﬂ` sometimes vanish or become a space:
  Merton prints `Se ing` (Setting), `Dimi is` (Dimittis), `Magniﬁcat`, `E ﬂat`.
  For Merton and Magdalen, **read the PDF directly with the Read tool** and only
  use the `.txt` to cross-check.
- **Magdalen mangled punctuation/accents:** `Õ`→`'`, `Ž`→`é`, `ˆ`→`à`, `•`→`è`,
  `Ð`→`–`. `MajestŽ du Christ ... ˆ son P•re` = `Majesté du Christ … à son Père`.
  Read the PDF directly and transcribe the real characters.
- **Multi-column lists** (Jesus, Balliol, Lincoln, Trinity, Oriel, Wadham,
  St Edmund Hall, Hertford): `-layout` interleaves the columns left-to-right per
  row, which scrambles reading order. Read the PDF directly with the Read tool,
  or run `pdftotext` *without* `-layout` for order and cross-check names against
  the `-layout` output.

### Composer / work order varies by venue — `text` is always verbatim

- `Composer Work` — Magdalen, New College, Wadham (`Rutter, This is the day`)
- `Work Composer` — Merton (`Missa de la batalla escoutez Guerrero`), Jesus (two
  columns: work left, composer right), Trinity
- `Composer, Work` — Keble (`Widor, Adagio from Symphonie No 5`), Balliol,
  St Edmund Hall (`Bach, Prelude in F major BWV 556`)
- `Work, Composer` — University College (`'Tis the day of Resurrection, Charles
  Wood`), Exeter (`Setting: Missa brevis in Bb K275 Mozart` — composer last, no
  comma)

Fill `composer`/`title` only when the split is unambiguous for that venue. They
are extras; if in doubt leave them off and keep everything in `text`.

### Canonical heading → slot map

| List heading (any case) | slot |
|---|---|
| Introit | `introit` |
| Prelude, Organ (piece *before* the service), Voluntary before | `other`, `label` = the printed heading (`"Prelude"`, `"Organ"`) |
| Preces, Responses, Preces and Responses, Preces & Responses | `responses` |
| Final Responses, Concluding Responses | `other`, `label` `"Final Responses"` |
| Office Hymn | `office-hymn` |
| Hymn, Hymns, Processional Hymn, Recessional Hymn | `hymn` |
| Psalm, Psalms, Psalm(s) | `psalm` |
| Canticles, Evening Service, Service in <key>, (Mag + Nunc given together) | `canticles` |
| Magnificat / Mag (given separately, e.g. own composer) | `magnificat` |
| Nunc Dimittis / Nunc (given separately) | `nunc-dimittis` |
| Anthem | `anthem` |
| Motet, Communion Motet | `motet` |
| Mass, Mass Setting, Setting, Communion Service, Missa … | `setting` |
| Gradual, Alleluia, Tract, Sequence, Antiphon, Introit-proper | `other`, `label` = printed heading |
| Voluntary, Postlude, Organ (piece *after* the blessing), Sortie | `voluntary` |
| Reading(s), Lessons, Sermon, Preacher, Address, Collection | **not in `music[]`** — `preacher` goes on the service; the rest is dropped |

Anything not in the table → `slot: "other"` with the list's heading in `label`.
Add a new row here when you resolve one.

### Verbatim abbreviations — keep exactly

`NEH`, `EH`, `AM`, `NEH`, `CP`, `A&M`, hymn number lists (`436, 305, 420`,
`169 (Tune II)`, `130 (i)`, `598i`, `219 (t.207)`, `130: 1,2,6,7`), psalm pointing
(`66.7-end`, `69: 1-22`, `118 v. 14-24`, `139.1–11`), chant/tune attributions in
brackets (`23 (Crimond)`, `Psalm: 23 (Hylton Stewart)`), and Lincoln's
`TITLE (number) TUNE NAME` hymn lines.

### Responses / Preces

"Preces and Responses", "Preces", "Responses" all → slot `responses`. A separate
"Final Responses" / "Concluding Responses" line → `other` with `label` `"Final
Responses"`. Some lists give responses composer as a bare surname (`Radcliffe`,
`Smith`, `Ayleward`) — that is the whole `text`.

### Psalm chant attributions in brackets

Kept inside `text` (`23 (Crimond)`). Do **not** split the chant composer into
`composer` — the psalm number is the point.

### Hymns as numbers

Keep the number(s) and any hymnal prefix / tune note verbatim in `text`
(`NEH 124, 117, 285`). `composer`/`title` stay empty for hymn lines.

### Voluntaries / preludes / organ

A piece printed **after** the blessing (Voluntary, Postlude, Sortie, "Organ" at
the end) → `voluntary`. A piece printed **before** the service (Prelude, "Organ"
at the top, an organ Introit) → `other` with `label` as printed. Wadham prints
both a `Prelude` and a `Postlude`/`Voluntary`; keep them distinct.

### Feast days that change the service type

Ascension Day, Corpus Christi, a patronal feast, Pentecost: the evening service is
often a **Choral Eucharist / Sung Mass / Communion** even where the venue's normal
pattern is Evensong. Set `type: "choral-eucharist"` and use a `setting` slot. The
list's own wording goes in `title`. Lessons & Carols, a Requiem, a Commemoration,
an outdoor "Jazz mass", a Confirmation service → `type: "special"`, wording in
`title`.

### Visiting choirs vs the venue's own sub-groups

`choir` is set **only** when the singers are a different institution's choir
("Sung with choir from St Edward's School", a joint service with Winchester and
Eton, a visiting cathedral choir). The venue's own Choristers / Academical Clerks
/ Consort of Voices / Girl Choristers / Chapel Choir Consort / Pusey Singers are
**not** a different choir — leave `choir: null` and put the wording in `title`
(`"Choral Evensong (Consort of Voices)"`).

### A list that omits a day vs one that marks a day "no service"

- **Omits** the day (nothing printed): produce **no record**. Wadham deliberately
  lists only the weeks that have a full Choral Evensong — the missing weeks are
  simply absent, not an error.
- **Marks** the day said / "no choir" / "Said Evensong": produce a record with
  `type: "said-evensong"` (or the printed type) and `musicStatus: "no-music"`.
- The service is known to be sung but the list prints **no music** for it (a bare
  "Choral Evensong, 6pm" line, common for Compline and for term-card-style lists):
  record it with `musicStatus: "not-yet-published"` and `music: []`.

### Non-service items to skip

Said Morning Prayer / Mattins / Midday Prayer / Evening Prayer, said Eucharists,
organ recitals, lunchtime concerts, chamber concerts, "Madrigals from the tower /
Chapel roof" (May Morning), OICCU / student-group prayers, discernment sessions,
open-day talks. Record them only if the list explicitly says the choir sings a
service.

---

## Per venue

Order follows `data/venues.json`. `format: "none"` venues (Brasenose, Mansfield,
Harris Manchester, Pembroke, St Stephen's House) are out of scope — status
`no-list`.

### christ-church — Christ Church Cathedral

- **Monthly, not termly.** A fresh "Services and Music" PDF each calendar month,
  linked from `chch.ox.ac.uk/cathedral/worship-and-music`, path
  `/sites/default/files/<yyyy-mm>/Music List <Month><yy>…pdf`. A term spans **3
  months** (e.g. TT26 = 26 Apr–20 Jun → April, May, June PDFs). Fetch each, name
  them `christ-church-<yyyy-mm>.pdf` under `sources/<termId>/`, record all three
  URLs in the venueStatus `note`.
- Cathedral term follows **Cathedral School terms**, wider than Oxford Full Term —
  services will exist before 1st Week and after 8th Week. Record what the list
  shows; the site clips to the term window.
- By calendar date; day / date / time (usually **18:05**); headings Introit /
  Responses / Canticles (or Setting) / Anthem / Voluntary, plus preacher and
  which choir. **Monday is said Evening Prayer** → `said-evensong`,
  `musicStatus: "no-music"` (or omit if not printed). Sunday 11:05 Sung Eucharist
  + 18:05 Evensong. Frideswide Voices (girls) usually Wednesday — the venue's own
  foundation, `choir: null`, note in `title`. Christ Church College Choir on
  alternate Mondays in Oxford term — also the foundation's, `choir: null`.
- Text extracts cleanly.

### magdalen — Magdalen College

- Termly PDF "Chapel Services and Music", `magd.ox.ac.uk/…/services-and-music-list/`
  → `/wp-content/uploads/<yyyy>/<mm>/Chapel-Services-Music-List-<T><yy>.pdf` (the
  upload folder date is unrelated to the term). ~24 pp.
- **Read the PDF directly** — the text layer mangles accents and the superscript
  `M` mark (see General → pdftotext damage).
- By Oxford week + day, each service with its own time (`6.00 pm`). Headings:
  `MASS` → `setting`; `HYMNS` → `hymn`; `ALLELUIA`/`ANTIPHON`/`CANTICLE` → `other`
  with that label; `INTROIT`/`RESPONSES`/`PSALM`/`CANTICLES`/`ANTHEM`/`MOTET`/
  `VOLUNTARY`/`NUNC DIMITTIS`/`MAGNIFICAT` as named; `FINAL RESPONSES` →
  `other`/`Final Responses`; `PREACHER` → `service.preacher`; `READINGS` dropped.
- Superscript `M` after a composer = a Magdalen connection — **drop it** from
  `text`. `FIRST PERFORMANCE` / `FIRST LONDON PERFORMANCE` marker against a line →
  put in the service `notes` (not `music[]`).
- Pattern: Evensong daily except Monday 18:00; Tue "Choral Evening Prayer
  (Choristers)"; Fri "(Clerks)"; Sat "(Consort of Voices)" — all the foundation's
  own, `choir: null`, keep the bracket in `title`. "Choral Evening Prayer" →
  `type: "choral-evensong"`. Sun 11:00 Sung Eucharist. Compline (Cantors) some
  weeks → `compline`.

### new-college — New College

- Termly PDF "Chapel Music List". **Hosting moves term to term:** college site
  `new.ox.ac.uk/choir-and-chapel` (shows "(forthcoming)" between terms) *or* the
  choir's own site `newcollegechoir.com/choralservices` (TT26 was here — link "26b
  Trinity Music list" → `/attachments/download.asp?file=<n>&type=pdf`). **Check
  both.** ~20 pp, "NOT TO BE REMOVED FROM THE CHAPEL".
- Front matter has a **"Regular service times"** table — use it for `time`
  (Sun 17:45, Mon 18:15 "sung by the Clerks", Tue 18:15, Thu 18:15 "Evensong or
  Choral Vespers", Fri 18:15, Sat 17:45 "Evensong or Sung Eucharist"; **no
  Wednesday**). Time from this table → `confidence: "medium"`, `parserNote: "time
  from the list's regular-times table"`.
- Compline sung in 2nd and 5th Weeks only → `compline`. Half-term week (dates
  printed, e.g. 23–29 May) sung by the Clerks — the foundation's own, `choir:
  null`, note in `title`/`notes`.
- Visiting: joint services with other institutions' choirs (Winchester & Eton for
  the "Amicabilis Concordia") → `choir: "Visiting: Choirs of Winchester College
  and Eton College"` or as printed. "Cantata Vespers" → `type: "other"`, title
  verbatim. Superscript `NC` = New College composer — **drop** from `text`.
- Headings: Responses / Psalm(s) / Canticles / Anthem / Introit / Motet / Hymn /
  Voluntary.

### merton — Merton College

- Termly "Services and Music Booklet" PDF from `/api/files/file/<opaque>.pdf`
  (name changes each term — **scrape** `merton.ox.ac.uk/chapel-services** for the
  link). A separate lighter "Chapel Card" (`ChapelCard<T><yy>.pdf`) has preachers.
- **Read the PDF directly** (ligature loss: `Se ing`, `Dimi is`, `Magniﬁcat`).
- By Oxford week + day, per-service time. Headings: Introit / Responses /
  Psalm(s) / Canticles / Anthem / Hymn / Voluntary / **Setting** (`setting`) /
  **Motet** (`motet`). Split canticles printed as `Merton Service Esenvalds ;
  Nunc Dimittis in B flat Wood` → `canticles` slot, `text` verbatim including the
  `;` (or split into `magnificat`/`nunc-dimittis` only if the list clearly gives
  two composers — then note it).
- Pattern: Sun 17:45 Evensong or Eucharist; **Mon 18:00 "Choral Vespers"** (Girl
  Choristers; Magnificat only, no Nunc) → `type: "other"`, `title: "Choral
  Vespers"`; Tue 18:15; Wed 18:15 (Girl Choristers); Thu 18:15. Girl Choristers
  are Merton's own — `choir: null`. Their services drop out at school half-term
  (a week simply absent). Work-then-composer order.

### queens — The Queen's College

- Termly combined "Services & Music List" / term card PDF,
  `/wp-content/uploads/<yyyy>/<mm>/<T><yy>-Music-List-Term-Card.pdf` (~16 pp,
  ~13 MB, image-heavy but **text is selectable**). Parallel copy sometimes marked
  DRAFT at `queenschoir.com/music-list`.
- Front "Regular services & recitals": Sun 18:15 Choral Evensong with Sermon,
  Wed & Fri 18:30 Choral Evensong. **Times move per service** — a recording, an
  association evensong, a family guest night all shift the time; read the time
  **per entry**, don't assume the pattern. Special services list is at the front.
- By Oxford week with calendar dates. Headings Responses / Psalm / Canticles /
  Anthem / Introit / Voluntary.

### exeter — Exeter College

- **`.docx`, not PDF** — `/wp-content/uploads/<yyyy>/<mm>/<year>-Trinity-Term-
  Music-List.docx`. `scripts/fetch.mjs` extracts it to `.txt` (paragraphs → lines,
  `<w:tab/>` → tab). The term-card PDF is image-only — ignore it.
- Layout after the front matter: `<WEEK> WEEK`, then per day
  `<dd> <DAY> <feast>` / `<time> <service>` / indented `Heading: value`.
  Headings: `Setting:` → `setting`; `Gradual:` → `other`/`Gradual` (or `motet` if
  it is clearly a sung anthem-gradual — note which); `Anthem:` / `Responses:` /
  `Canticles:` / `Psalm(s)` / `Hymns:` / `Voluntary:` as named; `Readings:` /
  `Preacher:` handled as usual. Composer is the **last token** of the value, no
  comma (`Missa brevis in Bb K275 Mozart`).
- Pattern: Sun 18:00, Tue 18:15, Fri 18:15 (3–4 services/week). `Mattins` and
  `Organ Recital` lines are skipped. Ascension → Choral Eucharist.

### keble — Keble College

- Termly PDF "Chapel Choral Services", fairly stable name
  `/wp-content/uploads/Music-List-<T><yy>.pdf` (some terms `-screen` /
  `-CORRECTED` / `.spreads`). ~12 pp. **Anglo-Catholic**, minimally labelled.
- By date + day + feast. Hymn numbers (`NEH 124, 117, 285`) printed top-right of
  the entry → `hymn`. `Psalm` and sometimes `Responses` are the only other
  labels. The remaining lines are **unlabelled** and assigned by position +
  Anglo-Catholic convention — **every such service is `confidence: "low"` or
  `"medium"` with a `parserNote`**:
  - a piece at the top before the setting → `other`/`Organ`
  - the Mass / service setting (`Langlais, Messe Solennelle`, `Bingham, Oriel
    Service`) → `setting` (Eucharist) or `canticles` (Evensong)
  - Latin choral items (`Duruflé, Tantum ergo`, `Handl, Domine rex…`) → `motet`
  - an English choral item → `anthem`
  - the closing organ work → `voluntary`
- `Composer, Work` order. Pattern: Sun 17:30 Sung Eucharist ("- CORPORATE
  COMMUNION" appended to `title`), Tue 18:00 Choral Evensong, Thu 21:00 Sung
  Compline (plainsong) — Compline often just two lines (Nunc setting + a motet).
  Organ recitals before Compline are skipped.

### st-johns — St John's College

- Termly "Chapel Termcard" PDF, `/documents/<id>/<Term>_<Year>_termcard_<n>.pdf`
  (**scrape** `sjc.ox.ac.uk/…/chapel-and-choir/` — id + name change each term).
  ~2 pp core. **Light on music** — the Sunday section is preacher-led.
- Sunday 18:00 "Sung Evensong with address" → `type: "sung-evensong"` (choral
  with hymns + a 10-minute address). Wednesday 18:15 "Choral Evensong" (fully
  choral, no address) is the choir's main service → `choral-evensong`.
- If the termcard gives an anthem / canticles, record them; if it gives **no
  music** for a service, record the service with `musicStatus: "not-yet-published"`
  and `music: []`. Mid-term Communion (Wed of ~5th Week, 18:00) → `choral-eucharist`
  if sung. Said Morning Prayer / said Monday Eucharist / RC termly Mass skipped.

### worcester — Worcester College

- "Services and Music" PDF, `/wp-content/uploads/<yyyy>/<mm>/<T><yy>-Services-and-
  Music-final.pdf` — **image-only, no text layer** (`fetch.mjs` will report POOR,
  ~8 chars/page). The "Chapel Card" (`<T><yy>-Chapel-Card.pdf`) is text but has
  **no music**.
- Until OCR or manual entry: **status `not-parsed`**, `note` = "image-only PDF,
  needs OCR or manual entry; Chapel Card carries preachers only". Keep any
  previous run's services (merge).
- Pattern (for when it is done): Sun 18:00 Evensong, Mon 18:00 Choral Reflection,
  Tue 18:00 Evensong, Wed 21:00 Compline (congregational → `no-music`), Thu 18:00
  Evensong/Eucharist. Boy Choristers (CCCS) sing Mon/Tue, adult scholars Sun/Wed/
  Thu — both the foundation's own, `choir: null`.

### somerville — Somerville College

- "Choral Contemplations" themed booklet, `some.ox.ac.uk/our-community/chapel-
  choir/choral-contemplations/` — **image-only PDF**, published irregularly (as of
  the survey the newest was Hilary 2026, no Trinity 2026). The service is a
  non-denominational "Choral Contemplation", **not Evensong** — Mag/Nunc are not
  its core.
- Status `not-parsed` (image-only) or `not-found` (no booklet for the term). If
  ever parsed: `type: "other"`, `title: "Choral Contemplation"`, Sunday 17:30,
  one service a week. Note the scope question in the report.

### balliol — Balliol College

- Termly "Music List" PDF served as `www.balliol.ox.ac.uk/media/<id>/download?inline`
  — **opaque numeric id, changes each term, no term in the URL**. **Scrape**
  `www.balliol.ox.ac.uk/balliol-chapel/chapel-services` for the "You can see the
  music for the term here" link. Use `www.` (the bare host refuses connections).
- By `Week N` + `Sunday <date>` + feast, **two-column** (weeks 1&5, 2&6, 3&7, 4&8
  side by side) — read the PDF directly. Sunday Evensong only, plus the odd
  midweek feast (`Thursday 14 May — Ascension Day – Evensong, 6pm`,
  `Wednesday 10 June — Compline, 9pm`) often printed with **no music** →
  `musicStatus: "not-yet-published"`.
- Headings: Introit / Hymns / Responses / Psalm / Readings (drop) / Canticles /
  Anthem / Preacher; Pentecost is a `Choral Eucharist` with `Mass Setting` →
  `setting`. `Composer Work` order.

### brasenose — `format: "none"`

No standalone music list. Status `no-list`. The TT26 Chapel Term Card has service
+ preacher info but no music. (If a real list ever appears at the foot of the
choir page, add it to `venues.json` and note it.)

### corpus-christi — Corpus Christi College

- "Lectionary & Music List" PDF at `ccc.ox.ac.uk/…/music-list`. **Stale** — as of
  the survey the newest online was **Michaelmas 2023**. Check the page; if only an
  old term is there, status `not-found`, `note` = "no current list published;
  newest online is <term>".
- If a current one appears: by calendar date, Sunday-focused; Psalm / two readings
  / Magnificat + Nunc dimittis settings / Anthem. `Responses` heading is
  `Responses` (slot `responses`); `Psalm(s)` as named. Sun 17:45.

### hertford — Hertford College

- "List of services and music" PDF, `hertford.ox.ac.uk/living-here/chapel/music/`.
  **Often only the previous year's list is up** (survey: newest was TT25); a TT26
  *Chapel Card* exists with no music. If the page's newest music list is not this
  term's, status `not-yet-published` (Hertford does publish, just late), `note`
  with the URL checked and the term of the newest list found.
- When present: by Oxford week + day, per-service time (Sunday Evensong usually
  17:45, sometimes 17:15 or 17:15+Confirmation — **read per service**). Headings
  Hymns / Responses / Psalm / Canticles / Anthem / Voluntary; Thursday 18:00
  Communion with `Mass Setting` → `setting`, `Anthems` (plural) → one `motet`/
  `anthem` per line.

### jesus — Jesus College

- Termly "Chapel Music" PDF, `/wp-content/uploads/<yyyy>/<mm>/Music-list-<T>-<yy>.pdf`
  (+ separate termcard for preachers). ~2 pp, **two-column**, read the PDF
  directly.
- `<Weekday> <date>` / `<feast>  <HH.MM> <service>` on one line, then
  `Heading  value ................ Composer` (composer right-aligned) with the
  Psalm tucked to the right of another row. Headings Responses / Canticles /
  Anthem / Hymns / Psalm / Introit / **Motets** (plural — one `motet` item per
  line). `Work` left, `Composer` right. Time is printed inline (`17.30`, `17.45`,
  `18.30`) — use it. Sun main service; some Tue 18:15 for feasts
  (Commemoration of Benefactors). Ascension → Choral Eucharist.

### lady-margaret-hall — Lady Margaret Hall

- Termly "Readings & Music List" PDF, `/sites/default/files/documents/<yyyy-mm>/…
  Readings&Music.pdf`. ~5 pp. Header: **"Unless otherwise indicated, Friday Choral
  Evensong is at 6 p.m."** → `time: "18:00"`, `confidence: "medium"`,
  `parserNote: "time from the list's header note"` (unless the entry states its
  own time).
- By `Week N`, one Friday Evensong each. `<Friday date> – <occasion>` then
  Responses / Psalm / Readings (drop) / Canticles / Anthem / Preacher / Hymn.
  "Midday Prayer" (Thursdays, said) and discernment sessions are skipped.

### lincoln — Lincoln College

- Termly "Music List" PDF, `/asset/Music-List-<yy>-<T>.pdf` (+ `/asset/Term-Card-
  <T><yy>.pdf`). ~2 pp, **two-column**, read the PDF directly.
- `<Weekday> <date> (Week N)  <feast>` then `Preacher:` (→ service) / `Psalm:` /
  `Responses:` (or `Preces:` on a Chapter Day) / `Canticles:` / `Anthem:` /
  `Hymns:`. Composers carry **life-dates in brackets** — keep them in `text`
  (`Ayleward (1626-69)`). Hymn lines are `TITLE (number) TUNE NAME` — whole line
  verbatim. Sun 18:00 Evensong; occasional midweek (Chapter Day, a joint
  Ascension Communion with Brasenose → `choral-eucharist`, `Mass:` → `setting`).

### mansfield / harris-manchester / pembroke / st-stephens-house — `format: "none"`

No public music list. Status `no-list`. Mansfield (URC) and Harris Manchester
(Unitarian) hold a sung weekly service but publish no repertoire; Pembroke's page
promises a list that isn't there; St Stephen's House has no chapel page at all.

### oriel — Oriel College

- Termly combined term-card + music PDF, filename **`Oriel-<yyyy><a|b|c>-web.pdf`**
  (a = Hilary, b = Trinity, c = Michaelmas), under `/wp-content/uploads/<yyyy>/
  <mm>/`. ~4 pp. Front pages are preacher/theme per week; **the music is on the
  later pages** — read the whole PDF.
- `First Week – 26 April` / `<Sunday-after> ` / theme / preacher. Music headings
  Responses / Psalm / Canticles / Anthem / Voluntary. Sun 18:00 Choral Evensong;
  Wed 18:00 Choral Communion (`setting`). The termly Oriel–Corpus RC Mass and said
  Morning Prayer are skipped.

### st-edmund-hall — St Edmund Hall

- Single "Chapel Term Card" PDF that **is** the music list. Filename has a
  **bullet**: `St-Edmund-Hall-•-Trinity-Term-Card-2026_website.pdf` — URL-encode
  `•` as `%E2%80%A2`. No year/term folder. ~4 pp, **two-column**, read directly.
- `<N>th Week` / `<Weekday> <date> – <service>` / `<Sunday-of>` / theme /
  `Preacher:` / then `Introit:` / `Processional hymn:` (→ `hymn`) / `Responses:` /
  `Psalm:` (chant in brackets) / `Lessons:` (drop) / `Canticles:` / `Anthem:` /
  `Hymn:` / `Voluntary:`. `Composer, Work` order. Sun 18:15 Choral Evensong;
  Thu 21:30 Compline (crypt) — `Nunc dimittis:` + `Motet:` only; feast Eucharist
  (Ascension, 6pm) with `Mass:` → `setting`. May Morning madrigals skipped.

### st-hughs — St Hugh's College

- "Chapel" term card PDF with the music inside, `/wp-content/uploads/<yyyy>/<mm>/…`.
  **Unreliable online** — survey found only Hilary 2022. If the page says "will be
  available shortly" / links no current PDF: status `not-yet-published`, `note`
  with the URL checked.
- When present: who's-who, then by Oxford week — Sunday 18:15 Evensong or
  Eucharist, preacher/theme, then the music. Choir rehearses Fri + Sun.

### st-peters — St Peter's College

- Termly "Music List" PDF at `/asset/<irregular-name>.pdf` (TT26:
  `Music-List-TT2026-updated.pdf-1.pdf` — doubled extension; HT26 was
  `Hilary-2026-Music-List-2.pdf`). **Scrape** `spc.ox.ac.uk/…/music-and-choir`.
  ~12 pp.
- `WEEK N` / `<WEEKDAY> <date>` / `<HH:MM>PM` then `Prelude` (→ `other`/`Prelude`)
  / `Introit` / `Responses` / `Psalm` / `Readings` (drop) / `Canticles` (or
  `Magnificat` + `Nunc Dimittis` on separate lines → `magnificat`/`nunc-dimittis`)
  / `Anthem` / `Hymn(s)` / `Voluntary`. `Work Composer` order. Sun 18:00,
  Thu 18:15 (+ occasional Sat open-day evensong at 18:00).

### trinity — Trinity College

- Termly "Music List" PDF, `/sites/default/files/<yyyy-mm>/Trinity College - Trinity
  Term <yyyy> Music List.pdf` (spaces + the word "Trinity" twice — careful matching
  the *term* not the *college*; also a separate "Termcard" for preachers). ~1 p,
  **three columns**, read directly.
- `<WEEKDAY> <date>` / `Week N` / `<service>, <time>` then `INTROIT` / `RESPONSES`
  / `CANTICLES` / `ANTHEM` / `HYMNS` / `PSALM`. Sun 18:00 Evensong; **Wed 21:00
  Choral Compline** (Chapel Choir Consort — own, `choir: null`) usually printed
  with no music → `musicStatus: "not-yet-published"`. Non-choral `Madrigals from
  the Chapel roof, 8am` skipped. Joint/visiting: `Sung with choir from St Edward's
  School` → `choir` set; Ascension joint service in Balliol Chapel. Pentecost /
  "Outdoor Jazz mass" → `type: "choral-eucharist"` / `special`, `MASS SETTING` →
  `setting`.

### university-college — University College

- Termly "Music List" PDF, `/wp-content/uploads/<yyyy>/<mm>/Music-List-<T><yy>.pdf`
  (+ `ChapelTermCardWeb<T><yy>.pdf` for preachers). ~3 pp.
- Header: **"All services begin at 1745 unless otherwise stated"** → `time:
  "17:45"`, `confidence: "medium"`, `parserNote: "time from the list's header
  note"`. `WEEK N` / `<Weekday>, <Month> <d>  <service title>` then
  `Introit:` / `Psalm:` / `Preces and Responses:` (→ `responses`) / `Canticles:` /
  `Anthem:` / `Voluntary:`. `Work, Composer` order. Sun Evensong only. **Concerts**
  (e.g. "The Inaugural … Chamber Concert", with a `Programme:` block) are **not
  services** — skip them.

### wadham — Wadham College

- Termly "Music List" PDF, `/documents/848/<T><yy>_Final.pdf` — **folder id 848 is
  stable**. ~2 pp, **two-column** (weeks paired), read directly.
- `<N>TH WEEK` / `Sunday <date>` / `6pm – <service>` (title may carry
  ` | Chapel Birthday`, ` | Pentecost`, ` | Leavers' Service`, ` | SLP Evensong`).
  Headings: `Prelude` (→ `other`/`Prelude`) / `Responses` / `Hymns` / `Psalm` /
  `Canticles` / `Anthem` (can repeat — one item per line) / `Voluntary` or
  `Postlude` (→ `voluntary`) / `Introit`. `Composer, Work` order.
- **Only weeks with a full Choral Evensong are listed** — a missing week produces
  no record, not a warning. `Easter Lessons & Carols` (3rd Week) →
  `type: "special"`. "Composition Competition Winner" as the canticles/anthem
  name — keep verbatim, `composer` null.

### regents-park — Regent's Park College

- Termly "Chapel Music List" PDF, `/wp-content/uploads/<yyyy>/<mm>/RPC-music-list-
  <T><yy>-<rand>.pdf` (random suffix — scrape `rpc.ox.ac.uk/about-regents/
  chaplaincy/`). ~1 p.
- **Baptist — not BCP Evensong.** `type: "other"`, `title` from the list (the
  Friday service; each week has a one-word THEME, e.g. `DOVE`, `RAVEN`). One
  service a week, Friday 17:45 (from `typicalPattern` → `confidence: "medium"`).
  Only `Introit:` / `Anthem:` / `Hymns:` (numbers + titles, sometimes `(t15)`
  tune notes, sometimes `-` for no number). `W1`..`W8` week labels.

### pusey-house — Pusey House

- Termly "Music List" PDF, Wix-hosted `/_files/ugd/<hash>.pdf` (opaque — scrape
  `puseyhouse.org.uk/music`). ~5 pp. **Mass-centred, by calendar date.**
- Per entry: `<service> <time>` / `<choir line>` / feast (right) / then the music
  (indented, unlabelled — composer-first, `Composer, Work` with life-dates). The
  **choir line** tells you who sings: `Chapel Choir` and `Pusey Singers` are both
  the House's own → `choir: null`, but `Congregational` means **no choir** →
  `musicStatus: "no-music"`, and usually skip unless you want the record.
- Record: **Sunday 11:00 High Mass** (Chapel Choir) → `choral-eucharist`, first
  unlabelled line = `setting`, the rest = `motet`/`voluntary` by position
  (`confidence: "medium"`, `parserNote`). Weekday 18:00 Choral Evensong is often
  said/congregational — only record it when a choir + repertoire is printed.
  Monthly Friday Choral Benediction → `type: "other"`, title verbatim.

### university-church — University Church of St Mary the Virgin

- **HTML page, not a file** — scrape `universitychurch.ox.ac.uk/content/choral-
  music-list`. `scripts/fetch.mjs` saves it as `.html`; read the file directly.
- By calendar date under **month** headings, inside term/vacation sections. Each
  entry: `<Month> <d>, <year>  <liturgical day>  15.30  Choral Evensong[ (title)]`
  then ` Introit – … `, ` Preces and Responses - … `, ` Psalms … `, ` Canticles - …
  `, ` Anthem – … ` all run together on effectively one line — split on the
  headings. Composers carry life-dates. Some evensongs have their own title
  (`(Whiskey and Wood)`) → append to `title`. **Roughly monthly** in term (plus a
  Long Vacation series that falls outside the term window — the site clips it).
  Sunday 15:30 only. `Preces and Responses` → `responses`.

---

## Change log

- **(file created)** From `sources/samples/` during the initial build of the
  update-termcard skill. magdalen / merton / keble maps lifted from the fixture.
- **(Trinity 2026 run — 2026-09-02)** Learned:
  - Every TT26 list fetched fresh was byte-identical to its sample.
  - **Oriel** split the music out of the term card this term → a separate chapel
    web page (`oriel.ox.ac.uk/…/chapel/choir-and-music/`), not located. Term card
    gives themes + preachers only.
  - **New College** appends `NCH nn` (New College Hymnal) numbers and organ-scholar
    initials (MM/JH/HR) to lines — not captured. `NC` prefix on composer names =
    New College composer, dropped. Visiting/joint choirs frequent (Winchester +
    Eton, Flagey Academy, Corpus, St Gertrude's Cincinnati).
  - **Christ Church**: the April list runs 30 Mar–end April with the Cathedral
    Choir largely away for Easter (Cathedral Singers cover). Monday is said
    Evening Prayer unless a visiting choir sings. `College Compline` Wed 20:35 has
    no music printed. Some Evensongs sung by the **Cathedral Singers** (adult
    cover choir) — recorded in `notes`, not `choir`.
  - **Queen's** sometimes swaps the `CANTICLES` / `LESSONS` labels (13 May 2026) —
    check the value, not the label. `PRELUDE` → `other`/Prelude.
  - **Exeter** (.docx): term-theme services — Choral Vespers, German Vespers,
    Cantata Service, Rogationtide Service, Vigil of Pentecost — recorded `type:
    "other"`. Composer is the last token of each `Heading: value` line.
  - **Keble / Pusey House**: unlabelled; slots by position at `confidence: medium`.
    Keble's Corpus Christi Eucharist is at Pusey House; Pusey's is with Keble.
  - **RC Masses in chapels** (Queen's, Exeter, Magdalen, LMH) omitted as out of
    scope; a chapel line reading "No service" / "No evensong" produces no record
    and is noted in the report.
  - **`.docx`** extraction via `fetch.mjs` works cleanly for Exeter.

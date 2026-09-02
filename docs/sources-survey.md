# Oxford sung services — sources survey

**Compiled:** 2 September 2026 (between terms; Michaelmas 2026 begins Sun 11 Oct).
**Purpose:** identify, for every Oxford chapel that holds Choral Evensong or a closely related sung service open to the public in Full Term, the page where the music list is published each term, its format and structure, the service pattern, the choir, and access. This is a survey only — no scraper has been built.

Because it is the Long Vacation, the most recent term lists available everywhere are **Trinity Term 2026 (TT26)**. Sample lists are saved under `sources/samples/`. The machine-readable registry is `data/venues.json`; this document is the human-readable companion and also records the venues that were considered and ruled out.

Every URL in this document and in `venues.json` was actually loaded during compilation. Where a list or page could not be found, that is stated explicitly with the URL tried.

---

## 1. University dates of Full Term

Source: **https://www.ox.ac.uk/about/the-university/facts-and-figures/dates-of-term**
(the live page blocks automated fetches with HTTP 403; read via the Wayback Machine capture of 30 July 2026, `http://web.archive.org/web/20260730220931/https://www.ox.ac.uk/about/the-university/facts-and-figures/dates-of-term`). The page is titled "Dates of Full Term 2025–32". The three terms below are listed under **"Provisional dates 2026–32"** — i.e. not yet fixed.

In Oxford usage the "From" date is the **Sunday of 1st Week** and the "To" date is the **Saturday of 8th Week**.

| Term | Sunday of 1st Week | Saturday of 8th Week |
|---|---|---|
| Michaelmas 2026 | **Sunday 11 October 2026** | **Saturday 5 December 2026** |
| Hilary 2027 | **Sunday 17 January 2027** | **Saturday 13 March 2027** |
| Trinity 2027 | **Sunday 25 April 2027** | **Saturday 19 June 2027** |

Note: chapel choirs generally sing only within Full Term, and often start a day or two into 1st Week and finish in 8th Week; several also break for the University half-term / school half-term weekend. Christ Church Cathedral Choir follows **Cathedral School terms**, which are longer at the start and end than Oxford Full Term. Choristers at Magdalen, New College, Worcester and (reportedly) Pembroke are school pupils, so their weekday services stop for school half-terms.

---

## 2. Existing aggregator — choralevensong.org (cross-check only)

**https://www.choralevensong.org/** — a long-running UK-wide directory of choral foundations. It has an individual page for most Oxford venues (Magdalen = `/uk/magdalen-college-chapel-oxford-148.php`, New College = `-149`, Queen's = `-162`, Christ Church = `-60`, Merton = `-159`, Exeter = `-153`, Lincoln = `-158`, Oriel = `-160`, Trinity = `-167`, University College = `-168`, Wadham = `-169`, Worcester = `-170`, Brasenose = `-151`, Corpus Christi = `-152`, Hertford = `-154`, Keble = `-156`, LMH = `-157`, Pembroke = `-161`, St Peter's = `-166`, St Hugh's = `-164`, St Edmund Hall = `-349`, St John's = `-165`, Somerville = `-163`, Jesus = `-429`, University Church = `-847`, plus non-college St Giles' `-195`).

What it covers: a prose description of each choir, the **general weekly service pattern**, term-time notes, and often a livestream link. It explicitly notes "there are no student choirs during university vacations" and links the University term calendar.

What it does **not** do: publish or mirror the **termly music lists** (what is sung on a given date). Its own pages carry a standing caveat that its schedule can disagree with the venue's music list. Coverage is roughly the same set of venues as this survey but with **no Free Church chapels** (Mansfield, Regent's Park, Harris Manchester) and no Pusey House or St Stephen's House.

Conclusion: useful only as a sanity check on service days/times and choir descriptions. We take no data from it.

---

## 3. Venue-by-venue findings

Format key: **pdf / html / docx / image / social / none**. "Organisation" = how the list is laid out. Full detail (addresses, choir type, access wording) is in `data/venues.json`.

### The major daily foundations

**Christ Church Cathedral** — `chch.ox.ac.uk/cathedral/worship-and-music`
Music list: **pdf, published MONTHLY** (not termly) as "Services and Music", e.g. `.../sites/default/files/2026-06/Music%20List%20June%202026%20FINAL-2.pdf`, `.../2026-08/Music%20List%20Aug26%20FINAL.pdf`. Filename and dated folder change every month; the update process must re-scrape the worship page each month. Organised by calendar date; day/date/time per service; Introit / Responses / Canticles / Anthem / Voluntary, plus preacher and which choir sings. Text extracts cleanly (sample = June 2026). Pattern: Choral Evensong daily 18:05 (Mon said); Sun 11:05 Sung Eucharist + 18:05 Evensong. Choirs: Cathedral Choir (boys + lay/academical clerks, school terms); Christ Church College Choir (alternate Mondays, Oxford term); Frideswide Voices (girls, usually Weds). Services open to all, free.

**Magdalen College** — `magd.ox.ac.uk/chapel-and-choir/`; list page `.../the-choir/services-and-music-list/`
Music list: **pdf, termly** ("Chapel Services and Music"), `.../wp-content/uploads/2024/12/Chapel-Services-Music-List-TT26.pdf` (note the upload folder date bears no relation to the term). By Oxford week and day; time per service; Responses / Psalms / Canticles / Anthem / Hymn / Voluntary. ~24 pp incl. weekday said services. Text extracts cleanly. Pattern: Evensong daily except Monday 18:00 (Tue Choristers only; Fri Clerks only; Sat Consort of Voices); Sun 11:00 Eucharist. Choir: boys-and-men.

**New College** — `new.ox.ac.uk/choir-and-chapel`
Music list: **pdf, termly** ("Chapel Music List"). **Quirk: hosting location moves between terms.** Hilary 2026 was on the college site (`.../sites/default/files/2026-01/26%20Hilary%20Music%20list%20revised.pdf`); Trinity 2026 is only on the *choir's* separate site — `newcollegechoir.com/choralservices` → link "26b Trinity Music list" → `newcollegechoir.com/attachments/download.asp?file=203&type=pdf`. The college page shows "(forthcoming)" between terms. By Oxford week and day; times from the fixed pattern at the front; Responses / Psalm / Canticles / Anthem / Introit. ~20 pp; marked "NOT TO BE REMOVED FROM THE CHAPEL". Pattern (confirmed from the list): Sun 17:45; Mon 18:15 (Clerks); Tue 18:15; Thu 18:15; Fri 18:15; Sat 17:45. No Wednesday. Half-term week sung by Clerks. Choir: boys-and-men.

**Merton College** — `merton.ox.ac.uk/chapel-services`
Music list: **pdf, termly** "Services and Music Booklet" + a lighter "Chapel Card". PDFs from `/api/files/file/…` with opaque names that change each term (`ChapelServicesTT2026Upload2.pdf`, `ChapelCardTT26.pdf`). By Oxford week and day; time per service; Introit / Responses / Psalm / Canticles / Anthem / Voluntary. Text extracts cleanly. Pattern: Sun 17:45; Mon 18:00 Vespers (Girl Choristers); Tue 18:15; Wed 18:15 (Girl Choristers); Thu 18:15. Girl choristers' services drop out at school half-term. Choir: student-mixed (dir. Benjamin Nicholas) + separate Merton College Girl Choristers.

**The Queen's College** — `queens.ox.ac.uk/chapel-and-choir/`
Music list: **pdf, termly**, combined "Services & Music List" / term card, `.../wp-content/uploads/2026/04/TT26-Music-List-Term-Card.pdf` (~16 pp, ~13 MB, image-heavy but text selectable). By Oxford week with calendar dates; Responses / Psalm / Canticles / Anthem / Introit / Voluntary; preachers and special services. The choir's own site `queenschoir.com/music-list` carries a parallel copy, sometimes a "DRAFT". Pattern (from the college chapel page): Sun 18:15, Wed 18:30, Fri 18:30 — **individual services in the term list often move to other times** (e.g. a 16:30 recording, a 16:00 association evensong), so times must be read per service. Choir: mixed-adult (30+ incl. lay clerks).

### The weekly / few-times-a-week college choirs

**Exeter College** — `exeter.ox.ac.uk/about/chapel/`
Music list: **docx** — the "Services & Music List" is a **Microsoft Word document**, not PDF/HTML: `.../wp-content/uploads/2026/04/2026-Trinity-Term-Music-List.docx`. A separate term-card PDF (`Exeter-College-Chapel-Trinity-Term-2026.pdf`) is **image-based** (no text). Any pipeline must parse .docx. By Oxford week and day; Introit / Responses / Psalm / Canticles / Anthem / Hymn / Voluntary. Pattern: 3–4 services/week — Tue 18:15, Fri 18:15, Sun 18:00. Choir: student-mixed (~20).

**Keble College** — `keble.ox.ac.uk/about/music/`
Music list: **pdf, termly**, fairly stable filename `.../wp-content/uploads/Music-List-TT26.pdf` (some terms `-screen` / `-CORRECTED` / `.spreads`). By Oxford week and day; **Anglo-Catholic layout** — Mass setting, Introit/propers, Motet, Anthem, plainchant, hymns. ~12 pp. Pattern: Sun 17:30 Sung Eucharist (+Formal Hall); Tue 18:00 Evensong; Thu 21:00 Sung Compline. Choir: student-mixed (~25). Keble Evensong is broadcast on BBC Radio 3 periodically.

**St John's College** — `sjc.ox.ac.uk/discover/about-college/chapel-and-choir/`
Music list: **pdf, termly** "Chapel Termcard", `/documents/3199/Trinity_2026_termcard_3.pdf` (numeric id + name change each term). Sunday section is preacher-led with a note of hymns/anthem; **music detail is lighter** than the big foundations. Pattern: Sun 18:00 Sung Evensong with address; Wed 18:00 Choral Evensong. Choir: student-mixed (women and men, from SJC and elsewhere).

**Trinity College** — `trinity.ox.ac.uk/trinity-chapel`
Music list: **pdf, termly**, `/sites/default/files/2026-04/Trinity%20College%20-%20Trinity%20Term%202026%20Music%20List.pdf` (+ separate "Termcard"; names contain spaces/parentheses). By calendar date with Oxford week; Introit / Responses / Canticles / Anthem / Hymns / Psalm; also non-choral entries ("Madrigals from the Chapel roof, 8am"). ~1 p. Pattern: Sun 18:00 Evensong; Wed 21:00 Choral Compline (Chapel Choir Consort). Choir: student-mixed (~30).

**Lincoln College** — `lincoln.ox.ac.uk/discover/the-chapel/services/`
Music list: **pdf, termly**, `/asset/Music-List-26-TT.pdf` (+ `/asset/Term-Card-TT26.pdf`). By calendar date with Oxford week and feast; Sunday Evensong only; Preacher / Psalm / Responses / Canticles / Anthem / Hymns. ~2 pp. Pattern: Sun 18:00 Evensong. Choir: student-mixed, run entirely by the undergraduate organ scholars.

**Jesus College** — `jesus.ox.ac.uk/jesus-college-chapel/the-choir/`
Music list: **pdf, termly** "Chapel Music", `/wp-content/uploads/2026/04/Music-list-TT-26.pdf` (+ `TT26-Termcard-Final-Version.pdf`). By calendar date with Oxford week and feast; Responses / Psalm / Canticles / Anthem / Hymns. ~2 pp. Pattern: Sun 17:30 Evensong; some Tue 18:15 Evensong for feasts. Choir: small student consort (about two per part).

**Oriel College** — `oriel.ox.ac.uk/life-at-oriel/living-at-oriel/chapel/`
Music list: **pdf, termly**, combined term card + music, `/wp-content/uploads/2026/04/Oriel-2026b-web.pdf` — **filename scheme `Oriel-<yyyy><a|b|c>-web.pdf`** where a = Hilary, b = Trinity, c = Michaelmas. By Oxford week and day; Responses / Psalm / Canticles / Anthem / Voluntary + preachers. ~4 pp. Pattern: Sun 18:00 Choral Evensong; Wed 18:00 Choral Communion. Choir: student-mixed (~30, 8 Choral Scholars).

**University College** — `univ.ox.ac.uk/live-at-univ/chapel-faith-provision/`
Music list: **pdf, termly**, `/wp-content/uploads/2026/04/Music-List-TT26.pdf` (+ `ChapelTermCardWebTT26.pdf`). By Oxford week; header note "**All services begin at 1745 unless otherwise stated**" — times are assumed from the pattern, not repeated per service; Introit / Psalm / Preces and Responses / Canticles / Anthem / Voluntary. ~3 pp. Pattern: Sun 17:45–18:45 Evensong. Choir: student-mixed (Choral Scholars, Choral Bursars, volunteers).

**St Peter's College** — `spc.ox.ac.uk/student-life/living-at-st-peters/music-and-choir`
Music list: **pdf, termly**, `/asset/Music-List-TT2026-updated.pdf-1.pdf` — **irregular, unpredictable filenames** (note the doubled `.pdf`; Hilary was `Hilary-2026-Music-List-2.pdf`). By Oxford week and day; Prelude / Responses / Psalm / Readings / Canticles / Anthem / Hymn / Voluntary. ~12 pp. Pattern: Sun 18:00, Thu 18:15 (+ occasional Sat). Choir: student-mixed (~25).

**St Edmund Hall** — `seh.ox.ac.uk/discover/explore-teddy-hall/chapel`
Music list: **pdf** — a single "Chapel Term Card" that **doubles as the music list**. **Quirk: the filename contains a bullet character** — `St-Edmund-Hall-•-Trinity-Term-Card-2026_website.pdf` (encode `•` as `%E2%80%A2`). By Oxford week, each Sunday themed; Preacher / Introit / Processional hymn / Responses / Psalm / Lessons / Canticles / Anthem. ~4 pp. Pattern: Sun 18:15 Choral Evensong; Thu 21:30 Compline (in the crypt of St-Peter-in-the-East). Choir: student-mixed (~24).

**Wadham College** — `wadham.ox.ac.uk/about/chapel/choir`
Music list: **pdf, termly**, `/documents/848/TT26_Final.pdf` — **folder id 848 is stable**, filename `<T><yy>_Final.pdf`. By Oxford week ("FIRST WEEK", "FOURTH WEEK" …); Prelude / Responses / Hymns / Psalm / Canticles / Anthem / Postlude. **Quirk: not every week is listed** — only weeks with a full Choral Evensong. ~2 pp. Pattern: Sun 18:00. Choir: student-mixed.

**Balliol College** — chapel section of `www.balliol.ox.ac.uk` (the bare host `balliol.ox.ac.uk` refused connections during compilation; use `www.`)
Music list: **pdf, termly**, served as `www.balliol.ox.ac.uk/media/14956/download?inline=` — **the media id changes each term and there is no term string in the URL**, so the update process must scrape the chapel page for the current link. By Oxford week, one entry per Sunday; Introit / Hymns / Responses / Psalm / Readings / Canticles / Anthem / Preacher. Sunday Evensong only. Choir: student-mixed. *`chapelPage` in the registry is now `https://www.balliol.ox.ac.uk/balliol-chapel/chapel-services` — confirmed loading 2 Sep 2026; it carries a "You can see the music for the term here" link to `/media/14956/download?inline` (the same opaque media id, which still changes each term).*

**Hertford College** — `hertford.ox.ac.uk/living-here/chapel/music/`
Music list: **pdf, termly** "List of services and music". **Awkward:** as of 2 Sep 2026 the music page links only the **Trinity 2025** list (`/wp-content/uploads/2025/04/MUSIC-LIST-TT25-2.pdf`); there is a Trinity 2026 *Chapel Card* (`/wp-content/uploads/2026/04/Hertford-Trinity-Term-26-Chapel-Card.pdf`) but no Trinity 2026 music list. Lists may appear late in term and/or be taken down afterwards. Sample = TT25. By Oxford week and day; time per service (Sunday Evensong usually 17:45, sometimes 17:15); Hymns / Responses / Psalm / Canticles / Anthem / Voluntary. Pattern: Sun 17:45 Evensong + sermon; Thu Eucharist/Compline sung by a choral-clerks octet. Choir: student-mixed.

**Brasenose College** — `bnc.ox.ac.uk/about-brasenose/music/choir/`
Music list: **NOT FOUND.** Search-engine snippets mention a "See the current Chapel Music List" link at the foot of the choir page, but no such link or document is present or reachable now (the page is client-rendered). The **Trinity 2026 Chapel Term Card** (`/wp-content/uploads/2026/05/Term_Card_TT26_accessible1.pdf`) has service and preacher info but **no music detail**. Sample saved is that term card, as a placeholder. Pattern: Sun 18:00 Choral Evensong (BCP) + sermon; short Choral Evensong Tue 18:00–18:30 in weeks 1–6 of Trinity. Choir: non-auditioned student-mixed (~35).

**Lady Margaret Hall** — `lmh.ox.ac.uk/about-lmh/chapel/chapel-services-and-weekly-events`
Music list: **pdf, termly** "Readings & Music List", `/sites/default/files/documents/2026-04/1.LMH_TT26%20Readings%26Music.pdf`. By Oxford week; header "Unless otherwise indicated, Friday Choral Evensong is at 6 p.m."; readings + music per Friday. ~5 pp. Pattern: Choral Evensong **Fridays only**, 18:00–18:50. Choir: non-auditioned student-mixed + choral scholars.

### Foundations with boy choristers alongside adults

**Worcester College** — `worc.ox.ac.uk/college-life/chapel`
Music list: **pdf, termly** "Services and Music", `/wp-content/uploads/2026/04/TT26-Services-and-Music-final.pdf`. **Awkward: this PDF is image-only — no extractable text (≈8 characters per page); it would need OCR.** The separate "Chapel Card" (`TT26-Chapel-Card.pdf`) *is* text but carries no music. By Oxford week and day; Introit / Responses / Psalm / Canticles / Anthem / Voluntary. Pattern: five choral services/week — Sun 18:00 Evensong, Mon 18:00 Choral Reflection, Tue 18:00 Evensong, Wed 21:00 Compline, Thu 18:00 Evensong/Eucharist. Adult SATB scholars sing Sun/Wed/Thu; boy Choristers (Christ Church Cathedral School) sing Mon/Tue. Services open to the public.

### Free Church / non-Anglican foundations (on the brief's starting list; included, flagged)

**Harris Manchester College** — `hmc.ox.ac.uk/music-at-the-chapel`
Music list: **NOT FOUND / none published.** Unitarian foundation; the College Choir sings a weekly **Choral Evensong Wednesday 17:45** (then Formal Hall). Repertoire not posted online — would need to email the Sanders Director of Music. Choir: student-mixed. Public-attendance wording not explicit on the site.

**Regent's Park College** — `rpc.ox.ac.uk/about-regents/chaplaincy/`
Music list: **pdf, termly** "Chapel Music List", `/wp-content/uploads/2026/04/RPC-music-list-TT26-d3ql.pdf` (random suffix). Baptist foundation: the **Friday 17:45–18:30 Evening Worship** is a bespoke term-specific liturgy, **not BCP Evensong**. By Oxford week, each week a one-word theme (e.g. "DOVE"); Introit / Anthem / Hymns. ~1 p. Choir: student-mixed. Term card / updates also on Instagram **@rpcchapel**. Public attendance not explicitly stated.

**Mansfield College** — `mansfield.ox.ac.uk/study-here/college-life/mansfield-college-chapel/`
Music list: **NOT FOUND / none.** Congregational/URC foundation; unconsecrated chapel; worship in the Nonconformist tradition, so no BCP Evensong. One main service **Wednesday 18:15**, ecumenical, **members of the public invited**; the choir sings. A termly schedule of dates/preachers is on an events page; term card said to be on Instagram. Choir: student-mixed.

### Anglo-Catholic houses and the University Church

**Pusey House** — `puseyhouse.org.uk/music`
Music list: **pdf, termly** "Music List", Wix-hosted with opaque names (`/_files/ugd/0711b7_f2eba55ce4054565b83064ac27d67f26.pdf` for TT26). By calendar date; service / time / choir ("Chapel Choir" / "Pusey Singers" / "Congregational") / feast / Mass setting / motets. **Mass-centred**, not Evensong-centred: the Chapel Choir principally sings **Sunday 11:00 High Mass**; the weekday 18:00 Choral Evensong is often said/congregational, with the choir only occasionally (e.g. a monthly Friday Choral Benediction). ~5 pp, text extracts cleanly. Sunday High Mass "open to all"; term-time only. Choir: mixed-adult (8 choral scholars, SSAATTBB).

**University Church of St Mary the Virgin** — `universitychurch.ox.ac.uk/content/music-university-church`
Music list: **html** — `universitychurch.ox.ac.uk/content/choral-music-list` is a **web page, not a download**; the update process scrapes it. By calendar date under term/vacation headings; Introit / Preces and Responses / Psalms / Canticles / Anthem, with composer dates. Some evensongs are individually titled ("Whiskey and Wood"). Pattern: **Choral Evensong Sunday 15:30**, roughly monthly in term plus a summer series; the professional choir also sings the Sunday morning Eucharist weekly in term. Choir: mixed-adult, professional; core repertoire Tudor polyphony + 20th–21st century. Sample saved = the page HTML as at 2 Sep 2026.

**St Stephen's House** — `ssho.ac.uk`
Music list: **NOT FOUND.** Anglo-Catholic theological college (PPH); its principal chapel is the former Cowley Fathers' **Church of St John the Evangelist**, where Mass and Office are sung daily in term. But the college website has **no chapel/worship page at all** — tried `/chapel`, `/worship`, `/about/spirituality/`, `/about-us/the-chapels/`, `/about/student-life/`, `/visitors/` (all 404 or silent) — **no timetable, no statement on public attendance, no music list.** A human must contact the college. Kept in the registry as a stub with nulls because it is on the brief's list and does hold sung worship.

---

## 4. Considered and ruled out

### No chapel / no sung services

| College | Finding | Source |
|---|---|---|
| **St Hilda's College** | Temporary chapel only (a permanent one is planned in the Boundary Building); a multi-faith "Sanctuary"; Quaker chaplain. No regular sung Anglican service; students use other colleges' choirs. The college choir performs at concerts and college events, not chapel evensong. | `st-hildas.ox.ac.uk/student-life/current-students/faith`, `sthildas.ox.ac.uk/content/chapel` |
| **St Anne's College** | "Unlike other Colleges, St Anne's does not have a chapel." (Historically its members gathered at the University Church.) | `st-annes.ox.ac.uk/study-here/undergraduate/why-st-annes/` |
| **St Catherine's College** | Arne Jacobsen design; deliberately built without a chapel. (Not page-verified this pass beyond general knowledge / college listings.) | — |
| **Wycliffe Hall** | Evangelical Anglican PPH. A weekly rhythm of morning worship, quiet time, staff Bible expositions, college communion and informal prayer — **no choir, no sung Evensong**. | `wycliffe.ox.ac.uk`, Wikipedia |
| **All Souls College** | No resident choir; most services said; visiting choirs sing occasional special services (listed in the Term Card), public welcome via the High Street lodge. Not a regular public sung-service venue. | `asc.ox.ac.uk/visit-the-college/the-chapel` |
| Graduate colleges — **Nuffield, St Antony's, St Cross, Kellogg, Linacre, Wolfson, Green Templeton, Reuben, St Hugh's's graduate neighbours** etc. | No Anglican choral foundation; most have no chapel (some a meditation/quiet room). St Cross College holds a start-of-term Evensong **at Pusey House** rather than its own. Not individually page-verified this pass; flagged for a human to spot-check if completeness matters. | Oxford graduate college listing |

### Roman Catholic — out of scope (RC Vespers / Mass), listed so they are not silently dropped

| Institution | Sung services | Source |
|---|---|---|
| **Blackfriars (Hall & Priory)** | Dominican. Vespers sung to Gregorian chant Mon–Fri 18:45, public welcome; Solemn Vespers for Advent. RC rite → out of scope. | `bfriars.ox.ac.uk`, newliturgicalmovement.org |
| **Campion Hall** | Jesuit PPH; RC Mass/Office. Out of scope. (Not deeply page-verified.) | Wikipedia |
| **Oxford Oratory / RC Chaplaincy (Newman House)** | Not colleges, but the nearest RC sung Vespers/Mass in the city — out of scope, noted for completeness. | — |
| **St Benet's Hall** | Benedictine PPH — **closed in 2022**; no longer operating. | Wikipedia |

### A genuine addition beyond the brief's starting list

**St Hugh's College** was **not** on the starting list but **does** hold Choral Evensong or Eucharist every Sunday of Full Term at 18:15, public welcome, with an SATB choir — so it is included as a full venue. Its termly Chapel term card (which contains the music) is, however, **not reliably online**: as at 2 Sep 2026 the chapel page says the card "will be available shortly" and the only retrievable one is **Hilary 2022**. That older card is the saved sample; a human should establish the current publication route.

---

## 5. Sample files saved

`sources/samples/` (fetched 2 Sep 2026). Extension reflects what the venue actually publishes.

| File | Venue | Term | Text-extractable? | Notes |
|---|---|---|---|---|
| christ-church.pdf | Christ Church Cathedral | June 2026 | yes | monthly list; Aug 2026 was newest but June is more representative |
| magdalen.pdf | Magdalen | TT26 | yes | |
| new-college.pdf | New College | TT26 | yes | from the choir's site, not the college's |
| merton.pdf | Merton | TT26 | yes | "Services and Music Booklet" |
| queens.pdf | Queen's | TT26 | yes | 13 MB, image-heavy |
| exeter.docx | Exeter | TT26 | yes (Word) | **.docx**; `exeter-schedule.pdf` also saved (image-only) |
| keble.pdf | Keble | TT26 | yes | |
| st-johns.pdf | St John's | TT26 | yes | termcard; light music detail |
| worcester.pdf | Worcester | TT26 | **NO — image-only** | `worcester-card.pdf` (preachers) is text |
| somerville.pdf | Somerville | **HT26** | **NO — image-only** | no TT26 booklet found; service is "Choral Contemplation" |
| balliol.pdf | Balliol | TT26 | yes | Sunday-only |
| brasenose.pdf | Brasenose | TT26 | yes | **term card, not a music list** — no music detail |
| corpus-christi.pdf | Corpus Christi | **MT23** | yes | most recent list online is Michaelmas 2023 |
| hertford.pdf | Hertford | **TT25** | yes | no TT26 music list published; `hertford-card.pdf` = TT26 card |
| jesus.pdf | Jesus | TT26 | yes | `jesus-termcard.pdf` also saved |
| lady-margaret-hall.pdf | LMH | TT26 | yes | Friday-only |
| lincoln.pdf | Lincoln | TT26 | yes | Sunday-only |
| oriel.pdf | Oriel | TT26 | yes | term card + music combined |
| st-edmund-hall.pdf | St Edmund Hall | TT26 | yes | term card = music list; bullet in filename |
| st-hughs.pdf | St Hugh's | **HT22** | yes | only retrievable term card |
| st-peters.pdf | St Peter's | TT26 | yes | |
| trinity.pdf | Trinity | TT26 | yes | |
| university-college.pdf | University College | TT26 | yes | |
| wadham.pdf | Wadham | TT26 | yes | only some weeks listed |
| university-church.html | University Church | (rolling) | yes (HTML) | page, not a file |
| regents-park.pdf | Regent's Park | TT26 | yes | Free Church evening worship |
| pusey-house.pdf | Pusey House | TT26 | yes | Mass-centred |

No sample for: **Pembroke, Mansfield, Harris Manchester, St Stephen's House** (no music list found).

---

## 6. Things to check by eye

1. **Christ Church is monthly, not termly.** Everything downstream assumes termly PDFs; Christ Church breaks that. Decide how the update process handles a venue that publishes 3 lists per term on a rolling calendar-month basis, and whether it tracks Cathedral School term boundaries separately.
2. **Exeter publishes a `.docx`.** Confirm this is deliberate and durable (not a one-off), and decide whether to parse it or fall back to their image-only term-card PDF (which would need OCR).
3. **Worcester and Somerville music lists are image-only PDFs.** No text at all. Either OCR them or treat those two as manual-entry venues.
4. **Hertford, Corpus Christi, St Hugh's, Brasenose — the current term's music list is missing or unreachable.** For Hertford the newest online is TT25; for Corpus, MT23; for St Hugh's, HT22; for Brasenose there is apparently no standalone list at all. Working assumption (JP, 2 Sep 2026): some of these venues **genuinely have no public music list**, and others **only post it close to the start of term** — so a between-terms scrape will legitimately come up empty for them. The pipeline should treat "no list yet" as a normal state for a venue (retry as term approaches, fall back to last known / manual entry) rather than an error, and we should mark per-venue whether a list is expected at all. Still worth a human confirming which bucket each of these four falls into, and where.
5. **New College hosting flips between the college site and the choir site term to term.** The update process will need to check both.
6. **Filename/URL instability.** Balliol (opaque numeric `/media/<id>/`), St Peter's (`…updated.pdf-1.pdf`), Merton and Pusey (opaque hashes), St Edmund Hall (bullet character), Queen's/Univ/Oriel/Jesus (dated upload folders unrelated to term). None of these can be constructed from the term name — all require scraping the chapel page for the live link.
7. **Queen's service times move per service** within the term list — don't assume the Sun/Wed/Fri 18:15/18:30/18:30 pattern holds for every date.
8. **Choir "type" values** for Merton, Queen's, Oriel, Trinity, University Church and Pusey House are my best reading (student vs. adult vs. professional mix) and worth a sanity check. Pembroke: some third-party pages claim Christ Church Cathedral School choristers sing with the adult choir — I could not confirm this on Pembroke's own site.
9. **St Stephen's House** — I could not find *anything* on their site about chapel worship. Needs a direct enquiry, and a decision on whether an institution with no public-facing service information belongs in the list.
10. **Free Church venues (Regent's Park, Mansfield, Harris Manchester)** hold sung services with choirs but they are not Choral Evensong. Confirm they are in scope for the site, and how they should be labelled so users aren't misled.
11. **`balliol.ox.ac.uk` bare domain refused connections** from this environment (only `www.` worked). Balliol `chapelPage` updated to `https://www.balliol.ox.ac.uk/balliol-chapel/chapel-services` (confirmed 2 Sep 2026).
12. **Full Term dates for 2026–27 are marked "provisional"** on ox.ac.uk. Re-check before the site goes live.

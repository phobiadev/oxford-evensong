// Validate data/venues.json, data/index.json and every data/terms/*.json against
// the contract in docs/data-schema.md. Deterministic; no dependencies.
//
//   node scripts/validate.mjs            errors -> exit 1, warnings -> printed
//   node scripts/validate.mjs --strict   warnings also -> exit 1
//
// Errors are contract violations. Warnings are things a human should look at.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

import { weekDayForDate } from './oxweeks.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const STRICT = process.argv.includes('--strict');

const errors = [];
const warnings = [];
const err = (file, where, msg) => errors.push({ file, where, msg });
const warn = (file, where, msg) => warnings.push({ file, where, msg });

// --- controlled vocabularies (see docs/data-schema.md) --------------------

const TYPE = new Set([
  'choral-evensong', 'sung-evensong', 'said-evensong', 'choral-matins',
  'choral-eucharist', 'compline', 'special', 'other',
]);
const SLOT = new Set([
  'introit', 'responses', 'psalm', 'canticles', 'magnificat', 'nunc-dimittis',
  'anthem', 'motet', 'hymn', 'office-hymn', 'setting', 'voluntary', 'other',
]);
const MUSIC_STATUS = new Set(['published', 'not-yet-published', 'not-parsed', 'no-music']);
const VENUE_STATUS = new Set([
  'published', 'not-yet-published', 'not-found', 'fetch-failed', 'not-parsed', 'no-list',
]);
const CONFIDENCE = new Set(['high', 'medium', 'low']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MS = 86_400_000;

// --- helpers -------------------------------------------------------------

function readJSON(path) {
  try {
    return { value: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (e) {
    return { error: e.message };
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function checkKeys(file, where, obj, allowed, required = allowed) {
  const keys = new Set(Object.keys(obj));
  for (const k of keys) {
    if (!allowed.includes(k)) err(file, where, `unknown field "${k}"`);
  }
  for (const k of required) {
    if (!keys.has(k)) err(file, where, `missing required field "${k}"`);
  }
}

function isoDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

// --- venues.json --------------------------------------------------------

function loadVenues() {
  const path = join(DATA, 'venues.json');
  if (!existsSync(path)) {
    err('data/venues.json', '', 'file not found');
    return new Set();
  }
  const { value, error } = readJSON(path);
  if (error) {
    err('data/venues.json', '', `invalid JSON: ${error}`);
    return new Set();
  }
  const ids = new Set();
  const list = Array.isArray(value.venues) ? value.venues : [];
  if (!list.length) err('data/venues.json', '', 'no venues[] array');
  for (const v of list) {
    if (!isNonEmptyString(v.id)) {
      err('data/venues.json', '', 'a venue has no id');
      continue;
    }
    if (ids.has(v.id)) err('data/venues.json', v.id, 'duplicate venue id');
    ids.add(v.id);
    v.typicalPattern ??= '';
  }
  return { ids, byId: new Map(list.map((v) => [v.id, v])) };
}

// --- index.json --------------------------------------------------------

function loadIndex() {
  const path = join(DATA, 'index.json');
  if (!existsSync(path)) {
    err('data/index.json', '', 'file not found');
    return { current: null, terms: {} };
  }
  const { value, error } = readJSON(path);
  if (error) {
    err('data/index.json', '', `invalid JSON: ${error}`);
    return { current: null, terms: {} };
  }
  checkKeys('data/index.json', '', value, ['current', 'terms']);
  const terms = isPlainObject(value.terms) ? value.terms : {};
  for (const [id, t] of Object.entries(terms)) {
    checkKeys('data/index.json', `terms.${id}`, t, ['name', 'weekOneSunday', 'lastSaturday']);
    if (!isNonEmptyString(t.name)) err('data/index.json', `terms.${id}`, 'name missing');
    checkTermDates('data/index.json', `terms.${id}`, t);
  }
  if (isNonEmptyString(value.current) && !terms[value.current]) {
    warn('data/index.json', 'current', `"${value.current}" is not in terms{} (expected while its list is unpublished)`);
  }
  return { current: value.current ?? null, terms };
}

function checkTermDates(file, where, t) {
  if (!ISO_DATE.test(t.weekOneSunday ?? '')) {
    err(file, where, `weekOneSunday not an ISO date: ${t.weekOneSunday}`);
  } else if (isoDay(t.weekOneSunday) !== 0) {
    err(file, where, `weekOneSunday ${t.weekOneSunday} is not a Sunday`);
  }
  if (!ISO_DATE.test(t.lastSaturday ?? '')) {
    err(file, where, `lastSaturday not an ISO date: ${t.lastSaturday}`);
  } else if (isoDay(t.lastSaturday) !== 6) {
    err(file, where, `lastSaturday ${t.lastSaturday} is not a Saturday`);
  }
  if (ISO_DATE.test(t.weekOneSunday ?? '') && ISO_DATE.test(t.lastSaturday ?? '')) {
    if (daysBetween(t.weekOneSunday, t.lastSaturday) <= 0) {
      err(file, where, 'lastSaturday is not after weekOneSunday');
    }
  }
}

// --- term files -------------------------------------------------------

function validateTermFile(path, venues, index) {
  const file = `data/terms/${basename(path)}`;
  const stem = basename(path, '.json');
  const { value: doc, error } = readJSON(path);
  if (error) {
    err(file, '', `invalid JSON: ${error}`);
    return;
  }

  checkKeys(file, '', doc, ['term', 'generated', 'venueStatus', 'services']);

  // -- term block
  const term = isPlainObject(doc.term) ? doc.term : {};
  checkKeys(file, 'term', term, ['id', 'name', 'weekOneSunday', 'lastSaturday', 'timezone']);
  if (term.id !== stem) err(file, 'term.id', `"${term.id}" does not match filename "${stem}"`);
  if (term.timezone !== 'Europe/London') {
    err(file, 'term.timezone', `expected "Europe/London", got ${JSON.stringify(term.timezone)}`);
  }
  checkTermDates(file, 'term', term);

  const idxTerm = index.terms[term.id];
  if (idxTerm) {
    if (idxTerm.weekOneSunday !== term.weekOneSunday || idxTerm.lastSaturday !== term.lastSaturday) {
      err(file, 'term', `dates disagree with data/index.json terms.${term.id}`);
    }
  } else {
    warn(file, 'term', `"${term.id}" is not listed in data/index.json terms{}`);
  }

  // -- generated block
  const gen = isPlainObject(doc.generated) ? doc.generated : {};
  checkKeys(file, 'generated', gen, ['at', 'by', 'notes', 'sources'], ['at', 'by']);

  const w1 = term.weekOneSunday;
  const lastSat = term.lastSaturday;
  const rangeOk = ISO_DATE.test(w1 ?? '') && ISO_DATE.test(lastSat ?? '');

  // -- services
  const services = Array.isArray(doc.services) ? doc.services : [];
  if (!Array.isArray(doc.services)) err(file, 'services', 'not an array');

  const seenIds = new Set();
  const perVenue = new Map();

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const at = `services[${i}]${isNonEmptyString(s?.id) ? ` (${s.id})` : ''}`;
    if (!isPlainObject(s)) {
      err(file, at, 'not an object');
      continue;
    }
    checkKeys(file, at, s, [
      'id', 'venueId', 'date', 'time', 'week', 'day', 'type', 'title', 'occasion',
      'choir', 'music', 'musicStatus', 'preacher', 'notes', 'source', 'confidence', 'parserNote',
    ]);

    // venue
    if (!venues.ids.has(s.venueId)) err(file, at, `venueId "${s.venueId}" not in venues.json`);
    perVenue.set(s.venueId, (perVenue.get(s.venueId) ?? 0) + 1);

    // date
    if (!ISO_DATE.test(s.date ?? '')) {
      err(file, at, `date not ISO: ${s.date}`);
    } else if (rangeOk) {
      if (daysBetween(w1, s.date) < -28 || daysBetween(s.date, lastSat) < -28) {
        err(file, at, `date ${s.date} is outside [weekOneSunday - 28d, lastSaturday + 28d]`);
      }
    }

    // time
    const timeOk = s.time === null || (typeof s.time === 'string' && HHMM.test(s.time));
    if (!timeOk) err(file, at, `time not HH:MM or null: ${JSON.stringify(s.time)}`);

    // id format + uniqueness
    if (!isNonEmptyString(s.id)) {
      err(file, at, 'id missing');
    } else {
      if (seenIds.has(s.id)) err(file, at, 'duplicate service id');
      seenIds.add(s.id);
      if (ISO_DATE.test(s.date ?? '') && isNonEmptyString(s.venueId)) {
        const expectPrefix = `${s.date}-${s.venueId}-`;
        if (typeof s.time === 'string' && HHMM.test(s.time)) {
          const want = `${expectPrefix}${s.time.replace(':', '')}`;
          if (s.id !== want) err(file, at, `id should be "${want}"`);
        } else if (!s.id.startsWith(expectPrefix)) {
          err(file, at, `id should start with "${expectPrefix}"`);
        }
      }
    }

    // week / day vs date (via oxweeks)
    if (ISO_DATE.test(s.date ?? '') && isNonEmptyString(term.id)) {
      try {
        const { week, day } = weekDayForDate(term.id, s.date);
        if (s.week !== week) err(file, at, `week ${s.week} != ${week} (from date ${s.date})`);
        if (s.day !== day) err(file, at, `day "${s.day}" != "${day}" (from date ${s.date})`);
        if (week < 0 || week > 9) warn(file, at, `date ${s.date} is outside 0th-9th Week (week ${week})`);
      } catch (e) {
        err(file, at, `cannot place date in term: ${e.message}`);
      }
    }

    // vocabularies + simple field types
    if (!TYPE.has(s.type)) err(file, at, `type not in vocabulary: ${JSON.stringify(s.type)}`);
    if (!MUSIC_STATUS.has(s.musicStatus)) err(file, at, `musicStatus not in vocabulary: ${JSON.stringify(s.musicStatus)}`);
    if (!CONFIDENCE.has(s.confidence)) err(file, at, `confidence not in vocabulary: ${JSON.stringify(s.confidence)}`);
    if (!isNonEmptyString(s.title)) err(file, at, 'title empty');
    for (const f of ['occasion', 'choir', 'preacher', 'notes', 'parserNote']) {
      if (s[f] !== null && !isNonEmptyString(s[f])) err(file, at, `${f} must be a non-empty string or null`);
    }
    if (s.confidence === 'low') warn(file, at, 'confidence "low" - flag for a human');

    // source
    const src = isPlainObject(s.source) ? s.source : {};
    checkKeys(file, `${at}.source`, src, ['url', 'fetchedAt', 'locator']);
    if (!isNonEmptyString(src.url)) err(file, at, 'source.url missing');
    if (src.locator !== null && !isNonEmptyString(src.locator)) err(file, at, 'source.locator must be a non-empty string or null');

    // music
    const music = Array.isArray(s.music) ? s.music : [];
    if (!Array.isArray(s.music)) err(file, at, 'music is not an array');
    if (s.musicStatus === 'published' && music.length === 0) {
      err(file, at, 'musicStatus "published" but music[] is empty');
    }
    for (let j = 0; j < music.length; j++) {
      const m = music[j];
      const mat = `${at}.music[${j}]`;
      if (!isPlainObject(m)) {
        err(file, mat, 'not an object');
        continue;
      }
      for (const k of Object.keys(m)) {
        if (!['slot', 'text', 'composer', 'title', 'label'].includes(k)) {
          err(file, mat, `unknown field "${k}"`);
        }
      }
      if (!SLOT.has(m.slot)) err(file, mat, `slot not in vocabulary: ${JSON.stringify(m.slot)}`);
      if (!isNonEmptyString(m.text)) err(file, mat, 'text empty');
      if (m.slot === 'other') {
        if (!isNonEmptyString(m.label)) err(file, mat, 'slot "other" needs a non-empty label');
      } else if ('label' in m) {
        err(file, mat, 'label is only allowed on slot "other"');
      }
      for (const k of ['composer', 'title']) {
        if (k in m && !isNonEmptyString(m[k])) err(file, mat, `${k} must be a non-empty string`);
      }
    }
  }

  // within-30-minutes duplicates (warning)
  const byVenueDate = new Map();
  for (const s of services) {
    if (!ISO_DATE.test(s?.date ?? '') || typeof s.time !== 'string' || !HHMM.test(s.time)) continue;
    const key = `${s.venueId}|${s.date}`;
    if (!byVenueDate.has(key)) byVenueDate.set(key, []);
    byVenueDate.get(key).push(s.time);
  }
  for (const [key, times] of byVenueDate) {
    const mins = times.map((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))).sort((a, b) => a - b);
    for (let i = 1; i < mins.length; i++) {
      if (mins[i] - mins[i - 1] <= 30) warn(file, key, 'two services within 30 minutes');
    }
  }

  // -- venueStatus
  const vs = isPlainObject(doc.venueStatus) ? doc.venueStatus : {};
  if (!isPlainObject(doc.venueStatus)) err(file, 'venueStatus', 'not an object');
  for (const [vid, entry] of Object.entries(vs)) {
    const at = `venueStatus.${vid}`;
    if (!venues.ids.has(vid)) err(file, at, `not a venue id in venues.json`);
    if (!isPlainObject(entry)) {
      err(file, at, 'not an object');
      continue;
    }
    checkKeys(file, at, entry, ['status', 'sourceUrl', 'fetchedAt', 'services', 'note']);
    if (!VENUE_STATUS.has(entry.status)) err(file, at, `status not in vocabulary: ${JSON.stringify(entry.status)}`);
    if (!Number.isInteger(entry.services) || entry.services < 0) {
      err(file, at, `services must be a non-negative integer`);
    } else {
      const actual = perVenue.get(vid) ?? 0;
      if (actual !== entry.services) {
        err(file, at, `services count ${entry.services} != ${actual} actual service objects`);
      }
    }
    if (entry.status === 'published') {
      if (!isNonEmptyString(entry.sourceUrl)) err(file, at, 'status "published" needs a sourceUrl');
      if (entry.services === 0) warn(file, at, 'status "published" but no services recorded');
    }
    if (entry.note !== null && !isNonEmptyString(entry.note)) err(file, at, 'note must be a non-empty string or null');

    // pattern sanity (heuristic)
    if (entry.status === 'published' && entry.services > 0) {
      const pat = venues.byId.get(vid)?.typicalPattern ?? '';
      const dayTokens = (pat.match(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)(day|s|nesday|rsday|urday)?\b/g) ?? []).length;
      const weeksCovered = new Set(
        services.filter((s) => s.venueId === vid && Number.isInteger(s.week)).map((s) => s.week),
      ).size || 1;
      if (dayTokens > 0 && entry.services < Math.ceil(dayTokens * weeksCovered * 0.5)) {
        warn(file, at, `only ${entry.services} services for ~${dayTokens}/week over ${weeksCovered} week(s) - fewer than the typical pattern`);
      }
    }
  }
  for (const vid of venues.ids) {
    if (!(vid in vs)) warn(file, 'venueStatus', `venue "${vid}" from venues.json is not in venueStatus`);
  }
}

// --- run ---------------------------------------------------------------

const venues = loadVenues();
const index = loadIndex();

const termsDir = join(DATA, 'terms');
const termFiles = existsSync(termsDir)
  ? readdirSync(termsDir).filter((f) => f.endsWith('.json')).sort()
  : [];
if (index.current && !termFiles.includes(`${index.current}.json`)) {
  warn('data/index.json', 'current', `no data/terms/${index.current}.json yet`);
}
for (const f of termFiles) validateTermFile(join(termsDir, f), venues, index);

// --- report ----------------------------------------------------------

const fmt = (list) => list.map(({ file, where, msg }) => `  ${file}${where ? ` [${where}]` : ''}: ${msg}`).join('\n');

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  console.log(fmt(warnings));
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  console.log(fmt(errors));
}
if (!errors.length && !warnings.length) console.log('OK - no errors, no warnings.');

const failed = errors.length > 0 || (STRICT && warnings.length > 0);
console.log(
  `\n${errors.length} error(s), ${warnings.length} warning(s).` +
  (failed ? ' FAIL' + (STRICT && !errors.length ? ' (--strict)' : '') : ' PASS'),
);
process.exit(failed ? 1 : 0);

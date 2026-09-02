// Runtime data loading. Fetches data/index.json, data/venues.json and the term
// files, then merges every held term's services by date. No dependencies.

import { weekDayForDate } from './oxweeks.js';

// Resolve data/ relative to the document, so the site works under a Pages
// sub-path (…/oxford-evensong/) and at a bare host root alike.
const BASE = typeof location !== 'undefined'
  ? location.pathname.replace(/[^/]*$/, '')
  : '/';

async function getJSON(path) {
  const res = await fetch(BASE + path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}


/**
 * @returns {{
 *   index: object,
 *   venues: Map<string, object>,
 *   venueList: object[],
 *   terms: Map<string, object>,            // term id -> full term doc
 *   termObjects: object[],                 // resolved { id, name, weekOneSunday, lastSaturday }
 *   servicesByDate: Map<string, object[]>, // ISO date -> services, each annotated
 *   generatedAt: string|null,
 * }}
 */
export async function loadData() {
  const [index, venuesDoc] = await Promise.all([
    getJSON('data/index.json'),
    getJSON('data/venues.json'),
  ]);

  const venueList = venuesDoc.venues ?? [];
  const venues = new Map(venueList.map((v) => [v.id, v]));

  // index.json.termFiles is the authoritative list of term files that exist on
  // disk — fetch exactly those (no speculative 404s). Adding a term file means
  // adding it to termFiles; validate.mjs keeps the two in step.
  const ids = index.termFiles ?? [];
  const terms = new Map();
  await Promise.all(
    ids.map(async (id) => {
      const doc = await getJSON(`data/terms/${id}.json`).catch(() => null);
      if (doc && doc.term && doc.term.id) terms.set(doc.term.id, doc);
    }),
  );

  // Resolved term objects: index.json is authoritative; a held term file fills
  // in a term absent from index.json (the TT26 fixture).
  const termObjects = [];
  const seen = new Set();
  for (const [id, t] of Object.entries(index.terms ?? {})) {
    termObjects.push({ id, ...t });
    seen.add(id);
  }
  for (const [id, doc] of terms) {
    if (!seen.has(id)) termObjects.push({ ...doc.term });
  }
  termObjects.sort((a, b) => a.weekOneSunday.localeCompare(b.weekOneSunday));

  // Merge services across all held terms, keyed by date.
  const servicesByDate = new Map();
  let generatedAt = null;
  for (const [termId, doc] of terms) {
    if (doc.generated?.at && (!generatedAt || doc.generated.at > generatedAt)) {
      generatedAt = doc.generated.at;
    }
    for (const s of doc.services ?? []) {
      const annotated = {
        ...s,
        _termId: termId,
        _venue: venues.get(s.venueId) ?? null,
        _venueStatus: doc.venueStatus?.[s.venueId] ?? null,
      };
      if (!servicesByDate.has(s.date)) servicesByDate.set(s.date, []);
      servicesByDate.get(s.date).push(annotated);
    }
  }
  for (const list of servicesByDate.values()) list.sort(byTimeThenChapel);

  return {
    index,
    venues,
    venueList,
    terms,
    termObjects,
    servicesByDate,
    generatedAt,
  };
}

/** null times sort last; then by chapel name for a stable order. */
export function byTimeThenChapel(a, b) {
  const ta = a.time ?? '99:99';
  const tb = b.time ?? '99:99';
  if (ta !== tb) return ta < tb ? -1 : 1;
  const na = a._venue?.name ?? a.venueId;
  const nb = b._venue?.name ?? b.venueId;
  return na.localeCompare(nb);
}

/** venueStatus entry for a venue in a given term, or null. */
export function venueStatusFor(data, termId, venueId) {
  return data.terms.get(termId)?.venueStatus?.[venueId] ?? null;
}

/** Services for one venue in one term, sorted by date then time. */
export function servicesForVenue(data, termId, venueId) {
  const doc = data.terms.get(termId);
  if (!doc) return [];
  return (doc.services ?? [])
    .filter((s) => s.venueId === venueId)
    .map((s) => ({
      ...s,
      _termId: termId,
      _venue: data.venues.get(s.venueId) ?? null,
      _venueStatus: doc.venueStatus?.[s.venueId] ?? null,
    }))
    .sort((a, b) => (a.date === b.date ? byTimeThenChapel(a, b) : a.date < b.date ? -1 : 1));
}

/** All held services (every term), each annotated — for search. */
export function allServices(data) {
  const out = [];
  for (const list of data.servicesByDate.values()) out.push(...list);
  return out;
}

export { BASE, weekDayForDate };

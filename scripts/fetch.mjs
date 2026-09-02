// Download one music-list URL for the update-termcard skill. Deterministic; no
// dependencies (node: builtins + the system `pdftotext` / `unzip`).
//
//   node scripts/fetch.mjs <url> <outPath>
//
// - GETs <url> with a descriptive User-Agent, following redirects.
// - Non-2xx: prints the status, writes nothing, exits 1 (the skill retries or
//   falls back to a committed sample).
// - 2xx: writes the raw bytes to <outPath> (parent dirs created).
// - If the body is a PDF: runs `pdftotext -layout` to <outPath>.txt.
// - If <outPath> is a .docx: extracts word/document.xml to plain text at
//   <outPath>.txt.
// - Reports content-type, byte size, and whether the text layer looks usable
//   (> 200 non-whitespace characters per page).
//
// One URL per invocation. The caller waits between venues; this script does not.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

const UA = 'oxford-evensong (https://github.com/phobiadev/oxford-evensong)';
const USABLE_CHARS_PER_PAGE = 200;
const DOCX_CTYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// --- pure helpers (unit-tested in fetch.test.mjs) -------------------------

/**
 * Judge an extracted text layer. `pages` is counted from form-feed bytes that
 * `pdftotext` writes between pages (+1); a docx is treated as a single page.
 * @param {string} text
 * @param {number} [pages]
 * @returns {{ chars: number, pages: number, perPage: number, usable: boolean }}
 */
export function assessTextLayer(text, pages) {
  const chars = (text.match(/\S/g) ?? []).length;
  const p = Math.max(1, pages ?? (text.match(/\f/g) ?? []).length + 1);
  const perPage = Math.round(chars / p);
  return { chars, pages: p, perPage, usable: perPage > USABLE_CHARS_PER_PAGE };
}

/**
 * Convert the body of a Word document.xml to plain text: paragraphs become
 * lines, `<w:tab/>` becomes a tab, every other tag is dropped, XML entities are
 * decoded. Crude but dependency-free and enough for a plain music list.
 * @param {string} xml
 * @returns {string}
 */
export function docxXmlToText(xml) {
  return xml
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksLikePdf(outPath, ctype, bytes) {
  return (
    ctype.includes('pdf') ||
    outPath.toLowerCase().endsWith('.pdf') ||
    (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 &&
      bytes[2] === 0x44 && bytes[3] === 0x46) // %PDF
  );
}

function looksLikeDocx(outPath, ctype) {
  return outPath.toLowerCase().endsWith('.docx') || ctype.includes(DOCX_CTYPE);
}

// --- side-effecting steps ------------------------------------------------

function writeTextLayerFromPdf(outPath) {
  const txtPath = `${outPath}.txt`;
  try {
    execFileSync('pdftotext', ['-layout', outPath, txtPath], { stdio: 'pipe' });
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('pdftotext not found — skipping text layer; the skill can read the PDF directly');
      return;
    }
    console.log(`pdftotext failed: ${e.message.trim()}`);
    return;
  }
  const text = readFileSync(txtPath, 'utf8');
  reportTextLayer(text, undefined, txtPath);
}

function writeTextLayerFromDocx(outPath) {
  const txtPath = `${outPath}.txt`;
  let xml;
  try {
    xml = execFileSync('unzip', ['-p', outPath, 'word/document.xml'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    }).toString('utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('unzip not found — cannot extract .docx text; the skill must read it another way');
      return;
    }
    console.log(`unzip failed: ${e.message.trim()}`);
    return;
  }
  const text = docxXmlToText(xml);
  writeFileSync(txtPath, `${text}\n`);
  reportTextLayer(text, 1, txtPath);
}

function reportTextLayer(text, pages, txtPath) {
  const a = assessTextLayer(text, pages);
  console.log(
    `text layer: ${a.perPage} chars/page over ${a.pages} page(s) — ` +
    (a.usable ? `USABLE (${txtPath})` : `POOR — read the source directly`),
  );
}

// --- main --------------------------------------------------------------

async function main() {
  const [url, outPath] = process.argv.slice(2);
  if (!url || !outPath) {
    console.error('usage: node scripts/fetch.mjs <url> <outPath>');
    process.exit(2);
  }

  let res;
  try {
    res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
  } catch (e) {
    console.error(`fetch failed: ${e.message}`);
    process.exit(1);
  }

  const ctype = (res.headers.get('content-type') ?? '').toLowerCase();
  if (!res.ok) {
    console.error(`${res.status} ${res.statusText} — ${res.url}`);
    process.exit(1);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, bytes);

  console.log(`GET ${res.url}`);
  console.log(`content-type: ${ctype || '(none)'}`);
  console.log(`size: ${bytes.length.toLocaleString()} bytes -> ${outPath}`);

  if (looksLikePdf(outPath, ctype, bytes)) {
    writeTextLayerFromPdf(outPath);
  } else if (looksLikeDocx(outPath, ctype)) {
    writeTextLayerFromDocx(outPath);
  } else {
    console.log('not a PDF or .docx — saved as-is (HTML/other; the skill reads it directly)');
  }
}

// Run only when invoked directly, not when imported by fetch.test.mjs.
if (import.meta.main) main();

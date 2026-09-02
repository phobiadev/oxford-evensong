// Run: node --test scripts/
// Offline unit tests for the pure helpers in fetch.mjs (no network, no files).

import test from 'node:test';
import assert from 'node:assert/strict';

import { assessTextLayer, docxXmlToText } from './fetch.mjs';

test('assessTextLayer counts non-whitespace per page and flags a usable layer', () => {
  const a = assessTextLayer('x'.repeat(600));
  assert.equal(a.chars, 600);
  assert.equal(a.pages, 1);
  assert.equal(a.perPage, 600);
  assert.equal(a.usable, true);
});

test('assessTextLayer splits pages on form feeds', () => {
  const page = `${'y '.repeat(150)}`; // 150 non-ws chars
  const a = assessTextLayer(`${page}\f${page}\f${page}`);
  assert.equal(a.pages, 3);
  assert.equal(a.perPage, 150);
  assert.equal(a.usable, false); // 150 <= 200
});

test('assessTextLayer treats an image-only PDF (a few chars per page) as POOR', () => {
  const a = assessTextLayer(`  \n \f  1 \f  \n`, 3);
  assert.ok(a.perPage < 10);
  assert.equal(a.usable, false);
});

test('assessTextLayer honours an explicit page count (docx = 1 page)', () => {
  const a = assessTextLayer('z'.repeat(50), 1);
  assert.equal(a.pages, 1);
  assert.equal(a.usable, false);
});

test('docxXmlToText: paragraphs become lines, tabs preserved, tags dropped', () => {
  const xml =
    '<w:body>' +
    '<w:p><w:r><w:t>THIRD WEEK</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>Sunday</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>6.00pm Choral Evensong</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>Responses</w:t></w:r><w:tab/><w:r><w:t>Smith</w:t></w:r></w:p>' +
    '</w:body>';
  assert.equal(
    docxXmlToText(xml),
    'THIRD WEEK\nSunday\t6.00pm Choral Evensong\nResponses\tSmith',
  );
});

test('docxXmlToText decodes XML entities, & last', () => {
  const xml = '<w:p><w:t>Magnificat &amp; Nunc dimittis &lt;a 8&gt; &quot;x&quot; John&#39;s</w:t></w:p>';
  assert.equal(docxXmlToText(xml), 'Magnificat & Nunc dimittis <a 8> "x" John\'s');
});

test('docxXmlToText collapses trailing spaces and blank runs', () => {
  const xml = '<w:p><w:t>A  </w:t></w:p><w:p></w:p><w:p></w:p><w:p></w:p><w:p><w:t>B</w:t></w:p>';
  assert.equal(docxXmlToText(xml), 'A\n\nB');
});

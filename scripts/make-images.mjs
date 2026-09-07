// Render design/og.html to the PNGs the site's <head> points at.
//
// Dev-only, and NOT a repo dependency: it needs a locally installed Playwright
// (`npm i -D playwright && npx playwright install chromium` — /package.json is
// git-ignored), the same as the review screenshots. The outputs are committed;
// re-run this only when design/og.html changes.
//
//   node scripts/make-images.mjs
//
// It serves the repo root over HTTP first, because the artwork loads the site's
// self-hosted @font-face files and a file:// page cannot.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** id in design/og.html → output path, and any downscaled sizes to also write. */
const TARGETS = [
  { id: 'og', out: 'assets/og.png' },
  { id: 'icon512', out: 'assets/icon-512.png', also: [192, 180] },
  { id: 'mask512', out: 'assets/icon-maskable-512.png' },
];

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png',
};

function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve([server, server.address().port]));
  });
}

const [server, port] = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
await page.goto(`http://127.0.0.1:${port}/design/og.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

for (const { id, out, also = [] } of TARGETS) {
  const el = page.locator(`#${id}`);
  await el.screenshot({ path: join(ROOT, out) });
  console.log(out);
  // Smaller icons are downscales of the 512 master, so every size is one design.
  for (const size of also) {
    const shot = await el.screenshot({ scale: 'css' });
    const small = await page.evaluate(async ([b64, s]) => {
      const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const c = new OffscreenCanvas(s, s);
      c.getContext('2d').drawImage(img, 0, 0, s, s);
      const blob = await c.convertToBlob({ type: 'image/png' });
      const buf = new Uint8Array(await blob.arrayBuffer());
      return btoa(String.fromCharCode(...buf));
    }, [shot.toString('base64'), size]);
    const path = out.replace(/-\d+\.png$/, `-${size}.png`);
    await (await import('node:fs/promises')).writeFile(join(ROOT, path), Buffer.from(small, 'base64'));
    console.log(path);
  }
}

await browser.close();
server.close();

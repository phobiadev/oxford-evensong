// The shareable service card — a small image of one service.
//
// `cardModel` is pure (no DOM) and unit-tested in scripts/site.test.mjs.
// `drawCard` paints that model onto a <canvas> by hand — there is no
// html2canvas or any other dependency, so the layout lives here in JS rather
// than in CSS. It takes the light or dark palette (whichever the site is in
// when you share), always the full music list, and its width is sized to the
// content (clamped) so short services don't ship a wide image.

import { fullDate } from './dom.js';
import { timeLabel } from './london.js';
import { isSaid, slotLabel, musicValueText } from './entry.js';

/* The two palettes, copied from style.css (`:root` and the dark block). The card
   follows the theme passed to `drawCard` — a card shared from dark mode is a
   dark image. `drawCard` sets `C` before painting. */
const LIGHT = {
  paper: '#F1EEE3',
  ink: '#22201A',
  mid: '#6C685C',
  faint: '#8A8474',
  rule: '#C3BDAB',
  hair: '#D8D3C4',
  accentInk: '#4F6B4C',
};
const DARK = {
  paper: '#191813',
  ink: '#E9E3D4',
  mid: '#9C9585',
  faint: '#847D6D',
  rule: '#453F34',
  hair: '#37332A',
  accentInk: '#AEC9A8',
};
let C = LIGHT;

const SERIF = '"Spectral", "Iowan Old Style", Georgia, serif';
const SERIF_SC = '"Spectral SC", "Spectral", Georgia, serif';
const MONO = '"Spline Sans Mono", ui-monospace, Menlo, monospace';

const PAD = 48;
const MIN_W = 520;
const MAX_W = 940;
const LABEL_W = 176; // the slot-label column

/**
 * A plain data description of the card.
 * @param s an annotated service (has `_venue`)
 */
export function cardModel(s) {
  const said = isSaid(s);
  const notYet = s.musicStatus === 'not-yet-published';
  return {
    chapel: s._venue?.name ?? s.venueId,
    kind: s.title || String(s.type || 'service').replace(/-/g, ' '),
    occasion: s.occasion || null,
    date: fullDate(s.date),
    time: timeLabel(s.time),
    choir: s.choir || null,
    // when there is no music list, the card shows this one line instead of rows
    noMusicNote: said ? 'Spoken; no music sung' : notYet ? 'Music not published yet' : null,
    full: said || notYet
      ? []
      : (s.music ?? []).map((m) => ({ label: slotLabel(m), value: musicValueText(m) })),
    lowConf: s.confidence === 'low',
    source: s._venue?.name ? `${s._venue.name} music list` : null,
  };
}

/* ---------- canvas drawing ---------- */

function setSpacing(ctx, em) {
  // ctx.letterSpacing is Chrome 99+, Safari 17.4+, Firefox 129+; harmless to skip.
  try { ctx.letterSpacing = em ? `${em}em` : '0px'; } catch { /* unsupported */ }
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function rule(ctx, y, x1, x2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
}

/**
 * The natural (unwrapped) width the content wants, before clamping. Used to
 * pick the card width so a short service isn't padded out to the maximum.
 */
function contentWidth(model) {
  const ctx = document.createElement('canvas').getContext('2d');
  let w = 0;
  const at = (font, str, spacing = 0) => {
    ctx.font = font;
    setSpacing(ctx, spacing);
    w = Math.max(w, ctx.measureText(str).width);
    setSpacing(ctx, 0);
  };

  at(`600 19px ${SERIF_SC}`, 'OXFORD EVENSONG', 0.08);
  at(`500 40px ${SERIF}`, model.chapel);

  ctx.font = `500 14px ${MONO}`;
  setSpacing(ctx, 0.06);
  let kindW = ctx.measureText(model.kind.toUpperCase()).width;
  setSpacing(ctx, 0);
  if (model.occasion) {
    ctx.font = `400 17px ${SERIF}`;
    kindW += ctx.measureText(`   ${model.occasion}`).width;
  }
  w = Math.max(w, kindW);

  at(`400 22px ${SERIF}`, `${model.date}   ·   ${model.time}`);
  if (model.choir) at(`italic 400 19px ${SERIF}`, model.choir);

  if (model.full.length) {
    ctx.font = `400 20px ${SERIF}`;
    for (const row of model.full) {
      w = Math.max(w, LABEL_W + ctx.measureText(row.value).width);
    }
  } else if (model.noMusicNote) {
    at(`400 25px ${SERIF}`, model.noMusicNote);
  }

  // the footer stacks (source line, then URL), so it only needs the wider of the two
  ctx.font = `400 13px ${MONO}`;
  setSpacing(ctx, 0.04);
  if (model.source) w = Math.max(w, ctx.measureText(`FROM ${model.source.toUpperCase()}`).width);
  w = Math.max(w, ctx.measureText('phobiadev.github.io/oxford-evensong').width);
  setSpacing(ctx, 0);

  return Math.ceil(w);
}

/**
 * Paint the card top-to-bottom onto `ctx` at 1× scale for the given width, and
 * return the total height used. Run once to measure, then again to render.
 */
function paint(ctx, model, width) {
  const inner = width - PAD * 2;
  let y = PAD;

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  setSpacing(ctx, 0);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, width, 6000);

  // wordmark
  ctx.fillStyle = C.accentInk;
  ctx.font = `600 19px ${SERIF_SC}`;
  setSpacing(ctx, 0.08);
  ctx.fillText('OXFORD EVENSONG', PAD, y);
  setSpacing(ctx, 0);
  y += 26;
  rule(ctx, y, PAD, width - PAD, C.rule);
  y += 30;

  // chapel
  ctx.fillStyle = C.ink;
  ctx.font = `500 40px ${SERIF}`;
  for (const ln of wrap(ctx, model.chapel, inner)) { ctx.fillText(ln, PAD, y); y += 45; }
  y += 7;

  // kind (+ occasion)
  ctx.font = `500 14px ${MONO}`;
  setSpacing(ctx, 0.06);
  ctx.fillStyle = C.mid;
  const kind = model.kind.toUpperCase();
  ctx.fillText(kind, PAD, y);
  if (model.occasion) {
    const kw = ctx.measureText(kind).width;
    setSpacing(ctx, 0);
    ctx.fillStyle = C.accentInk;
    ctx.font = `400 17px ${SERIF}`;
    ctx.fillText(`   ${model.occasion}`, PAD + kw, y - 2);
  }
  setSpacing(ctx, 0);
  y += 28;

  // date · time
  ctx.fillStyle = C.mid;
  ctx.font = `400 22px ${SERIF}`;
  ctx.fillText(`${model.date}   ·   ${model.time}`, PAD, y);
  y += 30;

  // choir
  if (model.choir) {
    ctx.fillStyle = C.mid;
    ctx.font = `italic 400 19px ${SERIF}`;
    for (const ln of wrap(ctx, model.choir, inner)) { ctx.fillText(ln, PAD, y); y += 25; }
  }

  y += 15;
  rule(ctx, y, PAD, width - PAD, C.hair);
  y += 24;

  if (model.full.length) {
    const valueX = PAD + LABEL_W;
    const valueW = inner - LABEL_W;
    for (const row of model.full) {
      ctx.font = `400 13px ${MONO}`;
      setSpacing(ctx, 0.04);
      ctx.fillStyle = C.faint;
      ctx.fillText(row.label.toUpperCase(), PAD, y + 4);
      setSpacing(ctx, 0);

      ctx.font = `400 20px ${SERIF}`;
      ctx.fillStyle = C.ink;
      const lines = wrap(ctx, row.value, valueW);
      lines.forEach((ln, i) => ctx.fillText(ln, valueX, y + i * 27));
      y += Math.max(31, lines.length * 27) + 5;
    }
  } else if (model.noMusicNote) {
    ctx.font = `400 25px ${SERIF}`;
    ctx.fillStyle = C.mid;
    for (const ln of wrap(ctx, model.noMusicNote, inner)) { ctx.fillText(ln, PAD, y); y += 35; }
  }

  if (model.lowConf) {
    y += 5;
    ctx.font = `italic 400 16px ${SERIF}`;
    ctx.fillStyle = C.mid;
    const note = 'Our reading of a list that gives few or no slot labels — check against the source.';
    for (const ln of wrap(ctx, note, inner)) { ctx.fillText(ln, PAD, y); y += 22; }
  }

  y += 24;
  rule(ctx, y, PAD, width - PAD, C.rule);
  y += 18;

  ctx.font = `400 13px ${MONO}`;
  setSpacing(ctx, 0.04);
  if (model.source) {
    ctx.fillStyle = C.mid;
    ctx.fillText(`FROM ${model.source.toUpperCase()}`, PAD, y);
    y += 18;
  }
  ctx.fillStyle = C.faint;
  ctx.fillText('phobiadev.github.io/oxford-evensong', PAD, y);
  setSpacing(ctx, 0);
  y += 14;

  return y + PAD;
}

/**
 * Render `model` onto `canvas` at device resolution. Resolves once the pixels
 * are on the canvas (fonts loaded first).
 */
export async function drawCard(canvas, model, theme) {
  if (document.fonts?.ready) {
    try {
      await Promise.all([
        document.fonts.load(`500 40px ${SERIF}`),
        document.fonts.load(`400 22px ${SERIF}`),
        document.fonts.load(`italic 400 19px ${SERIF}`),
        document.fonts.load(`600 19px ${SERIF_SC}`),
        document.fonts.load(`400 13px ${MONO}`),
      ]);
      await document.fonts.ready;
    } catch { /* fall back to the stack */ }
  }

  C = theme === 'dark' ? DARK : LIGHT;

  const width = Math.max(MIN_W, Math.min(MAX_W, contentWidth(model) + PAD * 2));
  const dpr = Math.max(2, Math.round(window.devicePixelRatio || 1));

  const scratch = document.createElement('canvas');
  scratch.width = width;
  scratch.height = 6000;
  const height = Math.ceil(paint(scratch.getContext('2d'), model, width));

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.aspectRatio = `${width} / ${height}`;
  canvas.style.width = `${width}px`; // display at logical size; CSS caps it on narrow screens
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  paint(ctx, model, width);
  return { width, height };
}

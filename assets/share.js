// The "Share" dialog for one service: a preview card (the full music list), a
// copy-able link, and — where the browser allows it — copy-image, download-image
// and the native share sheet with the card attached as a file.
//
// Built on the native <dialog> element (focus trap + Esc for free). No
// dependencies. Wired from app.js; the card itself is drawn by card.js.

import { cardModel, drawCard } from './card.js';
import { effectiveTheme } from './theme.js';

let dialog = null;
let els = null;
const state = { service: null, url: '', model: null, blob: null };

const canClipboardImage = () => typeof window.ClipboardItem !== 'undefined'
  && !!navigator.clipboard?.write;

function canShareFile() {
  if (!navigator.canShare || !navigator.share) return false;
  try {
    const probe = new File(['x'], 'x.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'share-dialog';
  // Take the opening focus onto the dialog itself, so no control (the ✕ in
  // particular) shows a focus ring when the dialog appears. `autofocus` is the
  // spec-compliant hook; `focusDialog()` in openShareDialog is the Safari
  // fallback (its autofocus lands on the first button and can be deferred).
  dialog.tabIndex = -1;
  dialog.autofocus = true;
  dialog.setAttribute('aria-label', 'Share this service');
  dialog.innerHTML = `
    <form method="dialog" class="sd-x"><button value="close" aria-label="Close">✕</button></form>
    <div class="sd-head">
      <h2 class="sd-title"></h2>
      <p class="sd-sub"></p>
    </div>
    <div class="sd-card"><canvas></canvas></div>
    <div class="sd-link">
      <input type="text" readonly aria-label="Link to this service" />
      <button type="button" class="sd-copylink">Copy link</button>
    </div>
    <div class="sd-actions">
      <button type="button" class="sd-share">Share…</button>
      <button type="button" class="sd-copyimg">Copy image</button>
      <button type="button" class="sd-download">Download image</button>
    </div>`;
  document.body.appendChild(dialog);

  els = {
    title: dialog.querySelector('.sd-title'),
    sub: dialog.querySelector('.sd-sub'),
    canvas: dialog.querySelector('canvas'),
    link: dialog.querySelector('.sd-link input'),
    copyLink: dialog.querySelector('.sd-copylink'),
    share: dialog.querySelector('.sd-share'),
    copyImg: dialog.querySelector('.sd-copyimg'),
    download: dialog.querySelector('.sd-download'),
  };

  els.share.hidden = !canShareFile();
  els.copyImg.hidden = !canClipboardImage();

  // close on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  els.link.addEventListener('click', () => els.link.select());

  els.copyLink.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.url);
      flash(els.copyLink, 'Link copied');
    } catch { /* clipboard blocked */ }
  });

  els.copyImg.addEventListener('click', async () => {
    const blob = await currentBlob();
    if (!blob) return;
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      flash(els.copyImg, 'Copied');
    } catch { /* denied / unsupported type */ }
  });

  els.download.addEventListener('click', async () => {
    const blob = await currentBlob();
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.service.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  });

  els.share.addEventListener('click', async () => {
    const blob = await currentBlob();
    if (!blob) return;
    const file = new File([blob], `${state.service.id}.png`, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], url: state.url, title: shareTitle() });
    } catch { /* dismissed or unshareable */ }
  });
}

function shareTitle() {
  const m = state.model;
  return `${m.chapel} — ${m.kind}, ${m.date}`;
}

function flash(btn, text) {
  const original = btn.dataset.label || btn.textContent;
  btn.dataset.label = original;
  btn.textContent = text;
  btn.classList.add('done');
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('done');
  }, 1800);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function currentBlob() {
  if (!state.blob) state.blob = await canvasToBlob(els.canvas);
  return state.blob;
}

async function renderCard() {
  await drawCard(els.canvas, state.model, effectiveTheme());
  state.blob = null;
  state.blob = await canvasToBlob(els.canvas);
}

/**
 * Open the dialog for `service`. `url` is the canonical Day-view link that
 * app.js builds. Falls back to copying the link if <dialog> is unavailable.
 */
export async function openShareDialog(service, url) {
  if (typeof HTMLDialogElement === 'undefined') {
    try { await navigator.clipboard.writeText(url); } catch { /* nothing to do */ }
    return;
  }
  if (!dialog) build();

  state.service = service;
  state.url = url;
  state.model = cardModel(service);
  state.blob = null;

  els.title.textContent = state.model.chapel;
  els.sub.textContent = `${state.model.kind} · ${state.model.date} · ${state.model.time}`;
  els.link.value = url;

  dialog.showModal();
  focusDialog();
  await renderCard();
}

// Keep the opening focus on the dialog, not on a control. Safari can apply its
// own autofocus (to the ✕ button) a frame or two after showModal(), so re-take
// it across a frame and a macrotask — but only while it's still sitting on the
// ✕, so we don't yank focus off a control the user has already reached.
function focusDialog() {
  const reclaim = () => {
    if (dialog.open && dialog.contains(document.activeElement)
        && document.activeElement !== dialog) dialog.focus();
  };
  dialog.focus();
  requestAnimationFrame(reclaim);
  setTimeout(reclaim, 60);
}

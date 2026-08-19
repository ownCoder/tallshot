/**
 * Tallshot — editor.
 *
 * Two-canvas model:
 *   #base    the image plus every committed annotation, at natural pixel
 *            size. Repainted only when the layer list changes.
 *   #scratch the stroke currently under the cursor, plus selection chrome.
 *            Cleared and repainted on every pointermove.
 *
 * Repainting a 1440x8320 base canvas on each pointermove would drop to single
 * digit fps. Separating the layers keeps drawing smooth no matter how tall
 * the capture is.
 *
 * Undo history stores shape descriptors, not bitmaps: a 100-step history
 * costs kilobytes rather than hundreds of megabytes.
 */

import { MSG, FORMAT, MIME, PDF_LAYOUT } from '../lib/constants.js';
import { getSettings } from '../lib/settings.js';
import { getCapture, deleteCapture } from '../lib/store.js';
import { renderFilename } from '../lib/filename.js';
import { buildPdf, planPdfPages } from '../lib/pdf.js';

// ── Tool definitions ─────────────────────────────────────────────────────

const TOOLS = [
  { id: 'select', key: 'V', label: 'Select', icon: 'M5 3l14 8.5-6 1.6-2.6 5.6z' },
  { id: 'crop', key: 'C', label: 'Crop', icon: 'M7 3v14h14M3 7h14v14' },
  { divider: true },
  { id: 'arrow', key: 'A', label: 'Arrow', icon: 'M5 19 19 5M11 5h8v8' },
  { id: 'rect', key: 'R', label: 'Rectangle', icon: 'M4 5h16v14H4z' },
  { id: 'ellipse', key: 'O', label: 'Ellipse', icon: 'M12 5c4.4 0 8 3.1 8 7s-3.6 7-8 7-8-3.1-8-7 3.6-7 8-7z' },
  { id: 'line', key: 'L', label: 'Line', icon: 'M5 19 19 5' },
  { id: 'pen', key: 'P', label: 'Pen', icon: 'M4 20l3.5-1 10-10-2.5-2.5-10 10zM15 6.5 17.5 9' },
  { id: 'highlight', key: 'H', label: 'Highlighter', icon: 'M6 18h12M8 14l6-9 4 2.5-6 9z' },
  { divider: true },
  { id: 'text', key: 'T', label: 'Text', icon: 'M5 6h14M12 6v13' },
  { id: 'step', key: 'N', label: 'Step number', icon: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM11 9.5 12.5 9v6' },
  { divider: true },
  { id: 'blur', key: 'B', label: 'Blur', icon: 'M12 3c3 4 5 6.6 5 9a5 5 0 0 1-10 0c0-2.4 2-5 5-9z' },
  { id: 'pixelate', key: 'X', label: 'Pixelate', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
];

const SWATCHES = [
  { name: 'Red', value: '#FF4D4F' },
  { name: 'Amber', value: '#FFB020' },
  { name: 'Green', value: '#2ED3A7' },
  { name: 'Blue', value: '#3B9EFF' },
  { name: 'Violet', value: '#7A5CFF' },
  { name: 'Ink', value: '#12151C' },
];

/** Which contextual controls each tool actually uses. */
const TOOL_CONTROLS = {
  select: [],
  crop: ['crop'],
  arrow: ['color', 'width'],
  rect: ['color', 'width', 'fill'],
  ellipse: ['color', 'width', 'fill'],
  line: ['color', 'width'],
  pen: ['color', 'width'],
  highlight: ['color', 'width'],
  text: ['color', 'font'],
  step: ['color', 'font'],
  blur: ['radius'],
  pixelate: ['radius'],
};

// ── State ────────────────────────────────────────────────────────────────

const state = {
  source: null, // ImageBitmap — the pixels blur/pixelate sample from
  layers: [],
  history: [],
  historyIndex: -1,
  tool: 'arrow',
  color: SWATCHES[0].value,
  width: 4,
  fontSize: 28,
  radius: 14,
  filled: false,
  zoom: 1,
  stepCounter: 1,
  meta: null,
  captureId: null,
  settings: null,
  draft: null, // shape under construction
  cropRect: null,
  selectedIndex: -1,
  dragOffset: null,
};

const el = {};
let baseCtx = null;
let scratchCtx = null;

// ── Boot ─────────────────────────────────────────────────────────────────

init().catch((err) => {
  console.error('[Tallshot] editor init failed', err);
  showEmpty('Something went wrong loading this capture.');
});

async function init() {
  cacheElements();
  state.settings = await getSettings();
  applyTheme();
  state.fontSize = 28;
  updateSaveLabel(state.settings.defaultFormat);

  buildRail();
  buildSwatches();
  buildHelpSheet();
  wireEvents();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  state.captureId = id;

  const record = id ? await getCapture(id) : null;
  if (!record) {
    el.loading.hidden = true;
    showEmpty();
    return;
  }

  state.meta = record.meta || {};
  state.source = await createImageBitmap(record.blob);

  sizeCanvases(state.source.width, state.source.height);
  pushHistory(); // baseline, so the first undo returns to the pristine capture
  render();
  fitToWindow();
  applyMeta();

  el.loading.hidden = true;

  // The blob is in memory now, so the on-disk copy can go.
  deleteCapture(id).catch(() => {});
  chrome.runtime.sendMessage({ type: MSG.EDITOR_READY }).catch(() => {});
}

function cacheElements() {
  const ids = [
    'app', 'base', 'scratch', 'stage', 'canvasWrap', 'rail', 'ctx', 'banner',
    'metaHost', 'metaDims', 'btnUndo', 'btnRedo', 'btnCopy', 'btnSave',
    'btnFormats', 'formatMenu', 'saveLabel', 'btnHelp', 'helpSheet',
    'helpClose', 'helpGrid', 'toast', 'empty', 'emptyText', 'loading',
    'btnNewCapture', 'swatches', 'widthRange', 'widthValue', 'fontRange',
    'fontValue', 'radiusRange', 'radiusValue', 'fillToggle', 'colorGroup',
    'widthGroup', 'fontGroup', 'radiusGroup', 'fillGroup', 'cropGroup',
    'cropApply', 'cropCancel', 'zoomIn', 'zoomOut', 'zoomFit', 'zoomActual',
    'zoomValue', 'textEntry', 'textInput',
  ];
  for (const id of ids) el[id] = document.getElementById(id);
  baseCtx = el.base.getContext('2d');
  scratchCtx = el.scratch.getContext('2d');
}

function sizeCanvases(w, h) {
  for (const canvas of [el.base, el.scratch]) {
    canvas.width = w;
    canvas.height = h;
  }
  el.base.setAttribute('aria-label', `Screenshot, ${w} by ${h} pixels`);
}

function applyMeta() {
  const m = state.meta;
  el.metaHost.textContent = m.host || m.title || 'Capture';
  el.metaDims.textContent = `${state.source.width} × ${state.source.height}`;

  const notes = [];
  if (m.downscaled) {
    notes.push(`Scaled to ${Math.round((m.scale || 1) * 100)}% to fit Chrome's image limit.`);
  }
  if (m.partial) {
    notes.push(`Captured the first ${m.coverage ?? 0}% of this page.`);
  }
  if (notes.length) {
    el.banner.textContent = notes.join(' ');
    el.banner.hidden = false;
  }
}

// ── UI construction ──────────────────────────────────────────────────────

function buildRail() {
  for (const tool of TOOLS) {
    if (tool.divider) {
      const hr = document.createElement('div');
      hr.className = 'rail__divider';
      el.rail.appendChild(hr);
      continue;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool';
    button.dataset.tool = tool.id;
    button.title = `${tool.label} (${tool.key})`;
    button.setAttribute('aria-label', `${tool.label}, shortcut ${tool.key}`);
    button.setAttribute('aria-pressed', String(tool.id === state.tool));
    button.innerHTML =
      `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${tool.icon}"/></svg>` +
      `<span class="tool__key" aria-hidden="true">${tool.key}</span>`;
    button.addEventListener('click', () => selectTool(tool.id));
    el.rail.appendChild(button);
  }
}

function buildSwatches() {
  for (const swatch of SWATCHES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.style.background = swatch.value;
    button.dataset.color = swatch.value;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-label', swatch.name);
    button.setAttribute('aria-checked', String(swatch.value === state.color));
    button.addEventListener('click', () => setColor(swatch.value));
    el.swatches.appendChild(button);
  }
}

function buildHelpSheet() {
  const rows = [
    ...TOOLS.filter((t) => !t.divider).map((t) => [t.label, t.key]),
    ['Undo', 'Ctrl+Z'],
    ['Redo', 'Ctrl+Shift+Z'],
    ['Save', 'Ctrl+S'],
    ['Copy to clipboard', 'Ctrl+C'],
    ['Fit to window', 'Ctrl+0'],
    ['Zoom 100%', 'Ctrl+1'],
    ['Zoom in / out', 'Ctrl + / −'],
    ['Stroke width − / +', '[ / ]'],
    ['Pick colour 1–6', '1 … 6'],
    ['Delete selected', 'Delete'],
    ['Deselect / cancel', 'Esc'],
    ['This sheet', '?'],
  ];
  el.helpGrid.innerHTML = rows
    .map(
      ([label, key]) =>
        `<div class="sheet__row"><strong>${label}</strong><kbd>${key}</kbd></div>`
    )
    .join('');
}

// ── Events ───────────────────────────────────────────────────────────────

function wireEvents() {
  el.btnUndo.addEventListener('click', undo);
  el.btnRedo.addEventListener('click', redo);
  el.btnCopy.addEventListener('click', copyToClipboard);
  el.btnSave.addEventListener('click', () => exportAs(state.settings.defaultFormat));
  el.btnNewCapture.addEventListener('click', () => window.close());

  el.btnFormats.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFormatMenu();
  });
  for (const item of el.formatMenu.querySelectorAll('[data-format]')) {
    item.addEventListener('click', () => {
      toggleFormatMenu(false);
      exportAs(item.dataset.format);
    });
  }
  document.addEventListener('click', () => toggleFormatMenu(false));

  el.btnHelp.addEventListener('click', () => el.helpSheet.showModal());
  el.helpClose.addEventListener('click', () => el.helpSheet.close());

  el.widthRange.addEventListener('input', () => {
    state.width = Number(el.widthRange.value);
    el.widthValue.textContent = state.width;
  });
  el.fontRange.addEventListener('input', () => {
    state.fontSize = Number(el.fontRange.value);
    el.fontValue.textContent = state.fontSize;
  });
  el.radiusRange.addEventListener('input', () => {
    state.radius = Number(el.radiusRange.value);
    el.radiusValue.textContent = state.radius;
  });
  el.fillToggle.addEventListener('change', () => {
    state.filled = el.fillToggle.checked;
  });

  el.cropApply.addEventListener('click', applyCrop);
  el.cropCancel.addEventListener('click', cancelCrop);

  el.zoomIn.addEventListener('click', () => setZoom(state.zoom * 1.25));
  el.zoomOut.addEventListener('click', () => setZoom(state.zoom / 1.25));
  el.zoomFit.addEventListener('click', fitToWindow);
  el.zoomActual.addEventListener('click', () => setZoom(1));

  el.scratch.addEventListener('pointerdown', onPointerDown);
  el.scratch.addEventListener('pointermove', onPointerMove);
  el.scratch.addEventListener('pointerup', onPointerUp);
  el.scratch.addEventListener('pointercancel', onPointerUp);

  el.textInput.addEventListener('keydown', onTextKey);
  el.textInput.addEventListener('input', autoGrowTextarea);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', () => {
    if (state.zoomMode === 'fit') fitToWindow();
  });

  selectTool(state.tool);
}

function onKeyDown(e) {
  if (el.helpSheet.open && e.key === 'Escape') return;
  const typing =
    document.activeElement === el.textInput ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

  const mod = e.ctrlKey || e.metaKey;

  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    exportAs(state.settings.defaultFormat);
    return;
  }
  if (mod && e.key.toLowerCase() === 'c' && !typing) {
    e.preventDefault();
    copyToClipboard();
    return;
  }
  if (mod && (e.key === '0' || e.key === '1')) {
    e.preventDefault();
    e.key === '0' ? fitToWindow() : setZoom(1);
    return;
  }
  if (mod && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    setZoom(state.zoom * 1.25);
    return;
  }
  if (mod && e.key === '-') {
    e.preventDefault();
    setZoom(state.zoom / 1.25);
    return;
  }

  if (typing || mod) return;

  if (e.key === 'Escape') {
    cancelDraft();
    state.selectedIndex = -1;
    clearScratch();
    if (state.tool === 'crop') cancelCrop();
    return;
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedIndex >= 0) {
    e.preventDefault();
    state.layers.splice(state.selectedIndex, 1);
    state.selectedIndex = -1;
    commit();
    return;
  }
  if (e.key === '?') {
    el.helpSheet.showModal();
    return;
  }
  if (e.key === '[') {
    setWidth(state.width - 1);
    return;
  }
  if (e.key === ']') {
    setWidth(state.width + 1);
    return;
  }
  if (/^[1-6]$/.test(e.key)) {
    setColor(SWATCHES[Number(e.key) - 1].value);
    return;
  }

  const tool = TOOLS.find((t) => !t.divider && t.key.toLowerCase() === e.key.toLowerCase());
  if (tool) selectTool(tool.id);
}

// ── Tool + control state ─────────────────────────────────────────────────

function selectTool(id) {
  cancelDraft();
  if (state.tool === 'crop' && id !== 'crop') cancelCrop();
  state.tool = id;
  state.selectedIndex = -1;
  clearScratch();

  for (const button of el.rail.querySelectorAll('.tool')) {
    button.setAttribute('aria-pressed', String(button.dataset.tool === id));
  }
  el.scratch.dataset.tool = id;

  // Controls the active tool does not use are REMOVED, not disabled —
  // disabled controls are noise that teach nothing.
  const controls = TOOL_CONTROLS[id] || [];
  el.colorGroup.hidden = !controls.includes('color');
  el.widthGroup.hidden = !controls.includes('width');
  el.fontGroup.hidden = !controls.includes('font');
  el.radiusGroup.hidden = !controls.includes('radius');
  el.fillGroup.hidden = !controls.includes('fill');
  el.cropGroup.hidden = !controls.includes('crop');
}

function setColor(value) {
  state.color = value;
  for (const swatch of el.swatches.querySelectorAll('.swatch')) {
    swatch.setAttribute('aria-checked', String(swatch.dataset.color === value));
  }
}

function setWidth(value) {
  state.width = Math.min(24, Math.max(1, value));
  el.widthRange.value = state.width;
  el.widthValue.textContent = state.width;
}

// ── Pointer handling ─────────────────────────────────────────────────────

function pointFrom(e) {
  const rect = el.scratch.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / state.zoom,
    y: (e.clientY - rect.top) / state.zoom,
  };
}

function onPointerDown(e) {
  if (e.button !== 0 || !state.source) return;
  el.scratch.setPointerCapture(e.pointerId);
  const p = pointFrom(e);

  if (state.tool === 'select') {
    state.selectedIndex = hitTest(p);
    if (state.selectedIndex >= 0) {
      const box = boundsOf(state.layers[state.selectedIndex]);
      state.dragOffset = { x: p.x - box.x, y: p.y - box.y };
    }
    drawScratch();
    return;
  }

  if (state.tool === 'text') {
    openTextEntry(p);
    return;
  }

  if (state.tool === 'step') {
    state.layers.push({
      kind: 'step',
      x: p.x,
      y: p.y,
      n: state.stepCounter++,
      color: state.color,
      fontSize: state.fontSize,
    });
    commit();
    return;
  }

  state.draft = startShape(state.tool, p);
  drawScratch();
}

function onPointerMove(e) {
  if (!state.source) return;
  const p = pointFrom(e);

  if (state.tool === 'select' && state.selectedIndex >= 0 && state.dragOffset && e.buttons) {
    moveShape(state.layers[state.selectedIndex], p.x - state.dragOffset.x, p.y - state.dragOffset.y);
    render();
    drawScratch();
    return;
  }

  if (!state.draft) return;
  updateShape(state.draft, p);
  drawScratch();
}

function onPointerUp(e) {
  if (!state.source) return;
  try {
    el.scratch.releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }

  if (state.tool === 'select') {
    if (state.dragOffset) {
      state.dragOffset = null;
      commit();
    }
    return;
  }

  if (!state.draft) return;
  const shape = state.draft;
  state.draft = null;

  if (shape.kind === 'crop') {
    if (Math.abs(shape.w) > 8 && Math.abs(shape.h) > 8) {
      state.cropRect = normalise(shape);
      drawScratch();
    } else {
      state.cropRect = null;
      clearScratch();
    }
    return;
  }

  if (isDegenerate(shape)) {
    clearScratch();
    return;
  }

  state.layers.push(shape);
  commit();
}

function startShape(tool, p) {
  const common = { color: state.color, width: state.width };
  switch (tool) {
    case 'crop':
      return { kind: 'crop', x: p.x, y: p.y, w: 0, h: 0 };
    case 'arrow':
    case 'line':
      return { kind: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, ...common };
    case 'rect':
    case 'ellipse':
      return { kind: tool, x: p.x, y: p.y, w: 0, h: 0, ...common, filled: state.filled };
    case 'pen':
    case 'highlight':
      return { kind: tool, points: [p], ...common };
    case 'blur':
    case 'pixelate':
      return { kind: tool, x: p.x, y: p.y, w: 0, h: 0, radius: state.radius };
    default:
      return null;
  }
}

function updateShape(shape, p) {
  switch (shape.kind) {
    case 'arrow':
    case 'line':
      shape.x2 = p.x;
      shape.y2 = p.y;
      break;
    case 'pen':
    case 'highlight':
      shape.points.push(p);
      break;
    default:
      shape.w = p.x - shape.x;
      shape.h = p.y - shape.y;
  }
}

function isDegenerate(shape) {
  if (shape.kind === 'pen' || shape.kind === 'highlight') return shape.points.length < 2;
  if (shape.kind === 'arrow' || shape.kind === 'line') {
    return Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) < 3;
  }
  return Math.abs(shape.w) < 3 || Math.abs(shape.h) < 3;
}

function normalise(shape) {
  return {
    x: shape.w < 0 ? shape.x + shape.w : shape.x,
    y: shape.h < 0 ? shape.y + shape.h : shape.y,
    w: Math.abs(shape.w),
    h: Math.abs(shape.h),
  };
}

// ── Text entry ───────────────────────────────────────────────────────────

function openTextEntry(p) {
  state.textAnchor = p;
  el.textEntry.hidden = false;
  el.textEntry.style.left = `${p.x * state.zoom}px`;
  el.textEntry.style.top = `${p.y * state.zoom}px`;
  el.textInput.value = '';
  el.textInput.style.fontSize = `${Math.max(12, state.fontSize * state.zoom)}px`;
  el.textInput.style.color = state.color;
  el.textInput.focus();
  autoGrowTextarea();
}

function closeTextEntry() {
  el.textEntry.hidden = true;
  el.textInput.value = '';
  state.textAnchor = null;
}

function onTextKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeTextEntry();
    return;
  }
  // Enter commits; Shift+Enter adds a line, which is what a multi-line
  // annotation needs.
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = el.textInput.value.trim();
    if (text && state.textAnchor) {
      state.layers.push({
        kind: 'text',
        x: state.textAnchor.x,
        y: state.textAnchor.y,
        text,
        color: state.color,
        fontSize: state.fontSize,
      });
      commit();
    }
    closeTextEntry();
  }
}

function autoGrowTextarea() {
  el.textInput.style.height = 'auto';
  el.textInput.style.height = `${el.textInput.scrollHeight}px`;
}

// ── Rendering ────────────────────────────────────────────────────────────

function render() {
  if (!state.source) return;
  baseCtx.clearRect(0, 0, el.base.width, el.base.height);
  baseCtx.drawImage(state.source, 0, 0);
  for (const shape of state.layers) drawShape(baseCtx, shape);
}

function clearScratch() {
  scratchCtx.clearRect(0, 0, el.scratch.width, el.scratch.height);
}

function drawScratch() {
  clearScratch();
  if (state.draft) {
    if (state.draft.kind === 'crop') drawCropOverlay(scratchCtx, normalise(state.draft));
    else drawShape(scratchCtx, state.draft);
  } else if (state.cropRect) {
    drawCropOverlay(scratchCtx, state.cropRect);
  }
  if (state.selectedIndex >= 0 && state.layers[state.selectedIndex]) {
    drawSelection(scratchCtx, boundsOf(state.layers[state.selectedIndex]));
  }
}

function drawShape(ctx, shape) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = shape.width || 1;

  switch (shape.kind) {
    case 'line':
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      break;

    case 'arrow':
      drawArrow(ctx, shape);
      break;

    case 'rect': {
      const r = normalise(shape);
      if (shape.filled) ctx.fillRect(r.x, r.y, r.w, r.h);
      else ctx.strokeRect(r.x, r.y, r.w, r.h);
      break;
    }

    case 'ellipse': {
      const r = normalise(shape);
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      shape.filled ? ctx.fill() : ctx.stroke();
      break;
    }

    case 'pen':
      strokePoints(ctx, shape.points);
      break;

    case 'highlight':
      // Multiply keeps the underlying text legible through the highlight,
      // which is the whole point of a highlighter.
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = (shape.width || 4) * 4;
      strokePoints(ctx, shape.points);
      break;

    case 'text':
      drawText(ctx, shape);
      break;

    case 'step':
      drawStep(ctx, shape);
      break;

    case 'blur':
      drawBlur(ctx, normalise(shape), shape.radius);
      break;

    case 'pixelate':
      drawPixelate(ctx, normalise(shape), shape.radius);
      break;

    default:
      break;
  }
  ctx.restore();
}

function strokePoints(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  // Quadratic midpoints smooth the polyline without storing control points.
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

function drawArrow(ctx, shape) {
  const { x1, y1, x2, y2 } = shape;
  const w = shape.width || 4;
  const head = Math.max(10, w * 3.6);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  // Stop the shaft short of the tip so the head reads as solid rather than
  // showing a stroke seam through it.
  const shaftEnd = {
    x: x2 - Math.cos(angle) * head * 0.72,
    y: y2 - Math.sin(angle) * head * 0.72,
  };

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(shaftEnd.x, shaftEnd.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - Math.cos(angle - Math.PI / 7) * head,
    y2 - Math.sin(angle - Math.PI / 7) * head
  );
  ctx.lineTo(
    x2 - Math.cos(angle + Math.PI / 7) * head,
    y2 - Math.sin(angle + Math.PI / 7) * head
  );
  ctx.closePath();
  ctx.fill();
}

function drawText(ctx, shape) {
  const size = shape.fontSize || 28;
  ctx.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'top';
  const lines = String(shape.text).split('\n');
  // A dark halo keeps light text readable over a light screenshot and vice
  // versa, without forcing the user to think about contrast.
  ctx.lineWidth = Math.max(3, size / 8);
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = shape.y + i * size * 1.22;
    ctx.strokeText(line, shape.x, y);
  });
  ctx.fillStyle = shape.color;
  lines.forEach((line, i) => {
    const y = shape.y + i * size * 1.22;
    ctx.fillText(line, shape.x, y);
  });
}

function drawStep(ctx, shape) {
  const r = Math.max(14, (shape.fontSize || 28) * 0.62);
  ctx.beginPath();
  ctx.arc(shape.x, shape.y, r, 0, Math.PI * 2);
  ctx.fillStyle = shape.color;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(r * 1.15)}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(shape.n), shape.x, shape.y + r * 0.04);
}

/**
 * Blur samples from the ORIGINAL image, not the composite, so redactions stay
 * predictable no matter what has been drawn over the page.
 * A margin around the region is included so the blur kernel has real pixels
 * to work with at the edges instead of fading to transparent.
 */
function drawBlur(ctx, r, radius) {
  if (r.w < 1 || r.h < 1) return;
  const m = Math.ceil(radius * 2);
  const tw = Math.ceil(r.w + m * 2);
  const th = Math.ceil(r.h + m * 2);
  const tmp = document.createElement('canvas');
  tmp.width = tw;
  tmp.height = th;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(state.source, r.x - m, r.y - m, tw, th, 0, 0, tw, th);

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(tmp, r.x - m, r.y - m);
  ctx.restore();
}

/**
 * Pixelate downsamples then upsamples with smoothing off — the classic mosaic.
 * Unlike blur it is not reversible by sharpening, which matters when the point
 * is to destroy information rather than obscure it.
 */
function drawPixelate(ctx, r, size) {
  if (r.w < 1 || r.h < 1) return;
  const cell = Math.max(3, size);
  const sw = Math.max(1, Math.round(r.w / cell));
  const sh = Math.max(1, Math.round(r.h / cell));
  const tmp = document.createElement('canvas');
  tmp.width = sw;
  tmp.height = sh;
  const tctx = tmp.getContext('2d');
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(state.source, r.x, r.y, r.w, r.h, 0, 0, sw, sh);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, sw, sh, r.x, r.y, r.w, r.h);
  ctx.restore();
}

function drawCropOverlay(ctx, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(9,11,16,.55)';
  ctx.fillRect(0, 0, el.scratch.width, el.scratch.height);
  ctx.clearRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#7A5CFF';
  ctx.lineWidth = Math.max(1.5, 2 / state.zoom);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

function drawSelection(ctx, box) {
  ctx.save();
  ctx.strokeStyle = '#FFB020';
  ctx.lineWidth = Math.max(1.5, 2 / state.zoom);
  ctx.setLineDash([6 / state.zoom, 4 / state.zoom]);
  ctx.strokeRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
  ctx.restore();
}

// ── Selection helpers ────────────────────────────────────────────────────

function boundsOf(shape) {
  switch (shape.kind) {
    case 'arrow':
    case 'line':
      return {
        x: Math.min(shape.x1, shape.x2),
        y: Math.min(shape.y1, shape.y2),
        w: Math.abs(shape.x2 - shape.x1),
        h: Math.abs(shape.y2 - shape.y1),
      };
    case 'pen':
    case 'highlight': {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };
    }
    case 'text': {
      const size = shape.fontSize || 28;
      const lines = String(shape.text).split('\n');
      const longest = Math.max(...lines.map((l) => l.length));
      return { x: shape.x, y: shape.y, w: longest * size * 0.56, h: lines.length * size * 1.22 };
    }
    case 'step': {
      const r = Math.max(14, (shape.fontSize || 28) * 0.62);
      return { x: shape.x - r, y: shape.y - r, w: r * 2, h: r * 2 };
    }
    default:
      return normalise(shape);
  }
}

function hitTest(p) {
  // Topmost first: the shape drawn last is the one the user sees on top.
  for (let i = state.layers.length - 1; i >= 0; i -= 1) {
    const b = boundsOf(state.layers[i]);
    const pad = 6;
    if (
      p.x >= b.x - pad &&
      p.x <= b.x + b.w + pad &&
      p.y >= b.y - pad &&
      p.y <= b.y + b.h + pad
    ) {
      return i;
    }
  }
  return -1;
}

function moveShape(shape, x, y) {
  const b = boundsOf(shape);
  const dx = x - b.x;
  const dy = y - b.y;
  switch (shape.kind) {
    case 'arrow':
    case 'line':
      shape.x1 += dx;
      shape.y1 += dy;
      shape.x2 += dx;
      shape.y2 += dy;
      break;
    case 'pen':
    case 'highlight':
      shape.points = shape.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
      break;
    default:
      shape.x += dx;
      shape.y += dy;
  }
}

// ── Crop ─────────────────────────────────────────────────────────────────

function applyCrop() {
  if (!state.cropRect) {
    toast('Drag on the image to choose a crop area first.');
    return;
  }
  const r = state.cropRect;
  const w = Math.round(Math.min(r.w, state.source.width - r.x));
  const h = Math.round(Math.min(r.h, state.source.height - r.y));
  if (w < 4 || h < 4) {
    cancelCrop();
    return;
  }

  // Bake the current composite, then adopt the crop as the new source. The
  // previous source stays referenced by the history entry, so undo is exact.
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d').drawImage(el.base, Math.round(r.x), Math.round(r.y), w, h, 0, 0, w, h);

  createImageBitmap(out).then((bitmap) => {
    state.source = bitmap;
    state.layers = [];
    state.cropRect = null;
    sizeCanvases(w, h);
    commit();
    fitToWindow();
    el.metaDims.textContent = `${w} × ${h}`;
    selectTool('arrow');
    toast(`Cropped to ${w} × ${h}`, 'success');
  });
}

function cancelCrop() {
  state.cropRect = null;
  state.draft = null;
  clearScratch();
}

// ── History ──────────────────────────────────────────────────────────────

function snapshot() {
  return {
    source: state.source,
    layers: state.layers.map((s) => ({
      ...s,
      points: s.points ? s.points.map((p) => ({ ...p })) : undefined,
    })),
    width: el.base.width,
    height: el.base.height,
    stepCounter: state.stepCounter,
  };
}

function pushHistory() {
  // Drop any redo branch — the user has taken a new path.
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot());
  // Bound the history so a long session cannot grow without limit.
  if (state.history.length > 120) state.history.shift();
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

function commit() {
  render();
  drawScratch();
  pushHistory();
}

function restore(entry) {
  state.source = entry.source;
  state.layers = entry.layers.map((s) => ({
    ...s,
    points: s.points ? s.points.map((p) => ({ ...p })) : undefined,
  }));
  state.stepCounter = entry.stepCounter;
  if (el.base.width !== entry.width || el.base.height !== entry.height) {
    sizeCanvases(entry.width, entry.height);
    el.metaDims.textContent = `${entry.width} × ${entry.height}`;
  }
  state.selectedIndex = -1;
  render();
  clearScratch();
  updateHistoryButtons();
  applyZoom();
}

function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex -= 1;
  restore(state.history[state.historyIndex]);
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex += 1;
  restore(state.history[state.historyIndex]);
}

function updateHistoryButtons() {
  el.btnUndo.disabled = state.historyIndex <= 0;
  el.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
}

function cancelDraft() {
  state.draft = null;
  closeTextEntry();
}

// ── Zoom ─────────────────────────────────────────────────────────────────

function setZoom(value, mode = 'manual') {
  state.zoom = Math.min(4, Math.max(0.05, value));
  state.zoomMode = mode;
  applyZoom();
}

function applyZoom() {
  const w = el.base.width * state.zoom;
  const h = el.base.height * state.zoom;
  for (const canvas of [el.base, el.scratch]) {
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  el.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
}

function fitToWindow() {
  if (!state.source) return;
  const pad = 44;
  const availableW = el.stage.clientWidth - pad;
  const availableH = el.stage.clientHeight - pad;
  const scale = Math.min(availableW / el.base.width, availableH / el.base.height, 1);
  setZoom(scale, 'fit');
}

// ── Export ───────────────────────────────────────────────────────────────

function updateSaveLabel(format) {
  el.saveLabel.textContent = `Save ${String(format).toUpperCase()}`;
}

function toggleFormatMenu(force) {
  const open = force ?? el.formatMenu.hidden;
  el.formatMenu.hidden = !open;
  el.btnFormats.setAttribute('aria-expanded', String(open));
}

async function exportAs(format) {
  try {
    setBusy(true);
    const blob = format === FORMAT.PDF ? await makePdf() : await makeImage(format);
    const filename = renderFilename(
      state.settings.filenameTemplate,
      {
        url: state.meta?.url,
        title: state.meta?.title,
        width: el.base.width,
        height: el.base.height,
        mode: state.meta?.mode,
      },
      format
    );
    await download(blob, filename);
    toast(`Saved as ${filename}`, 'success');
  } catch (err) {
    console.error('[Tallshot] export failed', err);
    toast("Couldn't save that file. Try PNG instead.", 'error');
  } finally {
    setBusy(false);
  }
}

function makeImage(format) {
  const quality = Math.min(1, Math.max(0.4, (state.settings.quality || 92) / 100));
  return new Promise((resolve, reject) => {
    el.base.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      MIME[format] || 'image/png',
      format === FORMAT.PNG ? undefined : quality
    );
  });
}

/**
 * PDF export.
 *
 * Paginated A4 by default: a 9,000px landing page becomes a readable,
 * printable document instead of one absurdly long page. Each slice is encoded
 * as JPEG and embedded verbatim via DCTDecode — see lib/pdf.js.
 */
async function makePdf() {
  const layout = state.settings.pdfLayout || PDF_LAYOUT.PAGINATED;
  const { slices } = planPdfPages({
    width: el.base.width,
    height: el.base.height,
    layout,
  });
  const quality = Math.min(1, Math.max(0.5, (state.settings.quality || 92) / 100));

  const pages = [];
  for (const slice of slices) {
    const canvas = document.createElement('canvas');
    canvas.width = el.base.width;
    canvas.height = slice.sh;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      el.base,
      0, slice.sy, el.base.width, slice.sh,
      0, 0, el.base.width, slice.sh
    );

    const jpegBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    pages.push({
      jpeg: new Uint8Array(await jpegBlob.arrayBuffer()),
      pxWidth: canvas.width,
      pxHeight: canvas.height,
      ptWidth: slice.ptWidth,
      ptHeight: slice.ptHeight,
    });
  }

  return buildPdf(pages, { title: state.meta?.title || 'Screenshot' });
}

async function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
  } finally {
    // Give Chrome a moment to read the blob before the URL is revoked.
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }
}

async function copyToClipboard() {
  try {
    const blob = await makeImage(FORMAT.PNG);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('Copied to clipboard', 'success');
  } catch {
    toast('Click the page once, then try copying again.', 'error');
  }
}

function setBusy(busy) {
  el.btnSave.disabled = busy;
  el.saveLabel.textContent = busy ? 'Saving…' : `Save ${String(state.settings.defaultFormat).toUpperCase()}`;
}

// ── Feedback ─────────────────────────────────────────────────────────────

let toastTimer = null;

function toast(message, kind = 'info') {
  el.toast.textContent = message;
  el.toast.dataset.kind = kind;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 2800);
}

function showEmpty(message) {
  if (message) el.emptyText.textContent = message;
  el.empty.hidden = false;
  el.ctx.hidden = true;
  el.rail.hidden = true;
}

/**
 * The editor is always dark, regardless of the user's theme setting.
 *
 * This is a deliberate exception, not an oversight: a screenshot is almost
 * always a bright web page, and a light surround both distorts colour
 * judgement and makes crop boundaries hard to see. The theme preference
 * governs the popup and options page, where it is a document rather than a
 * canvas. Documented in docs/branding.md §4.
 */
function applyTheme() {
  document.documentElement.dataset.theme = 'dark';
}

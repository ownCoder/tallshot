/**
 * Tallshot — frame stitching.
 *
 * Runs inside the MV3 service worker. OffscreenCanvas and createImageBitmap
 * are both available there, so no `offscreen` permission and no hidden
 * document are needed.
 *
 * Two details here are what separate a correct stitch from the classic broken
 * one seen across this category:
 *
 *   1. Frames are placed at their ACTUAL scroll offset, recorded after the
 *      scroll settled — never the offset we asked for. The last frame of a
 *      page almost never scrolls a full step because the page runs out, so
 *      placing it at the intended offset duplicates a band of content at the
 *      bottom. Drawing at the real offset makes the overlap paint over itself,
 *      which is correct by construction.
 *
 *   2. Only one ImageBitmap is alive at a time. Each is closed immediately
 *      after being drawn, so peak memory is roughly the destination canvas
 *      plus a single frame rather than every frame at once. On a 40-frame
 *      page that is the difference between ~200MB and ~2GB.
 */

import { LIMITS } from './constants.js';
import { TallshotError, CODE } from './errors.js';

/**
 * @typedef {{dataUrl: string, y: number}} Frame  y is CSS px, actual offset.
 *
 * @param {object} opts
 * @param {Frame[]} opts.frames
 * @param {number} opts.width        Page width in CSS px
 * @param {number} opts.height       Page height in CSS px
 * @param {number} opts.dpr          devicePixelRatio at capture time
 * @param {(n: number) => void} [opts.onProgress]
 * @returns {Promise<{blob: Blob, width: number, height: number,
 *                    downscaled: boolean, scale: number}>}
 */
export async function stitchFrames({ frames, width, height, dpr, onProgress }) {
  if (!frames?.length) throw new TallshotError(CODE.UNKNOWN);

  // Work in device pixels so HiDPI output is genuinely sharp rather than an
  // upscaled blur.
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);

  const scale = fitScale(targetW, targetH);
  const canvasW = Math.max(1, Math.floor(targetW * scale));
  const canvasH = Math.max(1, Math.floor(targetH * scale));

  const canvas = new OffscreenCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new TallshotError(CODE.ENCODE_FAILED);

  // A white ground means a page with transparent regions exports as white
  // rather than black, which is what users expect from a "screenshot".
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    let bitmap;
    try {
      bitmap = await dataUrlToBitmap(frame.dataUrl);
    } catch {
      // A single unreadable frame leaves a gap; the rest of the capture is
      // still worth delivering.
      continue;
    }
    try {
      const dy = Math.round(frame.y * dpr * scale);
      const dw = Math.round(bitmap.width * scale);
      const dh = Math.round(bitmap.height * scale);
      ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, dy, dw, dh);
    } finally {
      bitmap.close();
    }
    onProgress?.((i + 1) / frames.length);
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return {
    blob,
    width: canvasW,
    height: canvasH,
    downscaled: scale < 1,
    scale,
  };
}

/** Wrap a single captured frame (visible-area mode) without stitching. */
export async function frameToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Crop a captured frame to a region, in CSS pixels.
 * Used by region mode, where we capture the viewport then cut out the box.
 */
export async function cropFrame({ dataUrl, rect, dpr }) {
  const bitmap = await dataUrlToBitmap(dataUrl);
  try {
    const sx = Math.max(0, Math.round(rect.x * dpr));
    const sy = Math.max(0, Math.round(rect.y * dpr));
    const sw = Math.min(bitmap.width - sx, Math.round(rect.width * dpr));
    const sh = Math.min(bitmap.height - sy, Math.round(rect.height * dpr));
    if (sw <= 0 || sh <= 0) throw new TallshotError(CODE.UNKNOWN);

    const canvas = new OffscreenCanvas(sw, sh);
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sw, sh);
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return { blob, width: sw, height: sh, downscaled: false, scale: 1 };
  } finally {
    bitmap.close();
  }
}

async function dataUrlToBitmap(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

/**
 * Largest scale ≤ 1 that fits Chrome's canvas ceilings.
 *
 * Chrome caps both a single side (~16384px) and the total area. Exceeding
 * either yields a blank canvas with no error thrown — the silent failure that
 * produces "the bottom half is missing" reviews across this category. We
 * detect it up front and scale deliberately, then tell the user the exact
 * percentage.
 */
export function fitScale(width, height) {
  let scale = 1;
  const maxSide = LIMITS.MAX_CANVAS_DIMENSION;
  if (width > maxSide) scale = Math.min(scale, maxSide / width);
  if (height > maxSide) scale = Math.min(scale, maxSide / height);

  const area = width * scale * (height * scale);
  if (area > LIMITS.MAX_CANVAS_AREA) {
    scale *= Math.sqrt(LIMITS.MAX_CANVAS_AREA / area);
  }
  return scale;
}

/**
 * Tallshot — icon generator.
 *
 * Renders the icon set from code rather than shipping a binary someone has to
 * trust. Every pixel is ours; there is no third-party artwork in the package.
 *
 * The mark is drawn per size with an explicit simplification ladder — content
 * lines are dropped below 48px because at 16px they turn to mud. Downscaling
 * one master would produce exactly that mud, which is why each size is drawn
 * rather than resampled.
 *
 * Anti-aliasing is by 8x supersampling: geometry is tested at sub-pixel
 * resolution and box-filtered down.
 *
 * Run: npm run icons
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng } from './png.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'assets', 'icons');

const SS = 8; // supersampling factor

/** Brand colours, from docs/branding.md. */
const VIOLET_LIGHT = [0x9b, 0x85, 0xff];
const VIOLET_DEEP = [0x5b, 0x3f, 0xe0];
const WHITE = [0xff, 0xff, 0xff];
const AMBER = [0xff, 0xb0, 0x20];
const LINE = [0x5b, 0x3f, 0xe0];

/**
 * Icon geometry in normalised 0..1 space.
 *
 * Each size gets its OWN geometry rather than a scaled copy of one master.
 * A design tuned for 128px, shrunk to 16px, turns into a violet blob: the
 * page panel and the chevron both fall below the ~2px threshold where a shape
 * still reads. Small sizes therefore get a larger panel, a chunkier chevron
 * and less badge padding — the mark stays recognisable instead of staying
 * "accurate".
 */
const GEO_BY_SIZE = {
  16: {
    badgeRadius: 0.2,
    page: { x0: 0.22, y0: 0.09, x1: 0.78, y1: 0.56, r: 0.06 },
    chevron: { cx: 0.5, top: 0.6, bottom: 0.94, halfWidth: 0.28 },
    lines: [],
    lineThickness: 0.09,
  },
  32: {
    badgeRadius: 0.21,
    page: { x0: 0.24, y0: 0.09, x1: 0.76, y1: 0.6, r: 0.06 },
    chevron: { cx: 0.5, top: 0.64, bottom: 0.93, halfWidth: 0.24 },
    lines: [
      { y: 0.24, x0: 0.32, x1: 0.68 },
      { y: 0.42, x0: 0.32, x1: 0.56 },
    ],
    lineThickness: 0.075,
  },
  48: {
    badgeRadius: 0.22,
    page: { x0: 0.26, y0: 0.09, x1: 0.74, y1: 0.62, r: 0.055 },
    chevron: { cx: 0.5, top: 0.66, bottom: 0.92, halfWidth: 0.21 },
    lines: [
      { y: 0.2, x0: 0.33, x1: 0.67 },
      { y: 0.33, x0: 0.33, x1: 0.57 },
      { y: 0.46, x0: 0.33, x1: 0.67 },
    ],
    lineThickness: 0.055,
  },
  128: {
    badgeRadius: 0.22,
    page: { x0: 0.28, y0: 0.1, x1: 0.72, y1: 0.64, r: 0.05 },
    chevron: { cx: 0.5, top: 0.68, bottom: 0.91, halfWidth: 0.19 },
    lines: [
      { y: 0.18, x0: 0.34, x1: 0.66 },
      { y: 0.28, x0: 0.34, x1: 0.56 },
      { y: 0.38, x0: 0.34, x1: 0.66 },
      { y: 0.48, x0: 0.34, x1: 0.5 },
    ],
    lineThickness: 0.042,
  },
};

const SIZES = [16, 32, 48, 128];

function insideRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const rx = Math.min(r, (x1 - x0) / 2);
  const ry = Math.min(r, (y1 - y0) / 2);
  // Only the four corner boxes need the ellipse test.
  const cx = x < x0 + rx ? x0 + rx : x > x1 - rx ? x1 - rx : null;
  const cy = y < y0 + ry ? y0 + ry : y > y1 - ry ? y1 - ry : null;
  if (cx === null || cy === null) return true;
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function insideChevron(x, y, g) {
  const { cx, top, bottom, halfWidth } = g;
  if (y < top || y > bottom) return false;
  // A downward triangle: half-width shrinks linearly to zero at the tip.
  const t = (y - top) / (bottom - top);
  const w = halfWidth * (1 - t);
  return Math.abs(x - cx) <= w;
}

/** Linear gradient from top-left to bottom-right across the badge. */
function badgeColour(x, y) {
  const t = Math.min(1, Math.max(0, (x + y) / 2));
  return [
    Math.round(VIOLET_LIGHT[0] + (VIOLET_DEEP[0] - VIOLET_LIGHT[0]) * t),
    Math.round(VIOLET_LIGHT[1] + (VIOLET_DEEP[1] - VIOLET_LIGHT[1]) * t),
    Math.round(VIOLET_LIGHT[2] + (VIOLET_DEEP[2] - VIOLET_LIGHT[2]) * t),
  ];
}

/**
 * Colour at a normalised point, or null when outside the badge.
 * Layers are resolved back to front: badge, page, content lines, chevron.
 */
function sample(x, y, geo) {
  if (!insideRoundedRect(x, y, 0, 0, 1, 1, geo.badgeRadius)) return null;

  if (insideChevron(x, y, geo.chevron)) return AMBER;

  const p = geo.page;
  if (insideRoundedRect(x, y, p.x0, p.y0, p.x1, p.y1, p.r)) {
    const half = geo.lineThickness / 2;
    for (const line of geo.lines) {
      if (y >= line.y - half && y <= line.y + half && x >= line.x0 && x <= line.x1) {
        // Content lines are a tint of the badge colour, not full strength —
        // full-strength lines fight the chevron for attention.
        return [
          Math.round(WHITE[0] + (LINE[0] - WHITE[0]) * 0.55),
          Math.round(WHITE[1] + (LINE[1] - WHITE[1]) * 0.55),
          Math.round(WHITE[2] + (LINE[2] - WHITE[2]) * 0.55),
        ];
      }
    }
    return WHITE;
  }

  return badgeColour(x, y);
}

function renderIcon(size) {
  const geo = GEO_BY_SIZE[size];
  const rgba = new Uint8Array(size * size * 4);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          const colour = sample(x, y, geo);
          if (colour) {
            r += colour[0];
            g += colour[1];
            b += colour[2];
            a += 1;
          }
        }
      }

      const total = SS * SS;
      const offset = (py * size + px) * 4;
      if (a === 0) {
        rgba[offset + 3] = 0;
      } else {
        // Average only over covered samples so edge pixels keep full colour
        // and vary in alpha — averaging over all samples would darken edges.
        rgba[offset] = Math.round(r / a);
        rgba[offset + 1] = Math.round(g / a);
        rgba[offset + 2] = Math.round(b / a);
        rgba[offset + 3] = Math.round((a / total) * 255);
      }
    }
  }

  return encodePng(rgba, size, size);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const png = renderIcon(size);
  const path = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`  icon-${size}.png  ${String(png.length).padStart(6)} bytes`);
}

console.log(`\nWrote ${SIZES.length} icons to assets/icons/`);

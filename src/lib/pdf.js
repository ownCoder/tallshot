/**
 * Tallshot — minimal PDF writer.
 *
 * Writes a PDF 1.4 file containing one JPEG image per page, using DCTDecode
 * so the JPEG bytes are embedded verbatim with no re-encoding. That keeps the
 * output small and the code short.
 *
 * Why hand-written rather than a library:
 *   - A bundled PDF library is 100-300KB of third-party code for a feature we
 *     use in exactly one way. This is roughly 200 lines.
 *   - It is a third-party asset with a licence attached. Shipping only code we
 *     own is a deliberate policy after the August 2026 GoFullPage removal,
 *     which was a copyright dispute over a bundled design element.
 *   - MV3 forbids remote code, so a CDN is not an option anyway.
 *
 * Offsets in the cross-reference table must be byte-exact, so the file is
 * assembled as a list of Uint8Array chunks with a running byte count rather
 * than as a string (a JS string length is not a byte length once any
 * multi-byte character appears).
 */

/** ISO 216 A4 in PostScript points (1pt = 1/72in). */
export const A4 = Object.freeze({ width: 595.276, height: 841.89 });

/** Acrobat refuses pages larger than 200 inches on a side. */
const MAX_PAGE_PT = 14400;

const enc = new TextEncoder();

/**
 * Build a PDF from pre-encoded JPEG pages.
 *
 * @param {Array<{jpeg: Uint8Array, pxWidth: number, pxHeight: number,
 *                ptWidth: number, ptHeight: number}>} pages
 * @param {{title?: string}} [meta]
 * @returns {Blob}
 */
export function buildPdf(pages, meta = {}) {
  if (!pages?.length) throw new Error('buildPdf: no pages');

  const chunks = [];
  let offset = 0;
  /** Byte offset of each object, indexed by object number. */
  const xref = [];

  const push = (bytes) => {
    const arr = bytes instanceof Uint8Array ? bytes : enc.encode(bytes);
    chunks.push(arr);
    offset += arr.length;
  };

  const beginObject = (id) => {
    xref[id] = offset;
    push(`${id} 0 obj\n`);
  };

  // Object numbering: 1 = Catalog, 2 = Pages, then three objects per page.
  const pageObjId = (i) => 3 + i * 3;
  const contentObjId = (i) => 4 + i * 3;
  const imageObjId = (i) => 5 + i * 3;
  const infoObjId = 3 + pages.length * 3;
  const totalObjects = infoObjId;

  push('%PDF-1.4\n');
  // A comment of high-bit bytes marks the file as binary for transfer tools.
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // 1 — Catalog
  beginObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2 — Page tree
  const kids = pages.map((_, i) => `${pageObjId(i)} 0 R`).join(' ');
  beginObject(2);
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((page, i) => {
    const w = round(page.ptWidth);
    const h = round(page.ptHeight);

    // Page
    beginObject(pageObjId(i));
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] ` +
        `/Resources << /XObject << /Im0 ${imageObjId(i)} 0 R >> >> ` +
        `/Contents ${contentObjId(i)} 0 R >>\nendobj\n`
    );

    // Content stream: place the image to fill the page.
    // The cm matrix [a b c d e f] scales the 1x1 unit image space to the page.
    const stream = `q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
    const streamBytes = enc.encode(stream);
    beginObject(contentObjId(i));
    push(`<< /Length ${streamBytes.length} >>\nstream\n`);
    push(streamBytes);
    push('endstream\nendobj\n');

    // Image XObject — the JPEG bytes pass through untouched via DCTDecode.
    beginObject(imageObjId(i));
    push(
      `<< /Type /XObject /Subtype /Image /Name /Im0 ` +
        `/Width ${page.pxWidth} /Height ${page.pxHeight} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`
    );
    push(page.jpeg);
    push('\nendstream\nendobj\n');
  });

  // Document information dictionary.
  beginObject(infoObjId);
  push(
    `<< /Producer (Tallshot) /Creator (Tallshot) ` +
      `/Title (${pdfString(meta.title || 'Screenshot')}) ` +
      `/CreationDate (${pdfDate(meta.now instanceof Date ? meta.now : new Date())}) >>\nendobj\n`
  );

  // Cross-reference table.
  const xrefOffset = offset;
  push(`xref\n0 ${totalObjects + 1}\n`);
  push('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id += 1) {
    push(`${String(xref[id] ?? 0).padStart(10, '0')} 00000 n \n`);
  }

  push(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info ${infoObjId} 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Work out how to lay a tall image across pages.
 *
 * Paginated: the image is scaled to A4 width and sliced into A4-height pages.
 * This is what makes a 9,000px landing page actually printable and readable,
 * and is why FireShot's PDF output is well regarded.
 *
 * Single: one page matching the image's aspect ratio, clamped to Acrobat's
 * 200-inch ceiling. Faithful, but unwieldy for very long pages.
 *
 * @returns {{slices: Array<{sy: number, sh: number, ptWidth: number,
 *            ptHeight: number}>}}
 */
export function planPdfPages({ width, height, layout }) {
  if (layout === 'single') {
    let ptWidth = A4.width;
    let ptHeight = (height / width) * ptWidth;
    if (ptHeight > MAX_PAGE_PT) {
      // Too tall even for a single page — scale the whole thing down.
      const factor = MAX_PAGE_PT / ptHeight;
      ptHeight = MAX_PAGE_PT;
      ptWidth *= factor;
    }
    return { slices: [{ sy: 0, sh: height, ptWidth, ptHeight }] };
  }

  // Paginated (default).
  const ptPerPx = A4.width / width;
  const sliceHeightPx = Math.max(1, Math.floor(A4.height / ptPerPx));
  const slices = [];
  for (let sy = 0; sy < height; sy += sliceHeightPx) {
    const sh = Math.min(sliceHeightPx, height - sy);
    slices.push({
      sy,
      sh,
      ptWidth: A4.width,
      // A final short slice keeps its true proportion rather than being
      // stretched to a full page.
      ptHeight: sh * ptPerPx,
    });
  }
  return { slices };
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

/** Escape the characters that terminate or nest a PDF literal string. */
function pdfString(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Keep it to printable ASCII; non-ASCII would need UTF-16BE encoding and
    // a title is not worth that complexity.
    .replace(/[^\x20-\x7e]/g, '')
    .slice(0, 200);
}

/** PDF date format: D:YYYYMMDDHHmmSS. */
function pdfDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `D:${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

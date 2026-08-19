/**
 * Tallshot — runtime test harness.
 *
 * Two halves:
 *
 *   A. Pure unit tests in Node, for the modules that have no DOM dependency
 *      (filename templating, canvas-ceiling maths, PDF pagination, and the
 *      PDF writer's byte offsets).
 *
 *   B. Browser tests driven over the Chrome DevTools Protocol, with the real
 *      extension loaded. These verify the extension registers, the service
 *      worker boots clean, and — most importantly — that the capture agent
 *      measures, freezes and RESTORES a hostile page correctly.
 *
 * Part B is the one that matters. The capture engine's correctness on a page
 * with a sticky header and lazy images is the product's whole differentiator,
 * and it cannot be verified by reading the code.
 *
 * Run: npm run test:runtime
 */

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

import { renderFilename, sanitiseFilename } from '../src/lib/filename.js';
import { fitScale } from '../src/lib/stitch.js';
import { buildPdf, planPdfPages, A4 } from '../src/lib/pdf.js';
import { LIMITS } from '../src/lib/constants.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
/**
 * Scratch space lives in the OS temp directory, not the project.
 * A browser keeps its profile locked for a while after exit, so a fixed
 * path in the repo would fail to clear on the next run and leave litter
 * inside the folder we are about to package.
 */
const TMP = mkdtempSync(join(tmpdir(), 'tallshot-test-'));

const results = [];
let failed = 0;

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) failed += 1;
}

function section(title) {
  results.push({ section: title });
}

// ═══════════════════════════════════════════════════════════════════════
// Part A — pure unit tests
// ═══════════════════════════════════════════════════════════════════════

section('Filename templating');

{
  const now = new Date('2026-08-19T14:07:03');
  const name = renderFilename(
    'tallshot-{host}-{date}',
    { url: 'https://www.Example.com/pricing', now },
    'png'
  );
  check('renders host and date', name === 'tallshot-example-com-2026-08-19.png', name);

  const all = renderFilename(
    '{host}-{mode}-{width}x{height}-{time}',
    { url: 'https://sub.example.co.uk/a', mode: 'full', width: 1440, height: 8320, now },
    'pdf'
  );
  check(
    'renders every token',
    all === 'sub-example-co-uk-full-1440x8320-140703.pdf',
    all
  );

  check(
    'blocks path traversal',
    !sanitiseFilename('../../etc/passwd').includes('/') &&
      !sanitiseFilename('..\\..\\windows\\system32').includes('\\'),
    sanitiseFilename('../../etc/passwd')
  );
  check(
    'strips illegal characters',
    !/[<>:"/\\|?*]/.test(sanitiseFilename('a<b>c:d"e|f?g*h')),
    sanitiseFilename('a<b>c:d"e|f?g*h')
  );
  check('escapes reserved device names', sanitiseFilename('CON') === 'CON-capture');
  check('escapes reserved names case-insensitively', sanitiseFilename('nul') === 'nul-capture');
  check(
    'falls back when the template renders empty',
    renderFilename('{title}', { title: '' }, 'png').startsWith('tallshot-')
  );
  check(
    'transliterates accents',
    renderFilename('{title}', { title: 'Café Ünïcode' }, 'png') === 'cafe-unicode.png'
  );
  check('caps absurdly long names', sanitiseFilename('x'.repeat(500)).length <= 200);
}

section('Canvas ceiling');

{
  check('leaves an ordinary page untouched', fitScale(1440, 5000) === 1);
  check(
    'scales a page taller than the side limit',
    Math.abs(fitScale(1440, 40000) - LIMITS.MAX_CANVAS_DIMENSION / 40000) < 1e-9,
    String(fitScale(1440, 40000))
  );
  const scaled = fitScale(1440, 40000);
  check(
    'scaled height lands within the limit',
    Math.floor(40000 * scaled) <= LIMITS.MAX_CANVAS_DIMENSION
  );
  const wide = fitScale(30000, 30000);
  check(
    'respects the total area limit too',
    30000 * wide * (30000 * wide) <= LIMITS.MAX_CANVAS_AREA + 1
  );
  check('never scales up', fitScale(100, 100) === 1);
}

section('PDF pagination');

{
  const paginated = planPdfPages({ width: 1440, height: 8320, layout: 'paginated' });
  check('splits a long page across sheets', paginated.slices.length > 1, `${paginated.slices.length} pages`);
  check(
    'every slice is A4 wide',
    paginated.slices.every((s) => Math.abs(s.ptWidth - A4.width) < 0.01)
  );
  check(
    'slices cover the full height exactly once',
    paginated.slices.reduce((sum, s) => sum + s.sh, 0) === 8320
  );
  check(
    'the final slice keeps its true proportion',
    paginated.slices[paginated.slices.length - 1].ptHeight <= A4.height + 0.01
  );

  const single = planPdfPages({ width: 1440, height: 8320, layout: 'single' });
  check('single layout produces one page', single.slices.length === 1);
  check(
    'single layout preserves aspect ratio',
    Math.abs(single.slices[0].ptHeight / single.slices[0].ptWidth - 8320 / 1440) < 0.01
  );

  const absurd = planPdfPages({ width: 1000, height: 400000, layout: 'single' });
  check(
    'single layout clamps to the PDF page ceiling',
    absurd.slices[0].ptHeight <= 14400,
    String(absurd.slices[0].ptHeight)
  );
}

section('PDF writer');

{
  // A tiny but structurally valid JPEG: SOI, APP0/JFIF, EOI. Enough to be
  // embedded and referenced; we are testing our container, not a decoder.
  const jpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);

  const blob = buildPdf(
    [
      { jpeg, pxWidth: 100, pxHeight: 200, ptWidth: A4.width, ptHeight: A4.height },
      { jpeg, pxWidth: 100, pxHeight: 80, ptWidth: A4.width, ptHeight: 300 },
    ],
    { title: 'Test (with) parens \\ and backslash', now: new Date('2026-08-19T10:00:00') }
  );

  const bytes = Buffer.from(await blob.arrayBuffer());
  const text = bytes.toString('latin1');

  check('starts with a PDF header', text.startsWith('%PDF-1.4'));
  check('ends with EOF', text.trimEnd().endsWith('%%EOF'));
  check('declares both pages', /\/Count 2/.test(text));
  check('embeds JPEG via DCTDecode', /\/Filter \/DCTDecode/.test(text));
  check(
    'escapes parentheses in the title',
    text.includes('Test \\(with\\) parens'),
    'title escaping'
  );

  // The real risk in a hand-written PDF is a wrong byte offset in the xref
  // table, which most viewers tolerate silently and some reject outright.
  const startxrefMatch = text.match(/startxref\s+(\d+)/);
  check('has a startxref', Boolean(startxrefMatch));

  if (startxrefMatch) {
    const xrefOffset = Number(startxrefMatch[1]);
    check(
      'startxref points at the xref table',
      text.slice(xrefOffset, xrefOffset + 4) === 'xref',
      text.slice(xrefOffset, xrefOffset + 12)
    );

    const xrefBody = text.slice(xrefOffset);
    const header = xrefBody.match(/xref\s+0 (\d+)/);
    check('xref declares an object count', Boolean(header));

    if (header) {
      const count = Number(header[1]);
      const entryPattern = /(\d{10}) (\d{5}) ([nf])/g;
      const entries = [...xrefBody.matchAll(entryPattern)];
      check('xref lists every object', entries.length === count, `${entries.length}/${count}`);

      let offsetsValid = true;
      let firstBad = '';
      for (let id = 1; id < entries.length; id += 1) {
        const offset = Number(entries[id][1]);
        const at = text.slice(offset, offset + 20);
        if (!at.startsWith(`${id} 0 obj`)) {
          offsetsValid = false;
          firstBad = `object ${id} -> offset ${offset} -> ${JSON.stringify(at.slice(0, 14))}`;
          break;
        }
      }
      check('every xref offset points at its object', offsetsValid, firstBad);
    }
  }

  mkdirSync(TMP, { recursive: true });
  writeFileSync(join(TMP, 'writer-test.pdf'), bytes);
}

// ═══════════════════════════════════════════════════════════════════════
// Part B — browser tests over CDP
// ═══════════════════════════════════════════════════════════════════════

/**
 * Browser used to drive the extension tests.
 *
 * Stable Google Chrome now refuses --load-extension and
 * --disable-extensions-except outright ("not allowed in Google Chrome,
 * ignoring"), so it cannot side-load an unpacked extension from the command
 * line at all. Any other Chromium build — Edge, Chromium, Chrome for Testing —
 * still honours the flag and runs the identical extension platform, so the
 * tests below are just as valid there.
 *
 * Set BROWSER_PATH to override.
 */
const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome for Testing\\chrome.exe',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chromePath = BROWSER_CANDIDATES.find((p) => existsSync(p));

/** A deliberately hostile test page: sticky header, fixed widget, lazy images. */
const TEST_PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>Tallshot capture fixture</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: system-ui, sans-serif; }
  #nav { position: fixed; top: 0; left: 0; right: 0; height: 56px;
         background: #17202E; color: #fff; padding: 18px; z-index: 10; }
  #side { position: sticky; top: 70px; background: #EEF; padding: 10px; }
  #chat { position: fixed; right: 20px; bottom: 20px; width: 60px; height: 60px;
          border-radius: 50%; background: #3B6BFF; }
  .block { height: 700px; padding: 80px 20px; border-bottom: 1px solid #ddd; }
  img { width: 200px; height: 150px; background: #ccd; display: block; }
</style></head>
<body>
  <div id="nav">Fixed navigation</div>
  <div id="side">Sticky sidebar</div>
  <div class="block"><h1>Section 1</h1><img loading="lazy" alt="" /></div>
  <div class="block"><h1>Section 2</h1><img loading="lazy" alt="" /></div>
  <div class="block"><h1>Section 3</h1><img loading="lazy" alt="" /></div>
  <div class="block"><h1>Section 4</h1><img loading="lazy" alt="" /></div>
  <div id="chat"></div>
</body></html>`;

async function cdp() {
  section('Browser — extension load');

  if (!chromePath) {
    check(
      'a Chromium build that permits --load-extension is available',
      false,
      'set BROWSER_PATH (stable Chrome blocks the flag)'
    );
    return;
  }
  console.log(`Driving extension tests with: ${chromePath}\n`);

  const profile = join(TMP, 'profile');
  mkdirSync(profile, { recursive: true });

  const fixturePath = join(TMP, 'fixture.html');
  writeFileSync(fixturePath, TEST_PAGE, 'utf8');

  const port = 9333;
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      // --disable-extensions-except is deliberately omitted: stable Chrome
      // rejects it, and it is not needed to load ours.
      `--load-extension=${ROOT}`,
      '--window-size=1200,900',
      pathToFileURL(fixturePath).href,
    ],
    { stdio: 'pipe' }
  );

  const stderr = [];
  chrome.stderr.on('data', (d) => stderr.push(String(d)));

  try {
    let targets = await waitForTargets(port, {
      until: (list) =>
        list.some(isOurPage) && list.some((t) => t.type === 'page' && t.url.startsWith('file:')),
    });

    const errorLines = stderr
      .join('')
      .split('\n')
      .filter((l) => /ERROR|Failed to load extension|Manifest/i.test(l))
      .filter((l) => !/DevTools listening|GPU|Vulkan|dbus|gbm|voice_transcription/i.test(l));
    check(
      'no extension load errors on stderr',
      errorLines.length === 0,
      errorLines.slice(0, 2).join(' | ')
    );

    // The extension opens its options page on first install, which is the
    // proof that the manifest parsed and the extension actually loaded.
    const optionsPage = targets.find(isOurPage);
    check(
      'extension loaded and opened its welcome page',
      Boolean(optionsPage),
      optionsPage?.url ?? 'no chrome-extension:// page found'
    );

    if (optionsPage) {
      const info = await evaluate(
        optionsPage.webSocketDebuggerUrl,
        `(() => {
          const m = chrome.runtime.getManifest();
          return { name: m.name, version: m.version, mv: m.manifest_version,
                   perms: m.permissions, hosts: m.host_permissions || [] };
        })()`
      );
      check('manifest parsed by Chrome', info?.mv === 3, `manifest_version ${info?.mv}`);
      check('version as expected', info?.version === '1.0.0', info?.version);
      check(
        'Chrome sees exactly the five approved permissions',
        info?.perms?.length === 5,
        (info?.perms || []).join(', ')
      );
      check('Chrome sees no host permissions', (info?.hosts || []).length === 0);

      // A round-trip message both wakes the service worker and proves its
      // message handler works end to end.
      const pong = await evaluate(
        optionsPage.webSocketDebuggerUrl,
        `chrome.runtime.sendMessage({ type: 'ping' })`,
        15000
      );
      check(
        'service worker answers a message round-trip',
        pong?.ok === true && pong?.result?.version === '1.0.0',
        JSON.stringify(pong)
      );
    }

    // Now that a message has woken it, the worker target is discoverable.
    targets = await waitForTargets(port, {
      timeoutMs: 10000,
      until: (list) => list.some(isOurWorker),
    });
    const worker = targets.find(isOurWorker);
    check('service worker target is live', Boolean(worker), worker?.url ?? 'not found');

    if (worker) {
      const result = await evaluate(worker.webSocketDebuggerUrl, `
        (() => ({
          hasCapture: typeof chrome.tabs.captureVisibleTab === 'function',
          hasScripting: typeof chrome.scripting.executeScript === 'function',
          hasDownloads: typeof chrome.downloads.download === 'function',
          hasOffscreenCanvas: typeof OffscreenCanvas === 'function',
          hasCreateImageBitmap: typeof createImageBitmap === 'function',
          hasIndexedDB: typeof indexedDB === 'object',
          version: chrome.runtime.getManifest().version,
        }))()
      `);
      check('service worker can reach captureVisibleTab', result?.hasCapture === true);
      check('service worker can reach scripting', result?.hasScripting === true);
      check('service worker can reach downloads', result?.hasDownloads === true);
      check('OffscreenCanvas available in the worker', result?.hasOffscreenCanvas === true,
        'this is why no offscreen permission is needed');
      check('createImageBitmap available in the worker', result?.hasCreateImageBitmap === true);
      check('IndexedDB available in the worker', result?.hasIndexedDB === true);
      check('worker reports the expected version', result?.version === '1.0.0', result?.version);
    }

    section('Browser — capture agent on a hostile page');

    const page = targets.find((t) => t.type === 'page' && t.url.startsWith('file:'));
    check('fixture page open', Boolean(page), page?.url ?? 'not found');

    if (page) {
      const agentSource = readFileSync(join(ROOT, 'src/capture/page-agent.js'), 'utf8');
      const ws = page.webSocketDebuggerUrl;

      await evaluate(ws, agentSource);
      const installed = await evaluate(ws, `typeof window.__tallshotAgent === 'object'`);
      check('page agent installs', installed === true);

      const geometry = await evaluate(ws, `window.__tallshotAgent.measure()`);
      check(
        'measures a page taller than the viewport',
        geometry && geometry.pageHeight > geometry.viewportHeight,
        `page ${geometry?.pageHeight} vs viewport ${geometry?.viewportHeight}`
      );
      check(
        'viewport width excludes the scrollbar',
        geometry && geometry.viewportWidth <= 1200,
        String(geometry?.viewportWidth)
      );

      // Scroll somewhere non-trivial so restoration is actually tested.
      await evaluate(ws, `window.scrollTo(0, 640); true`);

      const prepared = await evaluate(ws, `
        window.__tallshotAgent.prepare({
          preloadLazy: true, hideSticky: true,
          maxPreloadSteps: 20, preloadStepDelay: 30, settleDelay: 60,
        })
      `, 20000);

      check('prepare completes', prepared && prepared.cancelled === false);
      check(
        'detects the fixed elements',
        prepared?.frozen?.fixed >= 2,
        `fixed=${prepared?.frozen?.fixed} sticky=${prepared?.frozen?.sticky}`
      );
      check('detects the sticky element', prepared?.frozen?.sticky >= 1);
      check(
        're-measures after the lazy pre-pass',
        prepared?.geometry?.pageHeight >= geometry.pageHeight
      );

      // Frame 0 keeps pinned elements; later frames hide them.
      const frame0 = await evaluate(ws, `
        window.__tallshotAgent.step({y:0,index:0,total:4,delay:20})
          .then(() => getComputedStyle(document.getElementById('nav')).visibility)
      `, 5000);
      check('frame 0 keeps the fixed header visible', frame0 === 'visible', String(frame0));

      const frame1 = await evaluate(ws, `
        window.__tallshotAgent.step({y:700,index:1,total:4,delay:20})
          .then(() => getComputedStyle(document.getElementById('nav')).visibility)
      `, 5000);
      check('later frames hide the fixed header', frame1 === 'hidden', String(frame1));

      const stickyPos = await evaluate(
        ws,
        `getComputedStyle(document.getElementById('side')).position`
      );
      check(
        'sticky element is made static, not hidden',
        stickyPos === 'static',
        String(stickyPos)
      );

      const reportedY = await evaluate(ws, `
        window.__tallshotAgent.step({y:99999,index:3,total:4,delay:20})
      `, 5000);
      check(
        'reports the ACTUAL scroll position, not the requested one',
        reportedY && reportedY.y < 99999 && reportedY.y > 0,
        `asked 99999, landed ${reportedY?.y}`
      );

      // The critical assertion: the page must be left exactly as found.
      await evaluate(ws, `window.__tallshotAgent.finish()`);

      const after = await evaluate(ws, `
        (() => ({
          scrollY: Math.round(window.scrollY),
          styleTag: Boolean(document.getElementById('tallshot-freeze-style')),
          overlay: Boolean(document.getElementById('tallshot-overlay-root')),
          frozenAttrs: document.querySelectorAll('[data-tallshot-fixed],[data-tallshot-sticky]').length,
          navVisibility: getComputedStyle(document.getElementById('nav')).visibility,
          sidePosition: getComputedStyle(document.getElementById('side')).position,
        }))()
      `);

      check('restores the scroll position', after?.scrollY === 640, String(after?.scrollY));
      check('removes the injected stylesheet', after?.styleTag === false);
      check('removes the progress overlay', after?.overlay === false);
      check('removes every frozen attribute', after?.frozenAttrs === 0, String(after?.frozenAttrs));
      check('fixed element is visible again', after?.navVisibility === 'visible');
      check('sticky element is sticky again', after?.sidePosition === 'sticky');
    }
  } catch (err) {
    check('browser tests ran', false, err.message);
  } finally {
    chrome.kill();
  }
}

// ── CDP helpers ──────────────────────────────────────────────────────────

/**
 * Poll until the browser exposes the targets we care about.
 *
 * The predicate has to match OUR extension specifically. A browser ships its
 * own component extensions and service workers, so waiting for "any service
 * worker" returns almost immediately and long before ours has registered.
 */
async function waitForTargets(port, { timeoutMs = 25000, until } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = [];
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      last = await response.json();
      if (!until || until(last)) return last;
    } catch {
      /* the browser is not listening yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return last;
}

/** Targets belonging to the extension under test, not the browser's own. */
const isOurWorker = (t) =>
  t.type === 'service_worker' && t.url.includes('/src/background/service-worker.js');
const isOurPage = (t) =>
  t.type === 'page' && t.url.includes('/src/options/options.html');

let messageId = 0;

/** Evaluate an expression in a target and return its value. */
function evaluate(wsUrl, expression, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const id = ++messageId;
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('CDP evaluate timed out'));
    }, timeoutMs);

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true,
            userGesture: true,
          },
        })
      );
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timer);
      socket.close();
      if (message.error) return reject(new Error(message.error.message));
      const result = message.result?.result;
      if (message.result?.exceptionDetails) {
        return reject(
          new Error(message.result.exceptionDetails.exception?.description || 'threw')
        );
      }
      resolve(result?.value);
    });

    socket.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('CDP socket error'));
    });
  });
}

// ── Run ──────────────────────────────────────────────────────────────────

await cdp();

// The browser holds its profile directory open for a moment after being
// killed, so a cleanup failure here says nothing about the tests.
await new Promise((r) => setTimeout(r, 800));
try {
  rmSync(TMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch {
  console.log(`\n(note: could not remove ${TMP} — the browser still holds it)`);
}

const line = '─'.repeat(74);
console.log(`\n${line}\n  Tallshot runtime tests\n${line}`);

for (const entry of results) {
  if (entry.section) {
    console.log(`\n  ${entry.section}`);
    continue;
  }
  const mark = entry.ok ? '\u001b[32mPASS\u001b[0m' : '\u001b[31mFAIL\u001b[0m';
  const detail = entry.detail && !entry.ok ? `  \u001b[90m(${entry.detail})\u001b[0m` : '';
  console.log(`    ${mark}  ${entry.name}${detail}`);
}

const total = results.filter((r) => !r.section).length;
console.log(`\n${line}\n  ${total - failed}/${total} passed\n${line}\n`);

process.exit(failed ? 1 : 0);

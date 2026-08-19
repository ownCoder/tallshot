/**
 * Tallshot — service worker.
 *
 * Owns the capture state machine. One job at a time per tab; the worker
 * injects the page agents, paces captureVisibleTab against Chrome's quota,
 * stitches the frames on an OffscreenCanvas, persists the result to
 * IndexedDB, and hands off to the editor or straight to a download.
 *
 * The worker is killed when idle, so nothing important is held in a module
 * variable across a boundary the user controls. During a capture the message
 * and API traffic every ~550ms keeps it alive; the finished image is written
 * to IndexedDB before the editor tab is opened, so even a worker death the
 * instant afterwards cannot lose it.
 */

import {
  APP,
  LIMITS,
  MODE,
  MSG,
  PHASE,
  AFTER_CAPTURE,
  RESTRICTED_SCHEMES,
  RESTRICTED_HOSTS,
} from '../lib/constants.js';
import { TallshotError, CODE, asTallshotError, isRestrictedUrl } from '../lib/errors.js';
import { getSettings, invalidateSettingsCache } from '../lib/settings.js';
import { newCaptureId, putCapture, sweepExpired } from '../lib/store.js';
import { stitchFrames, frameToBlob, cropFrame } from '../lib/stitch.js';
import { renderFilename } from '../lib/filename.js';

/** Tabs with a capture in flight. Value carries the cancel flag. */
const jobs = new Map();

/** Timestamp of the last captureVisibleTab call, for quota pacing. */
let lastCaptureAt = 0;

// ── Lifecycle ────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  registerContextMenus();
  // Clear anything an interrupted previous session left behind.
  sweepExpired().catch(() => {});
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html?welcome=1') });
  }
});

chrome.runtime.onStartup.addListener(() => {
  registerContextMenus();
  sweepExpired().catch(() => {});
});

function registerContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'tallshot-full',
      title: 'Tallshot: capture full page',
      contexts: ['page', 'selection', 'image', 'link'],
    });
    chrome.contextMenus.create({
      id: 'tallshot-visible',
      title: 'Tallshot: capture visible area',
      contexts: ['page', 'selection', 'image', 'link'],
    });
    chrome.contextMenus.create({
      id: 'tallshot-region',
      title: 'Tallshot: select a region',
      contexts: ['page', 'selection', 'image', 'link'],
    });
  });
}

const MENU_MODE = {
  'tallshot-full': MODE.FULL,
  'tallshot-visible': MODE.VISIBLE,
  'tallshot-region': MODE.REGION,
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const mode = MENU_MODE[info.menuItemId];
  if (mode && tab) startCapture(tab, mode);
});

const COMMAND_MODE = {
  'capture-full-page': MODE.FULL,
  'capture-visible': MODE.VISIBLE,
  'capture-region': MODE.REGION,
};

chrome.commands.onCommand.addListener(async (command) => {
  const mode = COMMAND_MODE[command];
  if (!mode) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) startCapture(tab, mode);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((err) => {
      const wrapped = asTallshotError(err);
      sendResponse({ ok: false, error: wrapped.toJSON() });
    });
  // Keep the message channel open for the async reply.
  return true;
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case MSG.CAPTURE_START: {
      const tab =
        sender.tab ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
      if (!tab) throw new TallshotError(CODE.UNKNOWN);
      // Do not await: the popup closes the moment it is clicked, and awaiting
      // a whole capture through a dead port would drop the response.
      startCapture(tab, message.payload?.mode ?? MODE.FULL);
      return { started: true };
    }
    case MSG.CAPTURE_CANCEL: {
      const tabId = sender.tab?.id;
      if (tabId != null && jobs.has(tabId)) jobs.get(tabId).cancelled = true;
      return { cancelled: true };
    }
    case MSG.SETTINGS_CHANGED:
      invalidateSettingsCache();
      return { ok: true };
    case MSG.EDITOR_READY:
      sweepExpired().catch(() => {});
      return { ok: true };
    case MSG.PING:
      return { version: APP.version };
    default:
      return { ok: true };
  }
}

// ── Capture orchestration ────────────────────────────────────────────────

async function startCapture(tab, mode) {
  const tabId = tab.id;
  if (tabId == null) return;

  if (jobs.has(tabId)) {
    await notifyPage(tabId, new TallshotError(CODE.BUSY));
    return;
  }
  if (isRestrictedUrl(tab.url, RESTRICTED_SCHEMES, RESTRICTED_HOSTS)) {
    // Detected before any work, so the user gets an instant accurate reason
    // rather than a failed capture. There is no page to draw an overlay on,
    // so the badge carries the message.
    await flashBadge(tabId, 'no', '#FF5C7A', 3000);
    return;
  }

  const job = { cancelled: false, mode };
  jobs.set(tabId, job);

  try {
    const settings = await getSettings();
    const result =
      mode === MODE.REGION
        ? await captureRegion(tab, job)
        : mode === MODE.VISIBLE
          ? await captureVisible(tab, job, settings)
          : await captureFullPage(tab, job, settings);

    if (!result) return; // cancelled
    await deliver(tab, result, settings);
  } catch (err) {
    const wrapped = asTallshotError(err);
    await notifyPage(tabId, wrapped);
  } finally {
    jobs.delete(tabId);
    clearBadge(tabId);
  }
}

/** Visible area — one capture, no injection, no page modification at all. */
async function captureVisible(tab, job, settings) {
  const dataUrl = await captureWithQuota(tab.windowId);
  if (job.cancelled) return null;
  const blob = await frameToBlob(dataUrl);
  const size = await blobDimensions(blob);
  return {
    blob,
    width: size.width,
    height: size.height,
    mode: MODE.VISIBLE,
    downscaled: false,
    scale: 1,
    partial: false,
  };
}

/** Region — select, hide the overlay, capture the viewport, crop. */
async function captureRegion(tab, job) {
  const tabId = tab.id;
  await inject(tabId, 'src/capture/region-agent.js');

  const rect = await run(tabId, () => window.__tallshotRegion.select());
  if (!rect || job.cancelled) {
    await run(tabId, () => window.__tallshotRegion?.destroy());
    return null;
  }

  try {
    await run(tabId, () => window.__tallshotRegion.hide());
    // One frame for the overlay removal to actually paint, otherwise the
    // selection chrome lands in the captured pixels.
    await sleep(140);

    const dataUrl = await captureWithQuota(tab.windowId);
    const dpr = await run(tabId, () => window.devicePixelRatio || 1);
    const cropped = await cropFrame({ dataUrl, rect, dpr: dpr || 1 });
    return { ...cropped, mode: MODE.REGION, partial: false };
  } finally {
    await run(tabId, () => window.__tallshotRegion?.destroy());
  }
}

/** Full page — the five-phase pipeline. */
async function captureFullPage(tab, job, settings) {
  const tabId = tab.id;
  await inject(tabId, 'src/capture/page-agent.js');

  const prepared = await run(
    tabId,
    (opts) => window.__tallshotAgent.prepare(opts),
    [
      {
        preloadLazy: settings.preloadLazy,
        hideSticky: settings.hideSticky,
        maxPreloadSteps: LIMITS.MAX_PRELOAD_STEPS,
        preloadStepDelay: LIMITS.PRELOAD_STEP_DELAY_MS,
        settleDelay: LIMITS.SETTLE_AFTER_PRELOAD_MS,
      },
    ]
  );

  if (!prepared || prepared.cancelled || job.cancelled) {
    await run(tabId, () => window.__tallshotAgent?.finish());
    return null;
  }

  const geo = prepared.geometry;
  const step = Math.max(1, geo.viewportHeight);
  const frameCount = Math.min(
    LIMITS.MAX_FRAMES,
    Math.max(1, Math.ceil(geo.pageHeight / step))
  );

  // A single-viewport page needs no stitching machinery at all.
  await run(tabId, () => window.__tallshotAgent.beginFrames());

  const frames = [];
  let partial = false;

  try {
    for (let i = 0; i < frameCount; i += 1) {
      if (job.cancelled) break;

      const targetY = Math.min(i * step, Math.max(0, geo.pageHeight - geo.viewportHeight));
      const stepResult = await run(
        tabId,
        (arg) => window.__tallshotAgent.step(arg),
        [{ y: targetY, index: i, total: frameCount, delay: settings.captureDelay }]
      );
      if (!stepResult || stepResult.cancelled) break;

      setBadge(tabId, `${i + 1}/${frameCount}`, '#7A5CFF');

      try {
        const dataUrl = await captureWithQuota(tab.windowId);
        // The ACTUAL landing position, not the requested one — see stitch.js.
        frames.push({ dataUrl, y: stepResult.y });
      } catch (err) {
        const wrapped = asTallshotError(err);
        if (wrapped.code === CODE.QUOTA_EXCEEDED && frames.length > 0) {
          // A partial capture beats an error dialog, as long as we say so.
          partial = true;
          break;
        }
        throw err;
      }
    }
  } finally {
    await run(tabId, () => window.__tallshotAgent?.endFrames());
  }

  if (job.cancelled || frames.length === 0) {
    await run(tabId, () => window.__tallshotAgent?.finish());
    return null;
  }

  const covered = frames[frames.length - 1].y + geo.viewportHeight;
  const effectiveHeight = partial ? Math.min(geo.pageHeight, covered) : geo.pageHeight;

  const stitched = await stitchFrames({
    frames,
    width: geo.viewportWidth,
    height: effectiveHeight,
    dpr: geo.devicePixelRatio,
  });

  await run(tabId, () => window.__tallshotAgent?.finish());

  return {
    ...stitched,
    mode: MODE.FULL,
    partial,
    coverage: Math.round((effectiveHeight / geo.pageHeight) * 100),
    frameCount: frames.length,
  };
}

// ── Quota-aware capture ──────────────────────────────────────────────────

/**
 * Call captureVisibleTab without tripping Chrome's throttle.
 *
 * Chrome caps captureVisibleTab at MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND
 * (2, since Chrome 92) and the limit cannot be raised. We space calls at
 * 550ms and, if Chrome rejects anyway, back off exponentially. Firing in a
 * tight loop is what makes competing extensions drop frames on long pages.
 */
async function captureWithQuota(windowId) {
  let wait = LIMITS.MIN_CAPTURE_INTERVAL_MS;

  for (let attempt = 0; attempt <= LIMITS.CAPTURE_MAX_RETRIES; attempt += 1) {
    const since = Date.now() - lastCaptureAt;
    if (since < wait) await sleep(wait - since);

    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: 'png',
      });
      lastCaptureAt = Date.now();
      if (!dataUrl) throw new TallshotError(CODE.UNKNOWN);
      return dataUrl;
    } catch (err) {
      lastCaptureAt = Date.now();
      const wrapped = asTallshotError(err);
      if (wrapped.code !== CODE.QUOTA_EXCEEDED) throw wrapped;
      wait = Math.min(4000, wait * LIMITS.CAPTURE_BACKOFF_FACTOR);
    }
  }
  throw new TallshotError(CODE.QUOTA_EXCEEDED);
}

// ── Delivery ─────────────────────────────────────────────────────────────

async function deliver(tab, result, settings) {
  const meta = {
    url: tab.url ?? '',
    title: tab.title ?? '',
    host: safeHost(tab.url),
    mode: result.mode,
    width: result.width,
    height: result.height,
    downscaled: Boolean(result.downscaled),
    scale: result.scale ?? 1,
    partial: Boolean(result.partial),
    coverage: result.coverage ?? 100,
    createdAt: Date.now(),
  };

  if (settings.afterCapture === AFTER_CAPTURE.DOWNLOAD) {
    await downloadBlob(result.blob, settings, meta);
    await flashBadge(tab.id, 'ok', '#2ED3A7', 1800);
    return;
  }

  if (settings.afterCapture === AFTER_CAPTURE.CLIPBOARD) {
    const copied = await copyViaPage(tab.id, result.blob);
    if (copied) {
      await flashBadge(tab.id, 'ok', '#2ED3A7', 1800);
      return;
    }
    // Clipboard can be blocked by a page's Permissions-Policy or by focus
    // rules. Falling back to a download is better than losing the capture.
    await downloadBlob(result.blob, settings, meta);
    await flashBadge(tab.id, 'ok', '#FFB020', 1800);
    return;
  }

  const id = newCaptureId();
  await putCapture({ id, blob: result.blob, meta });
  await chrome.tabs.create({
    url: chrome.runtime.getURL(`src/editor/editor.html?id=${encodeURIComponent(id)}`),
    index: tab.index + 1,
  });
}

async function downloadBlob(blob, settings, meta) {
  const filename = renderFilename(
    settings.filenameTemplate,
    {
      url: meta.url,
      title: meta.title,
      width: meta.width,
      height: meta.height,
      mode: meta.mode,
    },
    'png'
  );
  const url = await blobToDataUrl(blob);
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
  } catch {
    throw new TallshotError(CODE.DOWNLOAD_FAILED);
  }
}

/**
 * Copy an image to the clipboard by injecting a writer into the page.
 *
 * A service worker has no DOM, so the alternatives are this or the
 * `offscreen` permission. We take the injection route to keep the permission
 * list at five, and fall back to a download when a page blocks it.
 *
 * Guarded by size: the image crosses the boundary as a data URL argument, and
 * a very large one is slow to serialise. Above the guard we let the caller
 * fall back rather than freezing the page.
 */
const CLIPBOARD_MAX_BYTES = 8 * 1024 * 1024;

async function copyViaPage(tabId, blob) {
  if (blob.size > CLIPBOARD_MAX_BYTES) return false;
  try {
    const dataUrl = await blobToDataUrl(blob);
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (url) => {
        try {
          const response = await fetch(url);
          const imageBlob = await response.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': imageBlob }),
          ]);
          return true;
        } catch {
          return false;
        }
      },
      args: [dataUrl],
    });
    return Boolean(results?.[0]?.result);
  } catch {
    return false;
  }
}

// ── Injection helpers ────────────────────────────────────────────────────

async function inject(tabId, file) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: [file] });
  } catch (err) {
    throw asTallshotError(err);
  }
}

/** Run a function in the page and return its (possibly awaited) result. */
async function run(tabId, func, args = []) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });
    return results?.[0]?.result;
  } catch (err) {
    throw asTallshotError(err);
  }
}

/** Show a typed error in the page overlay, falling back to the badge. */
async function notifyPage(tabId, error) {
  const shown = await run(
    tabId,
    (payload) => {
      if (!window.__tallshotAgent) return false;
      window.__tallshotAgent.fail(payload.message, payload.hint);
      return true;
    },
    [{ message: error.message, hint: hintFor(error) }]
  ).catch(() => false);

  if (!shown) await flashBadge(tabId, 'err', '#FF5C7A', 3000);
}

function hintFor(error) {
  switch (error.action) {
    case 'retry':
      return 'Try the capture again.';
    case 'use-visible':
      return 'Try capturing the visible area instead.';
    case 'copy-instead':
      return 'Try copying to the clipboard instead.';
    default:
      return '';
  }
}

// ── Badge ────────────────────────────────────────────────────────────────

function setBadge(tabId, text, color) {
  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ tabId, color }).catch(() => {});
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
}

async function flashBadge(tabId, text, color, ms) {
  setBadge(tabId, text, color);
  await sleep(ms);
  clearBadge(tabId);
}

// ── Utilities ────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function blobDimensions(blob) {
  const bitmap = await createImageBitmap(blob);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

/**
 * Blob to data: URL, without FileReader or URL.createObjectURL.
 *
 * createObjectURL is not exposed in a service worker global scope, and
 * chrome.downloads needs a URL, so the bytes are base64'd here. Encoded in
 * chunks because String.fromCharCode over a multi-megabyte array in one call
 * overflows the argument stack.
 */
async function blobToDataUrl(blob) {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < buffer.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, buffer.subarray(i, i + CHUNK));
  }
  return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`;
}

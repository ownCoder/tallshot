/**
 * Tallshot — shared constants.
 *
 * Single source of truth for message types, limits and defaults. Nothing in
 * this module has side effects at import time, so it is safe to import from
 * the service worker, extension pages and injected agents alike.
 */

export const APP = Object.freeze({
  name: 'Tallshot',
  version: '1.0.0',
  homepage: 'https://github.com/ownCoder/tallshot',
  privacyUrl: 'https://owncoder.github.io/tallshot/',
  termsUrl: 'https://owncoder.github.io/tallshot/terms.html',
});

/** Licence tiers. Defined here so flags.js and license.js need not import
 *  each other — a cycle that works but reads as a smell. */
export const TIER = Object.freeze({
  FREE: 'free',
  PRO: 'pro',
});

/** Capture modes. */
export const MODE = Object.freeze({
  FULL: 'full',
  VISIBLE: 'visible',
  REGION: 'region',
});

/** Message types exchanged between the worker, agents and extension pages. */
export const MSG = Object.freeze({
  CAPTURE_START: 'capture:start',
  CAPTURE_CANCEL: 'capture:cancel',
  CAPTURE_PROGRESS: 'capture:progress',
  CAPTURE_DONE: 'capture:done',
  CAPTURE_ERROR: 'capture:error',
  REGION_SELECTED: 'region:selected',
  REGION_CANCELLED: 'region:cancelled',
  EDITOR_READY: 'editor:ready',
  SETTINGS_CHANGED: 'settings:changed',
  PING: 'ping',
});

/** Named phases shown to the user during a capture. */
export const PHASE = Object.freeze({
  MEASURING: 'measuring',
  PRELOADING: 'preloading',
  CAPTURING: 'capturing',
  STITCHING: 'stitching',
  FINISHING: 'finishing',
});

export const PHASE_LABEL = Object.freeze({
  [PHASE.MEASURING]: 'Measuring page',
  [PHASE.PRELOADING]: 'Loading images',
  [PHASE.CAPTURING]: 'Capturing',
  [PHASE.STITCHING]: 'Stitching',
  [PHASE.FINISHING]: 'Finishing up',
});

/**
 * Engine limits.
 *
 * MIN_CAPTURE_INTERVAL_MS is the single most important number here. Chrome
 * throttles chrome.tabs.captureVisibleTab to MAX_CAPTURE_VISIBLE_TAB_CALLS_
 * PER_SECOND (2, since Chrome 92) and the limit cannot be raised. 550ms keeps
 * us just under it with headroom for timer jitter; going faster does not make
 * captures faster, it makes them fail.
 */
export const LIMITS = Object.freeze({
  /** Minimum spacing between captureVisibleTab calls. */
  MIN_CAPTURE_INTERVAL_MS: 550,
  /** Backoff attempts when Chrome reports the quota error anyway. */
  CAPTURE_MAX_RETRIES: 4,
  /** Multiplier applied to the wait on each successive retry. */
  CAPTURE_BACKOFF_FACTOR: 2,

  /** Chrome's practical per-side canvas ceiling. */
  MAX_CANVAS_DIMENSION: 16384,
  /** Chrome's practical total canvas area ceiling (16384 x 16384). */
  MAX_CANVAS_AREA: 268435456,

  /** Hard stop on frame count so a runaway page cannot capture forever. */
  MAX_FRAMES: 250,

  /** Lazy-load pre-pass bounds. */
  MAX_PRELOAD_STEPS: 60,
  PRELOAD_STEP_DELAY_MS: 110,
  SETTLE_AFTER_PRELOAD_MS: 350,

  /** How long a stitched capture waits in IndexedDB before it is swept. */
  CAPTURE_TTL_MS: 30 * 60 * 1000,

  /** Page height change beyond this ratio mid-capture is reported. */
  MUTATION_TOLERANCE: 0.02,

  /** Region selections smaller than this are treated as accidental clicks. */
  MIN_REGION_PX: 8,
});

/** Export formats offered in the editor. */
export const FORMAT = Object.freeze({
  PNG: 'png',
  JPG: 'jpg',
  WEBP: 'webp',
  PDF: 'pdf',
});

export const MIME = Object.freeze({
  [FORMAT.PNG]: 'image/png',
  [FORMAT.JPG]: 'image/jpeg',
  [FORMAT.WEBP]: 'image/webp',
  [FORMAT.PDF]: 'application/pdf',
});

/** What happens the moment a capture finishes. */
export const AFTER_CAPTURE = Object.freeze({
  EDITOR: 'editor',
  DOWNLOAD: 'download',
  CLIPBOARD: 'clipboard',
});

export const THEME = Object.freeze({
  SYSTEM: 'system',
  DARK: 'dark',
  LIGHT: 'light',
});

export const PDF_LAYOUT = Object.freeze({
  PAGINATED: 'paginated',
  SINGLE: 'single',
});

/** User settings and their defaults. Every key here is documented in options. */
export const DEFAULT_SETTINGS = Object.freeze({
  afterCapture: AFTER_CAPTURE.EDITOR,
  defaultFormat: FORMAT.PNG,
  quality: 92,
  captureDelay: 250,
  hideSticky: true,
  preloadLazy: true,
  filenameTemplate: 'tallshot-{host}-{date}',
  theme: THEME.SYSTEM,
  pdfLayout: PDF_LAYOUT.PAGINATED,
  showShortcutHints: true,
});

/** URL schemes and hosts Chrome forbids extensions from capturing. */
export const RESTRICTED_SCHEMES = Object.freeze([
  'chrome:',
  'chrome-extension:',
  'devtools:',
  'edge:',
  'brave:',
  'about:',
  'view-source:',
]);

export const RESTRICTED_HOSTS = Object.freeze([
  'chromewebstore.google.com',
  'chrome.google.com/webstore',
]);

/** Attribute used to tag frozen sticky elements so restore is exact. */
export const FROZEN_ATTR = 'data-tallshot-frozen';
export const OVERLAY_ID = 'tallshot-overlay-root';
export const STYLE_ID = 'tallshot-freeze-style';

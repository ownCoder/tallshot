/**
 * Tallshot — typed errors.
 *
 * Every failure the user can encounter has a stable code, a plain-English
 * message that names the real cause, and (where one exists) a suggested
 * action. No message contains a stack trace, a raw API string, or the word
 * "unexpected" — those tell the user nothing and read as a crash.
 */

export const CODE = Object.freeze({
  RESTRICTED_PAGE: 'RESTRICTED_PAGE',
  INJECTION_FAILED: 'INJECTION_FAILED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PAGE_TOO_LARGE: 'PAGE_TOO_LARGE',
  PAGE_MUTATED: 'PAGE_MUTATED',
  NO_CAPTURE: 'NO_CAPTURE',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  CLIPBOARD_FAILED: 'CLIPBOARD_FAILED',
  ENCODE_FAILED: 'ENCODE_FAILED',
  CANCELLED: 'CANCELLED',
  BUSY: 'BUSY',
  UNKNOWN: 'UNKNOWN',
});

/** Action hints the UI can render as a button. */
export const ACTION = Object.freeze({
  RETRY: 'retry',
  KEEP_PARTIAL: 'keep-partial',
  USE_VISIBLE: 'use-visible',
  COPY_INSTEAD: 'copy-instead',
  NEW_CAPTURE: 'new-capture',
  NONE: 'none',
});

const CATALOG = {
  [CODE.RESTRICTED_PAGE]: {
    message:
      "Chrome doesn't allow extensions to capture this page. This applies to " +
      'every extension, not just Tallshot.',
    action: ACTION.NONE,
  },
  [CODE.INJECTION_FAILED]: {
    message:
      'This site blocked Tallshot from running on the page. Try capturing the ' +
      'visible area instead.',
    action: ACTION.USE_VISIBLE,
  },
  [CODE.QUOTA_EXCEEDED]: {
    message:
      'Chrome limited how fast we could capture this page, so the capture ' +
      'stopped early.',
    action: ACTION.RETRY,
  },
  [CODE.PAGE_TOO_LARGE]: {
    message:
      "This page is taller than Chrome can hold in a single image, so it was " +
      'scaled down to fit.',
    action: ACTION.NONE,
  },
  [CODE.PAGE_MUTATED]: {
    message:
      'The page moved while we were capturing it, so parts of the image may ' +
      'not line up.',
    action: ACTION.RETRY,
  },
  [CODE.NO_CAPTURE]: {
    message: 'The image for this tab is no longer available.',
    action: ACTION.NEW_CAPTURE,
  },
  [CODE.DOWNLOAD_FAILED]: {
    message: 'Chrome blocked the download. Check your download settings.',
    action: ACTION.COPY_INSTEAD,
  },
  [CODE.CLIPBOARD_FAILED]: {
    message:
      "Couldn't copy to the clipboard. Click the page once, then try again.",
    action: ACTION.RETRY,
  },
  [CODE.ENCODE_FAILED]: {
    message: "Couldn't encode the image in that format. Try PNG instead.",
    action: ACTION.RETRY,
  },
  [CODE.CANCELLED]: {
    message: 'Capture cancelled.',
    action: ACTION.NONE,
  },
  [CODE.BUSY]: {
    message: 'A capture is already running in this tab.',
    action: ACTION.NONE,
  },
  [CODE.UNKNOWN]: {
    message: "Something went wrong and the capture couldn't finish.",
    action: ACTION.RETRY,
  },
};

/**
 * A failure with a user-facing explanation attached.
 *
 * `detail` is for extra context we can safely show (a percentage, a pixel
 * height). It never contains page content or URLs.
 */
export class TallshotError extends Error {
  constructor(code, detail = '') {
    const entry = CATALOG[code] || CATALOG[CODE.UNKNOWN];
    super(detail ? `${entry.message} ${detail}` : entry.message);
    this.name = 'TallshotError';
    this.code = code in CATALOG ? code : CODE.UNKNOWN;
    this.action = entry.action;
    this.detail = detail;
  }

  /** Plain object safe to send across a message boundary. */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      action: this.action,
      detail: this.detail,
    };
  }
}

/** Wrap anything thrown into a TallshotError without losing a known code. */
export function asTallshotError(err) {
  if (err instanceof TallshotError) return err;
  const text = String((err && err.message) || err || '');
  if (/MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND|quota/i.test(text)) {
    return new TallshotError(CODE.QUOTA_EXCEEDED);
  }
  if (/cannot access|Extension manifest|blocked|Cannot access contents/i.test(text)) {
    return new TallshotError(CODE.INJECTION_FAILED);
  }
  return new TallshotError(CODE.UNKNOWN);
}

/** True when Chrome forbids capture on this URL, checked before any work. */
export function isRestrictedUrl(url, restrictedSchemes, restrictedHosts) {
  if (!url) return true;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  if (restrictedSchemes.includes(parsed.protocol)) return true;
  const full = `${parsed.host}${parsed.pathname}`;
  return restrictedHosts.some((h) => full.startsWith(h));
}

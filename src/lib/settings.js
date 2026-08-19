/**
 * Tallshot — settings.
 *
 * Backed by chrome.storage.sync so preferences follow the user across
 * devices. Only preferences live here: no capture content, no page data, no
 * browsing history. Total footprint is well under 1KB.
 */

import { DEFAULT_SETTINGS } from './constants.js';

const KEY = 'tallshot.settings';

/** In-memory snapshot, so hot paths don't hit storage on every capture. */
let cache = null;

/**
 * Read settings, merged over defaults.
 *
 * Merging on every read is what makes adding a new setting in a future
 * version safe: existing users simply pick up the new default rather than
 * getting `undefined`.
 */
export async function getSettings() {
  if (cache) return cache;
  let stored = {};
  try {
    const result = await chrome.storage.sync.get(KEY);
    stored = result?.[KEY] ?? {};
  } catch {
    // Sync storage can be unavailable (disabled sync, quota). Defaults are a
    // perfectly good product, so degrade rather than fail the capture.
    stored = {};
  }
  cache = sanitise({ ...DEFAULT_SETTINGS, ...stored });
  return cache;
}

/** Write a partial update. Returns the merged result. */
export async function setSettings(patch) {
  const current = await getSettings();
  const next = sanitise({ ...current, ...patch });
  cache = next;
  try {
    await chrome.storage.sync.set({ [KEY]: next });
  } catch {
    // Keep the in-memory value so the current session still behaves as the
    // user asked, even if it can't be persisted.
  }
  return next;
}

/** Restore every setting to its default. */
export async function resetSettings() {
  cache = { ...DEFAULT_SETTINGS };
  try {
    await chrome.storage.sync.remove(KEY);
  } catch {
    /* nothing useful to do */
  }
  return cache;
}

/** Drop the cached snapshot — called when another context writes settings. */
export function invalidateSettingsCache() {
  cache = null;
}

/**
 * Clamp and coerce every field to a value the engine can actually use.
 *
 * Storage is sync'd, so a value could arrive from a future version of the
 * extension running on another device. Validating on read means an unknown
 * or out-of-range value degrades to a sane default instead of breaking a
 * capture.
 */
function sanitise(s) {
  const out = { ...DEFAULT_SETTINGS, ...s };
  out.quality = clampInt(out.quality, 40, 100, DEFAULT_SETTINGS.quality);
  out.captureDelay = clampInt(out.captureDelay, 0, 2000, DEFAULT_SETTINGS.captureDelay);
  out.hideSticky = Boolean(out.hideSticky);
  out.preloadLazy = Boolean(out.preloadLazy);
  out.showShortcutHints = Boolean(out.showShortcutHints);
  if (typeof out.filenameTemplate !== 'string' || !out.filenameTemplate.trim()) {
    out.filenameTemplate = DEFAULT_SETTINGS.filenameTemplate;
  }
  out.filenameTemplate = out.filenameTemplate.slice(0, 120);
  return out;
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Subscribe to changes made in any extension context. */
export function onSettingsChanged(handler) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes[KEY]) return;
    invalidateSettingsCache();
    handler(changes[KEY].newValue ?? { ...DEFAULT_SETTINGS });
  });
}

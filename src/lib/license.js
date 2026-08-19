/**
 * Tallshot — licence verification (Phase 2 seam).
 *
 * v1.0 ships with no monetisation surface of any kind. `getTier()` returns
 * FREE unconditionally and performs no I/O and no network call — this file
 * exists so that the *interface* Pro will need is fixed now, and adding Pro
 * later is an implementation change behind a stable boundary rather than a
 * refactor that touches every call site.
 *
 * When Phase 2 arrives, the plan is:
 *   1. `activate(key)` validates a signed licence key offline (Ed25519
 *      signature over the key payload, public key bundled). No server call,
 *      so the privacy claim survives monetisation intact.
 *   2. The verified tier is cached in chrome.storage.sync.
 *   3. `getTier()` reads that cache.
 *
 * Deliberately NOT done here: no phone-home, no device fingerprint, no
 * remote config. See docs/free-vs-pro-plan.md §6.
 */

import { TIER } from './constants.js';

/**
 * The user's current tier.
 * @returns {Promise<'free'|'pro'>}
 */
export async function getTier() {
  return TIER.FREE;
}

/**
 * Activate a licence key. Inert in v1.0.
 * @param {string} _key
 * @returns {Promise<{ok: boolean, reason: string}>}
 */
export async function activate(_key) {
  return { ok: false, reason: 'Tallshot 1.0 is free — there is nothing to activate.' };
}

/**
 * Remove a stored licence. Inert in v1.0.
 * @returns {Promise<{ok: boolean}>}
 */
export async function deactivate() {
  return { ok: true };
}

/** True when a paid tier exists in this build. Used to hide Pro UI entirely. */
export function isMonetisationEnabled() {
  return false;
}

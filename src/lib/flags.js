/**
 * Tallshot — capability flags (the Free/Pro seam).
 *
 * Every gated capability in the product is named exactly once, here. Call
 * sites ask `can('exportPdf')` and never test a tier directly, so introducing
 * Pro in Phase 2 means implementing `getTier()` in license.js — no call site
 * changes, no architectural rewrite.
 *
 * COMMITMENT: an entry never moves from FREE to PRO. Everything shipped free
 * in v1.0 stays free. Because every v1.0 capability below maps to FREE, no
 * `can()` call in this release can return false — there is no dormant paywall
 * code path that could misfire and lock out a free user.
 *
 * See docs/free-vs-pro-plan.md.
 */

import { TIER } from './constants.js';
import { getTier } from './license.js';

export { TIER };

/** Tier ordering, so a Pro user satisfies a FREE requirement. */
const RANK = Object.freeze({ [TIER.FREE]: 0, [TIER.PRO]: 1 });

export const CAPABILITIES = Object.freeze({
  // ── Shipped in v1.0, free forever ──────────────────────────────────────
  captureFullPage: TIER.FREE,
  captureVisible: TIER.FREE,
  captureRegion: TIER.FREE,
  editorAllTools: TIER.FREE,
  redaction: TIER.FREE,
  exportPng: TIER.FREE,
  exportJpg: TIER.FREE,
  exportWebp: TIER.FREE,
  exportPdf: TIER.FREE,
  copyToClipboard: TIER.FREE,
  filenameTemplate: TIER.FREE,
  keyboardShortcuts: TIER.FREE,

  // ── Declared for Phase 2. Not implemented in v1.0; the gate exists so
  //    that adding them later requires no new plumbing. ──────────────────
  scheduledCapture: TIER.PRO,
  batchCapture: TIER.PRO,
  ocrTextExtract: TIER.PRO,
  cloudSync: TIER.PRO,
  customWatermark: TIER.PRO,
  annotationPresets: TIER.PRO,
  captureHistory: TIER.PRO,
});

/**
 * The only gate pattern in the codebase.
 * @param {keyof typeof CAPABILITIES} capability
 * @returns {Promise<boolean>}
 */
export async function can(capability) {
  const required = CAPABILITIES[capability];
  // An unknown capability is denied rather than silently allowed — a typo
  // should fail closed, not open.
  if (required === undefined) return false;
  const tier = await getTier();
  return RANK[tier] >= RANK[required];
}

/** Synchronous check for the free baseline, for hot paths that cannot await. */
export function isFreeCapability(capability) {
  return CAPABILITIES[capability] === TIER.FREE;
}

/** Every capability available at a given tier — used by the options page. */
export function capabilitiesFor(tier) {
  return Object.entries(CAPABILITIES)
    .filter(([, required]) => RANK[tier] >= RANK[required])
    .map(([name]) => name);
}

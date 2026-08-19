# Free vs Pro Plan — Tallshot

**Version:** 1.0 · 19 August 2026
**Status:** Phase 1 (free) shipping. Phase 2 (Pro) designed, not built.

---

## 1. The governing principle

> **Pro is additive. Nothing that ships free ever moves behind a paywall.**

This is both an ethical commitment and the correct commercial decision. The category's clearest cautionary tale is Nimbus/FuseBase, which moved full-page capture — its core function — behind a $60/yr plan and lost users, rating and trust simultaneously. "It used to be free" is the most damaging sentence a review can contain, and it is unrecoverable.

The commitment is enforced three ways:

1. **In code.** [`src/lib/flags.js`](../src/lib/flags.js) maps every capability to a tier in one table. Moving an entry from `FREE` to `PRO` is a visible, reviewable one-line diff, not a scattered refactor.
2. **In writing.** It is stated in the README, the CHANGELOG and the store listing.
3. **By construction.** Every v1.0 capability maps to `FREE`, so no `can()` call in this release can return `false`. There is no dormant paywall code path that could misfire and lock out a free user.

---

## 2. Free — shipping in 1.0.0

Everything below is free, permanently, with **no watermark, no account, no capture limit and no export limit**.

### Capture

| Capability | Notes |
|---|---|
| Full-page capture | Scroll-and-stitch with lazy-load pre-pass, sticky freezing and quota-aware pacing |
| Visible-area capture | Single frame, no page modification |
| Region capture | Drag-select with dimension readout and keyboard nudging |
| Keyboard shortcuts | All three modes |
| Context-menu capture | All three modes |
| Cancel mid-capture | `Esc`, with exact page restoration |
| Capture delay control | 0–700 ms |
| Sticky-element handling | On/off |
| Lazy-image pre-loading | On/off |

### Editor

| Capability | Notes |
|---|---|
| All twelve tools | Select, crop, arrow, rectangle, ellipse, line, pen, highlighter, text, step badge, blur, pixelate |
| **Blur and pixelate redaction** | Free. The market leader does not offer this at any price. |
| Undo / redo | Full history |
| Zoom, fit, 1:1 | — |
| Six-colour palette, stroke width, font size, blur strength | — |
| Complete keyboard control | With an in-app shortcut sheet |

### Export

| Capability | Notes |
|---|---|
| PNG | Lossless |
| JPG | Quality configurable |
| WebP | Quality configurable |
| **PDF** | Paginated A4 or one long page. Free — the market leader charges for this. |
| Copy to clipboard | — |
| Filename templates | Nine tokens |

### Why this much, free

Three reasons, in order of weight:

1. **It is the differentiator.** GoFullPage paywalls editing, annotation, PDF and custom filenames. FireShot paywalls its real editor. Matching them on price while beating them on generosity is the entire wedge.
2. **Redaction is a product gap, not a pricing gap.** The market leader has no blur at any price. Charging for it would waste the single clearest advantage we have.
3. **Growth requires reviews, and paywalls produce one-star reviews.** In Phase 1 the objective is 5,000 users and a ≥4.5 rating. A paywall encountered mid-task is the most reliable way to lose both.

---

## 3. Pro — Phase 2 candidates

None of these exist in 1.0.0. All are **new capability**, not restrictions of existing features. Each is already declared in `flags.js` so the gate exists from day one.

| Capability | Flag | What it adds | Why it is genuinely Pro |
|---|---|---|---|
| **Scheduled capture** | `scheduledCapture` | Capture a URL on a schedule and track visual change over time | Needs `alarms` and background execution — a real ongoing cost and a distinct workflow |
| **Batch capture** | `batchCapture` | Paste a list of URLs, get a set of captures or one PDF | A power-user workflow with material engineering cost; irrelevant to the everyday user |
| **OCR text extraction** | `ocrTextExtract` | Pull selectable text out of a capture, on-device | Requires bundling a substantial recognition model — the one place a real per-user cost exists |
| **Cloud sync** | `cloudSync` | Optional, opt-in, end-to-end encrypted capture history across devices | The only feature with genuine recurring infrastructure cost. **Strictly opt-in**, off by default, and the free experience never depends on it. |
| **Custom watermark** | `customWatermark` | Add *your own* logo to captures | Note the direction: Pro lets you ADD a watermark. Tallshot never adds one of its own. |
| **Annotation presets** | `annotationPresets` | Saved styles, team colour sets, reusable callout templates | A workflow accelerator for heavy daily users |
| **Capture history** | `captureHistory` | A local, searchable library of recent captures | Storage management and a browsing UI — a separate product surface |

### The line we drew

A capability qualifies for Pro only if it meets **at least one** of:

- It has a **real recurring cost** (infrastructure, model weights, bandwidth).
- It represents a **distinct workflow** an everyday user does not need.
- It **did not exist** in the free tier previously.

A capability may **never** be moved to Pro because it is popular, because it is what people would pay for, or because revenue is behind target.

---

## 4. Pricing

Pricing is a hypothesis until Phase 2 validates it against real demand.

| Plan | Price | Rationale |
|---|---|---|
| Monthly | $2.49 | Undercuts Awesome Screenshot ($8/mo) decisively. Positioned as a tip, not a subscription decision. |
| Annual | $19 | ~36% saving; the expected default for committed users |
| **Lifetime** | **$39** | **Expected best-seller.** This audience is actively fleeing subscriptions — Nimbus's $60/yr is the counter-example we position against. A one-time price is itself a trust signal. |

Team pricing is deliberately out of scope for Phase 2. Team features imply shared storage and identity, which contradicts the local-only architecture.

---

## 5. The technical seam

Pro must be enableable **without an architectural rewrite**. Two modules provide that, and both ship inert.

### `src/lib/flags.js`

Every gated capability is named exactly once, in one table:

```js
export const CAPABILITIES = Object.freeze({
  // Shipped in v1.0, free forever
  captureFullPage: TIER.FREE,
  captureRegion:   TIER.FREE,
  editorAllTools:  TIER.FREE,
  redaction:       TIER.FREE,
  exportPdf:       TIER.FREE,
  // …

  // Declared for Phase 2 — the gate exists before the feature does
  scheduledCapture: TIER.PRO,
  batchCapture:     TIER.PRO,
  ocrTextExtract:   TIER.PRO,
  cloudSync:        TIER.PRO,
  customWatermark:  TIER.PRO,
});

export async function can(capability) { /* the only gate pattern */ }
```

Call sites ask `can('exportPdf')`. **No call site ever tests a tier directly.** Introducing Pro therefore changes no call site.

An unknown capability name returns `false` — a typo fails closed rather than silently granting access.

### `src/lib/license.js`

The interface Pro will need is already fixed:

```js
export async function getTier()     { return TIER.FREE; }  // v1.0: always free
export async function activate(key) { /* Phase 2 */ }
export async function deactivate()  { /* Phase 2 */ }
export function isMonetisationEnabled() { return false; }   // hides all Pro UI
```

In v1.0 `getTier()` performs no I/O and no network call. It is a stub whose only job is to make the boundary exist.

### How Phase 2 will implement it — without breaking the privacy claim

This is the hard part, and it is designed now rather than improvised later.

1. **Offline licence verification.** A licence key is a payload plus an **Ed25519 signature**, verified locally with a public key bundled in the extension via `crypto.subtle.verify`. No server call, ever.
2. **Local cache.** The verified tier is stored in `chrome.storage.sync`.
3. **No phone-home, no fingerprint, no activation limit check.** A licence check that contacts a server would destroy the "no network code" claim that differentiates the product. We will not trade it for piracy protection that does not work anyway.

**Consequence, accepted deliberately:** a determined user can share a licence key. That is a smaller cost than losing the architectural privacy guarantee, which is our actual moat.

### What changes at Phase 2

| Change | Scope |
|---|---|
| Implement `getTier()` against the cached licence | One function |
| Implement `activate()` with signature verification | One function |
| Add a licence field to the options page | One UI section, shown only when `isMonetisationEnabled()` |
| Implement the Pro features themselves | New modules |
| **Change any existing call site** | **None** |
| **Change the free tier** | **None** |

---

## 6. Phase 2 entry gate

Pro development does not begin until **every** condition holds:

| Condition | Threshold | Why |
|---|---|---|
| Users | ≥ 5,000 | Below this there is no evidence of product-market fit |
| Rating | ≥ 4.5 | Monetising a product with quality problems converts installs into refund requests |
| D30 retention | ≥ 25% | Users who do not return will not subscribe |
| Open P1 defects | 0 | Charging for a product with known serious bugs is indefensible |
| Recurring feature requests | ≥ 3 identified | The Pro set should be **discovered from user demand**, not guessed |

The last row matters most: the list in §3 is a hypothesis. If 5,000 users never ask for scheduled capture but repeatedly ask for something we have not thought of, the list changes.

---

## 7. What Pro will never do

A commitment list, because these are the specific ways screenshot tools have degraded:

- **Never add a watermark** to a free user's export.
- **Never limit capture count** or export count on the free tier.
- **Never require an account** for any free feature.
- **Never gate a bug fix** or a correctness improvement behind Pro. The capture engine belongs to everyone.
- **Never show upgrade interstitials mid-workflow.** Pro will be discoverable in settings and nowhere else.
- **Never nag.** No repeating banners, no red dots, no dismissible-then-reappearing prompts.
- **Never move a free capability to Pro.**

---

## 8. If Pro never happens

A legitimate outcome, planned for rather than feared.

Tallshot has no server, no recurring infrastructure cost, and no runtime dependencies. Its ongoing cost is maintenance time. If the Phase 2 gate is never met, the correct action is to keep shipping the free product and skip monetisation entirely — the architecture makes that sustainable in a way a cloud-backed competitor's does not.

That optionality is itself a strategic asset: **we can afford to give away what competitors must charge for**, because we did not build a cost structure that requires revenue.

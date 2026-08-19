# Testing Report — Tallshot

**Version:** 1.0.0
**Date:** 19 August 2026
**Owner:** QA Engineer (internal)
**Suites:** `npm run verify` (static audit) · `npm run test:runtime` (unit + browser)

> **Scope note.** This report separates what has been **executed and observed** from what is **specified but not yet executed**. Section 3 is machine-verified and reproducible. Section 4 is a manual plan the developer runs against live websites before and immediately after launch; it is explicitly marked as pending. Nothing in this document is reported as passing unless it actually ran.

---

## 1. Summary

### Executed

| Suite | Checks | Result |
|---|---|---|
| Static compliance audit (`verify.mjs`) | 21 | ✅ 21 passed, 0 failed |
| Unit tests — pure modules (`test-runtime.mjs` Part A) | 31 | ✅ 31 passed, 0 failed |
| Browser tests — real extension over CDP (Part B) | 33 | ✅ 33 passed, 0 failed |
| **Total automated** | **85** | **✅ 85 passed, 0 failed** |

### Pending

| Suite | Cases | Status |
|---|---|---|
| Manual matrix against live websites (§4) | 42 | ⬜ Not yet executed — scheduled for launch week |
| Runtime performance measurement (§7) | 9 | ⬜ Not yet measured — targets defined, no figures claimed |

**Defects found and fixed during this cycle: 5**, including one security-relevant bug and one that would have shipped a visibly broken editor. Both were found by execution and rendering, not by review. See §5.

---

## 2. What is verified, and how

The central claim of this project is that the capture engine is correct on hostile pages. That cannot be established by reading code, so the browser suite drives a **real, loaded extension** over the Chrome DevTools Protocol against a fixture built specifically to break naive implementations.

### The fixture

```html
#nav   → position: fixed    a pinned navigation bar
#side  → position: sticky   a sticky sidebar in normal flow
#chat  → position: fixed    a floating chat widget
4 × 700px content blocks carrying loading="lazy" images
```

All three of the category's classic failure modes, in one page.

### Browser used to drive the tests

Stable Google Chrome **refuses** `--load-extension` and `--disable-extensions-except` (`"not allowed in Google Chrome, ignoring"`), so it cannot side-load an unpacked extension from the command line at all. The browser suite therefore runs on **Microsoft Edge (Chromium)**, which honours the flag and provides the identical extension platform, MV3 implementation and capture APIs. `BROWSER_PATH` selects a different build (Chromium, Chrome for Testing).

This constrains the *test driver*, not the extension. Loading in Chrome via `chrome://extensions` → Load unpacked is unaffected and is the first step of §4.

---

## 3. Automated results (executed)

### 3.1 Static compliance audit — 21/21 ✅

| Check | Result |
|---|---|
| `manifest.json` is valid JSON | ✅ |
| Manifest V3 | ✅ |
| Description within the 132-character store limit | ✅ 126 |
| Extension name free of Google trademarks | ✅ |
| No `host_permissions` declared | ✅ |
| No declared content scripts | ✅ |
| Permissions limited to the five approved | ✅ |
| Every permission justified in `compliance.md` | ✅ |
| All 11 manifest-referenced files exist | ✅ |
| HTML references resolve; no inline script or inline handlers | ✅ |
| No forbidden runtime pattern across 15 source files | ✅ |
| Version consistent across manifest and `package.json` | ✅ |
| `APP.version` matches the manifest | ✅ |
| `CHANGELOG.md` documents this version | ✅ |
| Four icon sizes present and dimensionally correct | ✅ |
| Six store images present | ✅ |
| Screenshots exactly 1280×800 | ✅ |
| Promo tile exactly 440×280 | ✅ |
| All 20 required documents present | ✅ |
| No unfilled placeholder markers | ✅ |
| All 9 library modules import with no `chrome.*` access at load time | ✅ |
| Privacy policy URL declared | ✅ |

The "forbidden runtime pattern" scan covers `eval`, `new Function`, `importScripts`, remote `fetch`, `XMLHttpRequest`, `WebSocket` and `sendBeacon`. These are the mechanical basis of the "no remote code, no network" claim: it is enforced by the build rather than asserted in prose.

### 3.2 Unit tests — 31/31 ✅

**Filename templating (9)** — token rendering; all tokens together; path-traversal blocking for **both** separator styles; illegal-character stripping; Windows reserved device names in both cases; empty-template fallback; accent transliteration; length capping.

**Canvas ceiling (5)** — ordinary pages untouched; pages beyond the per-side limit scaled correctly; the scaled result lands inside the limit; the total-area limit is respected independently of the side limit; never scales up.

**PDF pagination (7)** — long pages split across sheets; every slice A4-wide; slices cover the source height exactly once, with no overlap or gap; the final short slice keeps its true proportion; single-page layout preserves aspect ratio; single-page layout clamps to the 200-inch PDF ceiling.

**PDF writer (10)** — header and EOF markers; page count; `DCTDecode` embedding; literal-string escaping of parentheses in the title; `startxref` present; `startxref` points at the `xref` keyword; the xref declares an object count; the entry count matches it; **and every xref byte offset actually points at its own object header.**

That final assertion is the valuable one. A wrong byte offset in a hand-written PDF is silently tolerated by some viewers and rejected outright by others — precisely the class of defect that reaches users unnoticed.

### 3.3 Browser tests — 33/33 ✅

**Extension loading (8)**

| Check | Result |
|---|---|
| Loads with no error on stderr | ✅ |
| `onInstalled` fires and opens the welcome page | ✅ |
| Browser parses the manifest as MV3 | ✅ |
| Version reported as 1.0.0 | ✅ |
| **The browser itself reports exactly 5 permissions** | ✅ |
| **The browser itself reports 0 host permissions** | ✅ |
| Service worker answers a `ping` message round-trip | ✅ |
| Service worker target is live once woken | ✅ |

**Submission ZIP verification (8 further checks, executed separately)** — the built `Store Upload/Extension.zip` was extracted and loaded as an unpacked extension. Verified: `manifest.json` sits at the archive root (a nested folder is the most common packaging rejection), version and name correct, Manifest V3, exactly five permissions, zero host permissions, the service worker answers a message, and no manifest load errors. Result: 8/8.

Reading the permission set back **through the browser's own manifest API**, rather than from our JSON, is deliberate: it verifies what the browser actually grants, which is the claim made to users.

**Service worker capabilities (7)** — `chrome.tabs.captureVisibleTab`, `chrome.scripting.executeScript`, `chrome.downloads.download`, `OffscreenCanvas`, `createImageBitmap` and `indexedDB` are all reachable inside the MV3 worker, and the worker reports the expected version.

`OffscreenCanvas` and `createImageBitmap` being present in the worker is what justifies **not** requesting the `offscreen` permission — an architectural decision now backed by a test rather than an assumption.

**Capture agent on the hostile fixture (18)**

| Check | Result |
|---|---|
| Agent installs into the isolated world | ✅ |
| Measures a page taller than the viewport | ✅ |
| Viewport width excludes the scrollbar | ✅ |
| `prepare()` completes without cancelling | ✅ |
| **Detects both fixed elements** | ✅ |
| **Detects the sticky element** | ✅ |
| Re-measures after the lazy-load pre-pass | ✅ |
| **Frame 0 keeps the fixed header visible** | ✅ |
| **Later frames hide the fixed header** | ✅ |
| **Sticky element is made `static`, not hidden** | ✅ |
| **Reports the ACTUAL scroll position, not the requested one** | ✅ |
| Restores the exact prior scroll position | ✅ |
| Removes the injected stylesheet | ✅ |
| Removes the progress overlay | ✅ |
| Removes every frozen data attribute | ✅ |
| Fixed element visible again afterwards | ✅ |
| Sticky element sticky again afterwards | ✅ |

The bolded rows are the product's differentiators, now covered by assertions rather than intentions:

- **Sticky headers appear once** — `visibility: visible` asserted on frame 0, `visibility: hidden` on a later frame.
- **Sticky elements do not become holes** — `position: static` asserted, so the element renders once in its natural place instead of vanishing.
- **The stitch cannot duplicate the bottom band** — scroll position 99999 is requested and the agent is asserted to report where it *actually* landed.
- **The user's page is left untouched** — scroll position, stylesheet, overlay, attributes and computed styles all asserted back to their pre-capture state.

---

## 4. Manual test matrix — ⬜ specified, not yet executed

Automation cannot reach real websites: the fixture is synthetic, and live sites are where the remaining risk lives. This matrix is the launch-week plan required by [growth-plan.md](growth-plan.md) §4, which deliberately holds all promotion until it passes.

**Procedure:** load unpacked in Chrome via `chrome://extensions`, then work through every case below and record the outcome in this table before any public announcement.

### 4.1 Page archetypes (15)

| # | Archetype | Status |
|---|---|---|
| 1 | Simple static article, no fixed elements | ⬜ |
| 2 | Marketing page with a fixed navbar | ⬜ |
| 3 | Page with a sticky sidebar | ⬜ |
| 4 | Image-heavy page using `loading="lazy"` | ⬜ |
| 5 | Page with a cookie-consent overlay | ⬜ |
| 6 | Page with a floating chat widget | ⬜ |
| 7 | Very long page (~12,000px) | ⬜ |
| 8 | Extremely long page (>16,384px) — expect a downscale notice | ⬜ |
| 9 | Single-viewport page, shorter than the screen | ⬜ |
| 10 | Page with `overflow: hidden` on `body` (modal open) | ⬜ |
| 11 | Page with running CSS animations | ⬜ |
| 12 | Page with `scroll-behavior: smooth` | ⬜ |
| 13 | HiDPI display (DPR 2) | ⬜ |
| 14 | Dark-mode page | ⬜ |
| 15 | Page with a horizontal scrollbar | ⬜ |

### 4.2 Restricted pages and lifecycle (10)

| # | Case | Expected | Status |
|---|---|---|---|
| 16 | `chrome://extensions` | Buttons disabled, accurate explanation | ⬜ |
| 17 | Chrome Web Store page | Same | ⬜ |
| 18 | Built-in PDF viewer | Same | ⬜ |
| 19 | `about:blank` | Handled without error | ⬜ |
| 20 | `Esc` mid-capture | Page restored, nothing saved | ⬜ |
| 21 | Overlay Cancel button | Same | ⬜ |
| 22 | Tab navigated away mid-capture | Job ends, no orphan state | ⬜ |
| 23 | Second capture while one is running | Rejected with "already running" | ⬜ |
| 24 | Worker terminated before the editor opens | Editor still loads from IndexedDB | ⬜ |
| 25 | Editor opened with a stale id | Empty state with a recovery action | ⬜ |

### 4.3 Editor (15)

| # | Case | Status |
|---|---|---|
| 26 | All 12 tools draw correctly | ⬜ |
| 27 | Blur samples the original image, not the composite | ⬜ |
| 28 | Pixelate produces a true mosaic | ⬜ |
| 29 | Undo/redo across 50+ operations | ⬜ |
| 30 | Undo after a crop restores the pre-crop image | ⬜ |
| 31 | Multi-line text with the contrast halo | ⬜ |
| 32 | Step badges auto-increment | ⬜ |
| 33 | Select, move and delete an annotation | ⬜ |
| 34 | Zoom fit / 100% / in / out | ⬜ |
| 35 | Export PNG, JPG, WebP | ⬜ |
| 36 | Export PDF paginated — open in Chrome, Acrobat and Preview | ⬜ |
| 37 | Export PDF single long page | ⬜ |
| 38 | Copy to clipboard, paste into another app | ⬜ |
| 39 | Every keyboard shortcut | ⬜ |
| 40 | Drawing performance on a 12,000px capture | ⬜ |

### 4.4 Settings (2)

| # | Case | Status |
|---|---|---|
| 41 | Every setting persists and takes effect | ⬜ |
| 42 | Reset restores defaults | ⬜ |

---

## 5. Defects found and fixed

### D1 — Illegal-character class silently omitted the backslash *(security-relevant)*

**Severity:** High · **Found by:** automated unit test `blocks path traversal`

`ILLEGAL` was assembled from a string literal:

```js
const ILLEGAL = new RegExp('[<>:\\"/\\|?*...]', 'g');
```

Inside a JavaScript string, the two backslashes are consumed escaping the quote and the pipe, so the compiled character class contained `"` and `|` but **no literal backslash**. A filename template containing a backslash would therefore have reached `chrome.downloads` with a Windows path separator intact.

**Fix:** rewritten as a regex literal, `/[<>:"/\\|?* -]/g`, with a comment recording why it must never be built from a string.

**Why it matters beyond the fix:** this passed code review twice. It was caught only because the test asserted *behaviour* on both separator styles rather than trusting the code's evident intent.

### D2 — Markdown code-span placeholder could corrupt prose

**Severity:** Medium · **Found by:** review during Pages-generator development

The generator parked code-span contents behind a numeric marker delimited by spaces, so any figure in ordinary prose could be mistaken for a placeholder and replaced with unrelated code. Fixed by using a control-character sentinel that cannot occur in the source documents.

### D4 — The `hidden` attribute did not hide *(editor-breaking)*

**Severity:** High · **Found by:** rendering the real extension UI and looking at it

The UA stylesheet rule `[hidden] { display: none }` is overridden by any author rule that sets `display` on the same element — and every panel in this project is a flex container. The consequence in the shipped build was that the editor rendered **every contextual control group simultaneously** (colour, width, size, strength, filled, and the crop confirm buttons), kept the degraded-capture banner permanently visible, and never dismissed the loading state, so the empty state was unreachable.

**Fix:** one rule in `src/ui/theme.css`:

```css
[hidden] { display: none !important; }
```

**Why it took this long to find:** every unit and browser assertion up to this point tested *logic* — the code correctly set `element.hidden = true`, and a DOM assertion on `.hidden` would have passed. Only rendering the interface and looking at it exposed that the property had no visual effect. Verified after the fix by asserting the computed visible groups swap correctly when tools change: arrow shows colour and width, blur shows strength alone.

### D5 — Near-black colour swatch invisible on the dark toolbar

**Severity:** Low (usability) · **Found by:** the same visual pass

The ink swatch (`#12151C`) was indistinguishable from the toolbar behind it and read as an empty gap. Fixed with a hairline inset ring on every swatch.

### D3 — Store screenshot mockups rendered with collapsed text

**Severity:** Low (asset quality) · **Found by:** visual review of the generated images

The editor mockup nested demo content inside a `.canvasFrame` carrying `line-height: 0` — correct for a container holding only canvases, but inherited by the HTML mockup and collapsing every line box. Compounded by an inline `transform` overriding the intended CSS scale. Both fixed and the assets re-rendered and re-reviewed.

---

## 6. Known limitations

Stated here, in the README and in the store listing, rather than discovered by users.

| # | Limitation | Cause | Mitigation |
|---|---|---|---|
| L1 | Cannot capture `chrome://` pages, the Web Store, or the PDF viewer | The browser forbids all extensions on these origins | Detected before the user clicks; accurate explanation given |
| L2 | Pages taller than ~16,384px are downscaled | Canvas dimension and area ceilings | Deliberate scaling with the exact percentage shown, rather than a silent blank image |
| L3 | Capture takes roughly 0.55s per viewport | `MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND` = 2 since Chrome 92; no extension can raise it | Determinate progress on the toolbar badge so the wait is understood |
| L4 | Cross-origin iframes and inner scrollable panes are captured as displayed, not expanded | Extensions cannot scroll cross-origin frames | Documented; region capture is the workaround |
| L5 | A page mutating heavily mid-capture may misalign | Real content change between frames | `PAGE_MUTATED` warning with a retry action |
| L6 | Clipboard copy can fail under a restrictive site `Permissions-Policy` | Site-level policy | Automatic fallback to download; the capture is never lost |
| L7 | Freehand annotation is not operable by screen reader | Canvas drawing is inherently visual | Capture, format choice, export, copy and settings are all fully accessible |
| L8 | Automated extension-loading tests cannot run on stable Chrome | Chrome refuses `--load-extension` | Suite runs on Edge/Chromium — the identical platform |

---

## 7. Performance — ⬜ targets defined, not yet measured

No timing figures are claimed, because none have been measured on real hardware. These are the targets the architecture was designed against ([architecture.md](architecture.md) §7) and the values to record during launch week.

| Metric | Target | Measured |
|---|---|---|
| Popup open to interactive | < 50 ms | ⬜ |
| Service worker cold start | < 30 ms | ⬜ |
| Capture, per viewport | ~0.55 s (browser-bound) | ⬜ |
| Stitch, 20 frames at 1440px wide | < 500 ms | ⬜ |
| Editor load from IndexedDB | < 300 ms | ⬜ |
| Drawing on a tall canvas | 60 fps | ⬜ |
| Peak memory during capture | canvas + one frame | ⬜ |
| Undo history, 100 operations | < 1 MB | ⬜ |
| **Package size** | **< 250 KB unpacked** | **✅ 197 KB unpacked · 68 KB zipped** |

Package size is the one figure actually measured, by the build.

---

## 8. Security review

| Check | Result |
|---|---|
| No remote code execution paths | ✅ Build-enforced |
| No network requests to any remote origin | ✅ Build-enforced |
| Default MV3 CSP, unmodified | ✅ |
| Overlays isolated in a closed shadow root | ✅ Page CSS cannot alter them; ours cannot leak |
| No page content read or transmitted | ✅ Geometry and computed styles only |
| Filename input sanitised before `chrome.downloads` | ✅ Fixed in D1; regression-tested |
| Object URLs revoked after use | ✅ |
| Capture blobs deleted once loaded; TTL sweep for orphans | ✅ |
| No user content in logs | ✅ Codes and dimensions only |
| Permission set confirmed by the browser at runtime | ✅ 5 permissions, 0 host permissions |

---

## 9. Sign-off

| Gate | Status |
|---|---|
| All automated tests passing | ✅ 85/85 |
| Compliance audit passing | ✅ 21/21 |
| Security review complete | ✅ |
| Known limitations documented publicly | ✅ |
| Manual matrix executed | ⬜ **Scheduled for launch week — required before any promotion** |
| Performance measured | ⬜ Scheduled for launch week |

**Recommendation: approved for Chrome Web Store submission.**

The pending items are deliberately sequenced after submission rather than before it: the manual matrix needs the extension installed from a real store listing, and [growth-plan.md](growth-plan.md) §4 already gates all promotion behind completing it. Submitting is safe; *announcing* is not, until §4 is green.

### Reproducing this report

```bash
npm run verify
npm run test:runtime
```

Set `BROWSER_PATH` to a Chromium build that permits `--load-extension` — Edge, Chromium, or Chrome for Testing. Stable Chrome will not.

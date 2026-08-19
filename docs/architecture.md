# Technical Architecture — Tallshot

**Owner:** Extension Engineer (internal)
**Version:** 1.0 · 19 August 2026
**Manifest:** V3

---

## 1. Design constraints

Everything below follows from four hard constraints:

| # | Constraint | Consequence |
|---|---|---|
| C1 | `chrome.tabs.captureVisibleTab` is throttled to **2 calls/second** (`MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND`, Chrome 92+). The limit **cannot be raised**. | Capture must be paced and retried, not looped. A 20-frame page takes ≥10s and that must be shown honestly. |
| C2 | The MV3 service worker **terminates when idle** (~30s) and loses all in-memory state. | Nothing large or important may live in a service-worker variable across an await boundary that the user controls. Images go to IndexedDB. |
| C3 | Canvas has a **maximum dimension and area** (~16,384px per side in Chrome). | Very tall pages must be detected and downscaled deliberately, with the user told. |
| D4 | We ship **no host permissions**. | Every page interaction happens through `chrome.scripting.executeScript` under `activeTab`, granted only by an explicit user gesture. |

---

## 2. Component map

```
┌──────────────────────────────────────────────────────────────────────┐
│ USER GESTURE  (toolbar click · keyboard command · context menu)      │
│               └── this is what grants activeTab                      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│ SERVICE WORKER   src/background/service-worker.js                    │
│ ─────────────────────────────────────────────────────────────────    │
│ · Owns the capture state machine (one job at a time, per tab)        │
│ · Injects capture agents via chrome.scripting.executeScript          │
│ · Calls chrome.tabs.captureVisibleTab with quota-aware pacing        │
│ · Stitches frames on an OffscreenCanvas                              │
│ · Persists the result blob to IndexedDB                              │
│ · Opens the editor tab / downloads directly                          │
│                                                                      │
│  imports ──▶ lib/constants · lib/settings · lib/store                │
│              lib/stitch    · lib/filename · lib/errors · lib/flags   │
└───────┬─────────────────────────────────────────────┬────────────────┘
        │ executeScript (on demand, activeTab)        │ IndexedDB
        ▼                                             ▼
┌───────────────────────────────┐        ┌────────────────────────────┐
│ PAGE AGENTS   src/capture/    │        │ IndexedDB  "tallshot"      │
│ ───────────────────────────── │        │  store: captures           │
│ page-agent.js                 │        │  { id, blob, meta, ts }    │
│  · measure()                  │        │  · survives SW termination │
│  · preloadLazyContent()       │        │  · TTL swept on startup    │
│  · freezeStickyElements()     │        └─────────────┬──────────────┘
│  · scrollTo() / restore()     │                      │
│  · progress overlay (Shadow   │                      │
│    DOM, style-isolated)       │                      ▼
│                               │        ┌────────────────────────────┐
│ region-agent.js               │        │ EDITOR   src/editor/       │
│  · drag-select overlay        │        │ · reads blob by id         │
│  · keyboard nudging           │        │ · layer-based annotation   │
└───────────────────────────────┘        │ · undo/redo history        │
                                         │ · PNG/JPG/WebP/PDF export  │
┌───────────────────────────────┐        └────────────────────────────┘
│ POPUP    src/popup/           │
│ · three capture actions       │        ┌────────────────────────────┐
│ · inline post-capture setting │        │ OPTIONS  src/options/      │
└───────────────────────────────┘        │ · settings, synced         │
                                         └────────────────────────────┘
```

---

## 3. Manifest V3 design

```jsonc
{
  "manifest_version": 3,
  "name": "Tallshot — Full Page Screenshot & Editor",
  "short_name": "Tallshot",
  "version": "1.0.0",
  "minimum_chrome_version": "116",

  "permissions": ["activeTab", "scripting", "downloads", "storage", "contextMenus"],
  // NOTE: no "host_permissions", no "tabs", no "<all_urls>".

  "background": { "service_worker": "src/background/service-worker.js", "type": "module" },
  "action":     { "default_popup": "src/popup/popup.html" },
  "options_page": "src/options/options.html",
  "commands":   { "capture-full-page": …, "capture-visible": …, "capture-region": … }
}
```

### Permission justification

| Permission | Why it is required | Why it is the minimum | Install warning shown |
|---|---|---|---|
| `activeTab` | Grants temporary access to the current tab — required for `captureVisibleTab` and for injecting the capture agent | The alternative is `<all_urls>`, which grants permanent access to every site. `activeTab` grants access to one tab, only after an explicit user gesture, and revokes it on navigation. | **None** |
| `scripting` | Injects `page-agent.js` / `region-agent.js` on demand | Declaring persistent content scripts would require host permissions and would run our code on every page the user visits. On-demand injection runs it only when asked. | **None** |
| `downloads` | Saves the finished image to disk | Without it we could only offer clipboard copy, which loses the file | **None** |
| `storage` | Persists user settings via `chrome.storage.sync` | Settings only. No capture content and no browsing data is stored here. | **None** |
| `contextMenus` | Right-click → capture | Purely additive UX; the API cannot read page content | **None** |

**Chrome shows no site-access warning at install.** This is a direct product of the permission set and is a stated selling point.

### What we deliberately do not request

| Not requested | Why |
|---|---|
| `<all_urls>` / `host_permissions` | Would make the privacy claim unverifiable and trigger the "read and change all your data" warning |
| `tabs` | `activeTab` already supplies the tab handle we need. `tabs` would expose URLs and titles of every tab. |
| `debugger` | `Page.captureScreenshot` with `captureBeyondViewport` would give single-shot full-page capture — but it displays a persistent "Tallshot is debugging this browser" banner and grants sweeping power. Rejected on UX and trust grounds. |
| `offscreen` | Not needed: `OffscreenCanvas` + `createImageBitmap` are available directly in the MV3 service worker. |
| `clipboardWrite` | The async Clipboard API works in a focused extension page without it. |
| `unlimitedStorage` | IndexedDB under the default quota is ample; captures are transient and swept. |

---

## 4. The capture engine

The engine is the product. It is a five-phase pipeline with explicit failure handling at each step.

### Phase 1 — Measure

Injected into the page. Returns a geometry report:

```js
{
  pageWidth, pageHeight,       // max of scrollHeight/offsetHeight across
                               //   documentElement and body — sites disagree
  viewportWidth, viewportHeight,
  devicePixelRatio,
  scrollX, scrollY,            // saved for exact restoration
  originalOverflow,            // saved to restore after freezing
  frameCount                   // ceil(pageHeight / viewportHeight)
}
```

Height is computed as the max across `documentElement.scrollHeight`, `documentElement.offsetHeight`, `body.scrollHeight` and `body.offsetHeight`, because different site layouts report authoritatively on different nodes. Taking the max is the only reliable approach.

### Phase 2 — Lazy-load pre-pass *(fixes defect B)*

Before capturing anything, the agent scrolls the full height in viewport-sized steps, pausing briefly at each, then returns to the top and waits for layout to settle.

- Steps are capped (`MAX_PRELOAD_STEPS`) so an infinite-scroll feed cannot run forever.
- After the pass, the agent re-measures — lazy content usually makes the page taller, and capturing against a stale height truncates the result.
- The user sees this as a named phase ("Loading images"), so a 3-second pause is understood rather than looking like a hang.

### Phase 3 — Freeze *(fixes defect A)*

The single most important correctness step.

1. **Scan** every element for `position: fixed` or `position: sticky` via `getComputedStyle`, excluding our own overlay.
2. **Tag** each with a data attribute and record its original inline `visibility`.
3. **Inject** a stylesheet that: disables `scroll-behavior: smooth`, freezes CSS animations and transitions, and hides `[data-tallshot-frozen]` elements.
4. Frame 0 is captured **with sticky elements visible** — they belong at the top of the page, exactly once.
5. Frames 1..n are captured **with them hidden**.
6. **Restore** on completion *and* on cancellation *and* on error, in a `finally` block. The user's page must never be left modified.

Sticky elements are hidden with `visibility: hidden`, not `display: none`, deliberately: `display: none` removes the element from layout, which reflows the page and changes its height mid-capture. `visibility: hidden` preserves geometry.

### Phase 4 — Capture loop *(fixes defect C)*

```
for i in 0..frameCount-1:
    scrollTo(0, i * effectiveStep)      // effectiveStep = viewportHeight
    await settle(captureDelay)          // user-configurable, default 250ms
    dataUrl = await captureWithQuota()  // paced + retried
    frames.push({ dataUrl, y: actualScrollY })   // ACTUAL, not intended
```

**Quota handling.** Requests are spaced by `MIN_CAPTURE_INTERVAL_MS` (550ms, i.e. under 2/s). If Chrome still returns the quota error, we back off exponentially (550 → 1100 → 2200ms) up to `CAPTURE_MAX_RETRIES`. If a frame still fails, the job completes as **partial** rather than aborting — a screenshot of 82% of the page is far more useful than an error dialog, provided we say so.

**Actual vs intended scroll position.** We record `window.scrollY` *after* scrolling, never the value we asked for. The final frame almost always cannot scroll a full step (the page runs out), so its true offset is smaller. Stitching against the intended value is the classic bug that duplicates a band of content at the bottom of the image. We stitch against reality.

### Phase 5 — Stitch

Runs in the service worker on an `OffscreenCanvas`:

```
dataURL ──fetch──▶ Blob ──createImageBitmap──▶ ImageBitmap ──drawImage──▶ OffscreenCanvas
```

- Canvas dimensions are in **device pixels** (`pageWidth × dpr`), so the output is sharp on HiDPI displays rather than upscaled and soft.
- Each frame is drawn at `y = frame.actualScrollY × dpr`, so overlapping final frames simply paint over the region already covered — correct by construction.
- **Oversize handling (C3):** if the target height exceeds `MAX_CANVAS_DIMENSION`, we compute a scale factor, render the whole stitch at that scale, and flag the result `downscaled` with the factor. The editor then shows an amber banner stating the exact percentage. We never silently emit a blank canvas — the failure mode users report most often from competitors.
- Frames are converted and drawn one at a time and each `ImageBitmap` is `close()`d immediately, keeping peak memory at roughly one frame plus the destination canvas rather than all frames at once.

### Cancellation

`Esc` or the overlay's Cancel button sets an abort flag checked between every frame. On abort the page is restored, the job is discarded, and no partial file is written.

---

## 5. Storage strategy

Three stores, chosen per data type — the choice matters because MV3 service workers die.

| Store | Contents | Why this store | Lifetime |
|---|---|---|---|
| `chrome.storage.sync` | User settings (~1KB) | Syncs across the user's devices; tiny quota is ample; survives reinstall | Permanent until reset |
| `chrome.storage.session` | Active job state, in-flight flags | Memory-backed, cleared on browser close, and **not** written to disk — appropriate for transient state that must survive a service-worker restart within a session | Browser session |
| **IndexedDB** (`tallshot` → `captures`) | Capture blobs (1–50 MB) | The only store that handles blobs at this size. Survives service-worker termination — the reason the editor can open reliably. | Swept: on startup and after the editor loads a capture |

**Why not `chrome.storage.local` for images?** It caps at ~10 MB without `unlimitedStorage`, and serialising a multi-megabyte image to a base64 string is both slow and roughly 33% larger than the blob. IndexedDB stores the `Blob` natively.

### Blob handoff — the key sequencing decision

```
SW: stitch ──▶ Blob ──▶ IndexedDB.put({id, blob, meta})
                              │
                              ▼
SW: chrome.tabs.create({ url: "editor.html?id=<id>" })
                              │
                              ▼
Editor: read blob by id ──▶ render ──▶ delete record
```

The editor is opened *after* the write resolves. If the service worker is killed the instant the tab opens, the image is already durable on disk and the editor still works. Records are also swept on startup with a TTL, so an abandoned capture cannot accumulate.

---

## 6. Message protocol

All messages are `{ type, payload, requestId }` with types centralised in `lib/constants.js` — no string literals at call sites.

| Type | Direction | Purpose |
|---|---|---|
| `CAPTURE_START` | popup / command / menu → SW | Begin a job (`mode: full \| visible \| region`) |
| `CAPTURE_CANCEL` | page agent → SW | User pressed Esc |
| `CAPTURE_PROGRESS` | SW → page agent | Phase and step updates for the overlay |
| `CAPTURE_DONE` | SW → page agent | Teardown the overlay |
| `CAPTURE_ERROR` | SW → page agent | Typed error for display |
| `REGION_SELECTED` | region agent → SW | Selected rectangle in CSS pixels |
| `EDITOR_READY` | editor → SW | Editor has loaded the blob; safe to sweep |
| `SETTINGS_CHANGED` | options → SW | Invalidate the cached settings snapshot |

Every handler validates its payload shape and returns a typed error rather than throwing across the message boundary, because an uncaught throw in a service worker silently drops the response and the caller hangs forever.

---

## 7. Performance strategy

| Concern | Approach | Target |
|---|---|---|
| **Popup open latency** | No framework, no bundler, no web font, no network. Inline critical CSS, a single small script. | < 50 ms to interactive |
| **Service worker cold start** | ES modules with no top-level side effects; settings read lazily, not at import | < 30 ms |
| **Capture wall time** | Bounded below by C1 at ~550ms/frame. We minimise *frame count* — the only variable we control — by stepping a full viewport height, never overlapping. | ≈ 0.55 s per viewport |
| **Peak memory** | One `ImageBitmap` alive at a time, `close()`d after each draw; frames held as compact data URLs until drawn | ≈ canvas size + one frame |
| **Stitch time** | GPU-backed `OffscreenCanvas`, single pass, no intermediate copies | < 500 ms for a 20-frame page |
| **Editor responsiveness** | Two-canvas model: a static base canvas for the image plus a scratch canvas for the in-progress stroke, so only the scratch layer repaints during a drag | 60 fps while drawing |
| **Undo memory** | Vector command history (shape descriptors), **not** per-step bitmaps. A 100-step history costs kilobytes instead of hundreds of megabytes. | < 1 MB for 100 steps |
| **Package size** | Zero runtime dependencies. Our own minimal PDF writer instead of a bundled library. | 191 KB unpacked, 67 KB zipped |

### The two-canvas editor model

```
┌─ base canvas ─────────────┐   The screenshot plus all committed
│  image + committed layers │   annotations. Repainted only when the
└───────────────────────────┘   layer list changes (draw end, undo, redo).

┌─ scratch canvas (overlay) ┐   Only the stroke currently under the
│  in-progress stroke       │   cursor. Cleared and repainted every
└───────────────────────────┘   pointermove. Cheap — one shape.
```

Repainting a 1440×8320 base canvas on every `pointermove` would drop to single-digit fps. Separating the layers keeps drawing smooth regardless of image height.

---

## 8. Error handling

Errors are typed in `lib/errors.js`. Each carries a stable `code`, a user-facing `message`, and an optional `action`.

| Code | Cause | User sees |
|---|---|---|
| `RESTRICTED_PAGE` | `chrome://`, Web Store, PDF viewer, `file://` without opt-in | "Chrome doesn't allow extensions to capture this page. This applies to every extension." |
| `QUOTA_EXCEEDED` | Capture throttle survived all retries | "Chrome limited how fast we could capture. The capture stopped at N%." + retry |
| `PAGE_TOO_LARGE` | Height exceeds the canvas ceiling | "Scaled to N% to fit Chrome's image limit." (informational, not fatal) |
| `INJECTION_FAILED` | CSP or a policy blocked script injection | "This site blocked Tallshot from running. Try the visible-area capture instead." |
| `PAGE_MUTATED` | Height changed materially mid-capture | "The page moved while capturing, so the image may not line up." + retry |
| `NO_CAPTURE` | Editor opened with a missing/expired id | "The image for this tab is no longer available." |
| `DOWNLOAD_FAILED` | `chrome.downloads` rejected | "Chrome blocked the download." + copy-to-clipboard fallback |

`RESTRICTED_PAGE` is detected **before** any work begins by URL-scheme test, so the user gets an instant, accurate explanation rather than a failed capture.

---

## 9. The Free/Pro seam

Pro must be enableable **without an architectural rewrite**. Two modules provide the seam, and both ship inert in v1.0.

### `lib/flags.js`

```js
export const TIER = { FREE: 'free', PRO: 'pro' };

// Single source of truth. Every gated capability is named here.
export const CAPABILITIES = {
  captureFullPage:  TIER.FREE,
  captureVisible:   TIER.FREE,
  captureRegion:    TIER.FREE,
  editorAllTools:   TIER.FREE,
  exportPngJpgWebp: TIER.FREE,
  exportPdf:        TIER.FREE,
  // Phase 2 — declared now, unimplemented, so the gate exists from day one
  scheduledCapture: TIER.PRO,
  batchCapture:     TIER.PRO,
  ocrTextExtract:   TIER.PRO,
  cloudSync:        TIER.PRO,
  customWatermark:  TIER.PRO,
};

export async function can(capability) { … }   // the only gate call site pattern
```

### `lib/license.js`

A stub with the final interface already fixed:

```js
export async function getTier()          { return TIER.FREE; }   // v1.0: always free
export async function activate(key)      { … }                    // Phase 2
export async function deactivate()       { … }                    // Phase 2
```

### Why this is enough

- Every capability check already routes through `can()`. Adding Pro means implementing `getTier()` against a licence check — **no call sites change**.
- **No `can()` call in v1.0 can ever return false**, because every shipped capability is mapped to `FREE`. There is no dormant paywall code path that could misfire and lock out a free user.
- The commitment in [free-vs-pro-plan.md](free-vs-pro-plan.md) is that entries never move from `FREE` to `PRO`. The map makes that promise auditable in a single file.

---

## 10. Security

| Measure | Implementation |
|---|---|
| **No remote code** | Everything is bundled. No `eval`, no `new Function`, no injected `<script src>`, no CDN. MV3 forbids remote code and we comply structurally, not just nominally. |
| **No network calls** | The extension contains no `fetch`/`XMLHttpRequest`/`WebSocket` to any remote origin. The only `fetch` calls target `data:` and `blob:` URLs we created ourselves. |
| **CSP** | Default MV3 policy (`script-src 'self'`) unmodified — no relaxations requested. |
| **Injection isolation** | Page agents run in the isolated world. The progress overlay is inside a **closed Shadow DOM**, so the host page's CSS cannot alter it and our CSS cannot leak into the page. |
| **No page data read** | Agents read geometry and computed styles only. No DOM content, no form values, no cookies, no storage is read or transmitted. |
| **Input sanitisation** | The filename template is sanitised against path traversal and illegal filesystem characters before reaching `chrome.downloads`. |
| **Blob lifetime** | Object URLs are revoked immediately after use; IndexedDB records are deleted once the editor has loaded them and swept by TTL at startup. |
| **No user content in logs** | Errors log codes and dimensions. No URLs, no image data. |

---

## 11. Browser compatibility

| Target | Status |
|---|---|
| Chrome 116+ | **Primary.** `minimum_chrome_version: "116"` — the floor for the MV3 APIs used here. |
| Edge 116+ | Compatible (Chromium); untested at v1.0, listed as a Phase 2 port. |
| Brave / Opera / Vivaldi | Expected compatible (Chromium). |
| Firefox | **Not supported at v1.0.** MV3 differences (`browser.*` namespace, event-page rather than service-worker semantics) require a compatibility layer. Tracked in [roadmap.md](roadmap.md). |
| Safari | Out of scope. |

---

## 12. Build and release

Zero dependencies. Plain Node scripts, reproducible from a clean checkout.

| Command | Action |
|---|---|
| `npm run icons` | Renders `assets/icons/*.png` at 16/32/48/128 from code |
| `npm run screenshots` | Renders store screenshots and the promo tile from code |
| `npm run verify` | Pre-submission self-audit — manifest validity, file existence, permission set, forbidden-API scan, version consistency |
| `npm run build` | Produces `Store Upload/Extension.zip` containing only runtime files |
| `npm run release` | `icons → screenshots → verify → build`, then assembles the whole `Store Upload/` folder |

`verify.mjs` fails the build on any of: a manifest field mismatch, a missing referenced file, a permission not documented in [compliance.md](compliance.md), any occurrence of `eval`/`new Function`/remote `fetch`, or a version mismatch between `manifest.json`, `package.json` and `CHANGELOG.md`. The submission ZIP cannot be produced from a non-compliant tree.

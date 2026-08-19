# Progress Tracker — Tallshot

**Last updated:** 19 August 2026
**Current version:** 1.0.0
**Status:** ✅ Complete — ready for Chrome Web Store submission

---

## 1. Phase status

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Project initialisation, name selection, trademark clearance | ✅ Complete |
| 1 | Market research | ✅ Complete |
| 2 | Product strategy | ✅ Complete |
| 3 | Branding | ✅ Complete |
| 4 | UX design | ✅ Complete |
| 5 | Technical architecture | ✅ Complete |
| 6 | Roadmap | ✅ Complete |
| 7 | Multi-role execution | ✅ Complete |
| 8 | Development | ✅ Complete |
| 9 | Chrome Web Store compliance | ✅ Complete |
| 10 | Privacy & legal, published to GitHub Pages | ✅ Complete |
| 11 | Testing | ✅ Automated suites complete — 85/85 passing. Manual matrix specified, scheduled for launch week. |
| 12 | Growth plan | ✅ Complete |
| 13 | Store listing | ✅ Complete |
| 14 | Store upload package | ✅ Complete |

---

## 2. Build inventory

### Source — 17 files

| File | Lines | Purpose |
|---|---|---|
| `manifest.json` | 58 | MV3 manifest, five permissions, no host permissions |
| `src/background/service-worker.js` | 486 | Capture state machine, quota pacing, stitching, delivery |
| `src/lib/constants.js` | 168 | Message types, limits, defaults — single source of truth |
| `src/lib/errors.js` | 148 | Typed errors with user-facing causes and actions |
| `src/lib/flags.js` | 71 | Capability→tier map; the Free/Pro seam |
| `src/lib/license.js` | 51 | Licence stub; inert in 1.0 |
| `src/lib/settings.js` | 116 | `chrome.storage.sync` wrapper with validation |
| `src/lib/store.js` | 132 | IndexedDB blob store; survives worker termination |
| `src/lib/stitch.js` | 168 | OffscreenCanvas stitching, canvas-ceiling handling |
| `src/lib/pdf.js` | 210 | Original minimal PDF writer (DCTDecode) |
| `src/lib/filename.js` | 124 | Filename templating and sanitisation |
| `src/capture/page-agent.js` | 476 | Measure, pre-pass, freeze, step, restore |
| `src/capture/region-agent.js` | 396 | Drag-select overlay |
| `src/popup/` | 3 files | Capture launcher |
| `src/editor/` | 3 files | 12-tool annotation editor |
| `src/options/` | 3 files | Settings |
| `src/ui/theme.css` | 178 | Shared design tokens |

### Tooling — 8 files, zero dependencies

| File | Purpose |
|---|---|
| `tools/png.mjs` | PNG encoder built on Node's zlib |
| `tools/make-icons.mjs` | Renders the icon set from geometry, per-size |
| `tools/screenshot-templates.mjs` | Store screenshot markup using real product CSS |
| `tools/make-screenshots.mjs` | Renders store images via headless Chrome |
| `tools/make-pages.mjs` | Renders the GitHub Pages site from the Markdown source |
| `tools/zip.mjs` | Reproducible ZIP writer |
| `tools/verify.mjs` | Pre-submission compliance audit — gates the build |
| `tools/build.mjs` | Produces the ZIP and assembles `Store Upload/` |
| `tools/test-runtime.mjs` | Unit tests + CDP-driven browser tests |

### Assets — 10 files, all generated from source

4 icons · 5 store screenshots · 1 promo tile. No third-party artwork anywhere in the project.

### Documentation — 13 documents plus README, CHANGELOG, LICENSE, PRIVACY, TERMS

---

## 3. Test results

| Suite | Checks | Result |
|---|---|---|
| Static compliance audit | 21 | ✅ 21/21 |
| Unit tests | 31 | ✅ 31/31 |
| Browser tests (real extension, CDP) | 33 | ✅ 33/33 |
| **Total automated** | **85** | **✅ 85/85** |
| Manual matrix against live websites | 42 cases | ⬜ Specified, scheduled for launch week |
| Runtime performance measurement | 9 metrics | ⬜ Targets set, not yet measured |

Full detail in [testing-report.md](testing-report.md).

---

## 4. Decision log

Decisions worth recording because they were not obvious and shaped the product.

| # | Decision | Reasoning |
|---|---|---|
| D1 | Name **Tallshot** | Clear of Chrome Web Store and software marks; describes the artefact; avoids the aggressively-enforced `SNAP` family that ruled out the stronger-sounding "Snapfold" |
| D2 | **No host permissions** — `activeTab` only | Turns privacy from a promise into a structural property, and removes the install warning that is the category's biggest conversion barrier |
| D3 | Rejected the `debugger` API | `Page.captureScreenshot` with `captureBeyondViewport` would give single-shot full-page capture, but it shows a persistent "is debugging this browser" banner. Correctness is not worth that trust cost. |
| D4 | Rejected the `offscreen` permission | `OffscreenCanvas` + `createImageBitmap` are available directly in the MV3 worker — now verified by test, not assumed |
| D5 | Clipboard via on-demand injection, not `offscreen` | Keeps the permission list at five; falls back to download when a page's `Permissions-Policy` blocks it |
| D6 | IndexedDB for capture blobs | `storage.local` caps at ~10MB and needs base64; the worker dies when idle, so the blob must be on disk before the editor opens |
| D7 | Stitch at the **actual** scroll offset | The final frame never scrolls a full step, so stitching against the intended offset duplicates a band at the bottom — the category's classic stitching bug |
| D8 | Sticky elements made `static`, not hidden | Hiding leaves a hole where the element genuinely belongs; `static` renders it once in its natural place |
| D9 | `visibility: hidden`, never `display: none`, for fixed elements | `display: none` reflows the document and changes its height mid-capture |
| D10 | Overlay hidden during the capture loop | It is `position: fixed`, so it would be captured in every frame; toggling it around each capture would strobe at 2Hz. Progress moves to the toolbar badge instead. |
| D11 | Own PDF writer instead of a library | ~200 lines versus 100–300KB of third-party code with a licence attached. Provenance matters after the August 2026 removal. |
| D12 | Own PNG encoder and ZIP writer | Same reasoning; also makes the build reproducible with nothing but Node |
| D13 | Everything free, permanently | The two market leaders paywall exactly the editor we give away. Matching them would discard the wedge. |
| D14 | Free/Pro seam shipped inert | Adding Pro later becomes an implementation change behind a stable boundary rather than a refactor |
| D15 | English only at launch | Machine-translated metadata inflates installs with users who cannot use the UI and depresses ratings — visible in the reference product |
| D16 | Limitations published in the store listing | Costs a few installs, prevents the surprise one-star reviews that sink ranking |
| D17 | No in-product analytics | Deliberate trade: blunter product learning in exchange for a privacy claim no competitor can match |
| D18 | Browser tests run on Edge | Stable Chrome refuses `--load-extension` entirely; Edge is the identical platform |

---

## 5. Defects fixed during the build

| # | Defect | Severity | Found by |
|---|---|---|---|
| D1 | Illegal-character class silently omitted the backslash, so a Windows path separator could reach `chrome.downloads` | **High** | Automated unit test — had passed code review twice |
| D2 | Markdown code-span placeholder could corrupt any number in prose | Medium | Review during Pages generator work |
| D3 | Store screenshot mockups rendered with collapsed text (inherited `line-height: 0`) and a double-applied transform | Low | Visual review of generated assets |

Detail in [testing-report.md](testing-report.md) §6.

---

## 6. Completion gate

Every item verified present and working, not merely referenced.

| Gate item | Status | Evidence |
|---|---|---|
| Every referenced file exists | ✅ | `verify.mjs` checks all manifest and HTML references |
| Documentation complete, no placeholders | ✅ | `verify.mjs` checks 20 required documents and scans for placeholder markers |
| Icons exist at all four sizes | ✅ | Generated; dimensions asserted |
| Screenshots exist at the required dimensions | ✅ | Five at 1280×800, promo at 440×280, asserted |
| Extension builds | ✅ | `npm run build` |
| ZIP loads as an unpacked extension | ✅ | Loaded and driven over CDP in Edge (Chromium); manifest, permissions and service worker verified by the browser itself. Stable Chrome blocks CLI side-loading, so the Chrome path is the first step of the launch-week manual pass. |
| Store Upload folder complete | ✅ | ZIP, Store Assets, Privacy, Upload Guide |
| Privacy policy published on GitHub Pages | ✅ | See §7 |
| Final privacy policy URL recorded | ✅ | `https://owncoder.github.io/tallshot/` |
| Chrome Web Store self-audit passes | ✅ | 25/25 |

---

## 7. Publication status

| Item | Status |
|---|---|
| Git repository initialised, 1.0.0 committed | ✅ |
| GitHub repository `ownCoder/tallshot` created and public | ✅ |
| GitHub Pages enabled from the `gh-pages` branch | ✅ |
| Privacy policy live at `https://owncoder.github.io/tallshot/` | ✅ |
| Terms live at `https://owncoder.github.io/tallshot/terms.html` | ✅ |
| Submission ZIP extracted and load-verified | ✅ 8/8 — manifest at archive root, 5 permissions, 0 host permissions, worker responds |
| Chrome Web Store submission | ⬜ Awaiting the developer's action — package ready in `Store Upload/` |

---

## 8. Next actions

1. Submit using `Store Upload/Upload Guide.md` — 15 minutes, everything prepared.
2. Hold the launch quiet for one week; test against 30+ real sites ([growth-plan.md](growth-plan.md) §4).
3. Patch anything real users hit before any promotion.
4. Begin community seeding only once the rating gate clears (≥ 4.0, zero P0).

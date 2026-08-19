# Project Overview — Tallshot

**Version:** 1.0.0
**Status:** Ready for Chrome Web Store submission
**Owner:** ownCoder
**Created:** 19 August 2026

---

## 1. Final project name

# **Tallshot**

**Full product title (store):** Tallshot — Full Page Screenshot & Editor
**Tagline:** *Capture the whole page. Keep it yours.*

Used identically and without variation across:

| Surface | Value |
|---|---|
| Project folder | `Tallshot/` |
| `manifest.json` → `name` | `Tallshot — Full Page Screenshot & Editor` |
| `manifest.json` → `short_name` | `Tallshot` |
| GitHub repository | `tallshot` |
| GitHub Pages site | `https://owncoder.github.io/tallshot/` |
| Store listing title | `Tallshot — Full Page Screenshot & Editor` |
| Release package | `Store Upload/Extension.zip` |
| Documentation | "Tallshot" throughout |
| CSS namespace | `--ts-*` custom properties, `.ts-` class prefix |
| Storage keys | `tallshot.settings`, `tallshot.stats` |

---

## 2. Why this name was selected

### The requirement

The name had to be simultaneously: unique in the Chrome Web Store, free of trademark conflict, brandable enough to be remembered and recommended, and semantically connected to the product so that it reinforces rather than fights the store listing.

### Candidates evaluated

| Candidate | Verdict | Reason |
|---|---|---|
| **Tallshot** | ✅ **Selected** | Clear on all checks. Two syllables, trivially spellable, semantically exact. |
| Snapfold | ❌ Rejected | "Fold" concept was strong, but `SNAP` is an aggressively enforced trademark family (Snap Inc.). Unnecessary risk for a coined mark. |
| Pagefold | ❌ Rejected | Clear of conflict but too descriptive to function as a brand; weak recall and hard to defend. |
| Overfold | ❌ Rejected | Clear of conflict but semantically opaque — users would not connect it to screenshots. |
| ScrollShot | ❌ Rejected | **Already a live Chrome Web Store extension** ("ScrollShot - Capture Entire Web Pages"). Direct collision. |
| SnapFull | ❌ Rejected | Live product at `snapfull.net` in the same category. |
| WispCapture | ❌ Rejected | Prior internal working name. "Wisp" implies faintness and small size — the opposite of the product's promise of completeness. |

### Why *Tallshot* wins

1. **Semantically exact.** The defining output of this product is a *tall* image — a screenshot far taller than the screen. The name describes the artefact, not the mechanism, which is how durable product names work.
2. **Brandable.** Two syllables, one compound word, no ambiguous spelling, no numerals or punctuation, no vowel gymnastics. It survives being spoken aloud in a recommendation.
3. **Verb-friendly.** "Just Tallshot it" works. Names that can become verbs get recommended more.
4. **SEO-compatible without being SEO-bait.** The brand carries recall; the store title suffix ("Full Page Screenshot & Editor") carries the keywords. This separation keeps us compliant with the Chrome Web Store prohibition on misleading metadata and keyword stuffing, while still ranking.
5. **Distinct from every incumbent.** GoFullPage, FireShot, Awesome Screenshot, Nimbus, and the reference product all cluster around "shot/capture/screen + descriptor." "Tallshot" sits adjacent to the category vocabulary without colliding with any specific mark.
6. **Room to grow.** The name does not encode "Chrome," "extension," or "free," so it survives a Firefox/Edge port, a Pro tier, and a companion web app.

---

## 3. Trademark conflict summary

**Search date:** 19 August 2026
**Scope:** Chrome Web Store listings, general web/software search, app stores, and known category trademark holders.

| Check | Result |
|---|---|
| Chrome Web Store — extension named "Tallshot" | **None found.** No listing exists under this name. |
| Web/software search — "Tallshot" as a company, app, or product | **None found.** No commercial software entity operating under this mark. |
| Known screenshot-category marks (GoFullPage, FireShot, Awesome Screenshot, Nimbus, FuseBase, Snagit, Greenshot, Lightshot) | **No collision.** "Tallshot" is not confusingly similar to any of these in sound, appearance, or meaning. |
| Aggressive trademark families (Snap Inc. `SNAP`, Google `CHROME`) | **Avoided by construction.** "Tall" is not a protected term; "shot" is descriptive and widely used across the category (Lightshot, Greenshot, FireShot all coexist), which weakens any single-party claim. |
| Google brand compliance | **Compliant.** The name contains no Google trademark. Per the Chrome Extensions Branding Guidelines we do not use "Chrome," "Google," or the Chrome logo in our name, icon, or branding. |

### Findings and caveats

- No conflicting mark was identified. The "-shot" suffix is demonstrably shared by multiple coexisting products in this exact category, which establishes that the suffix alone does not create confusion.
- **This is a clearance search, not a legal opinion.** It covers public search and store listings, not a full USPTO/EUIPO registry examination. A formal registry search is recommended before filing a trademark application or before any significant paid marketing spend. This is tracked as a Phase 2 item in [roadmap.md](roadmap.md).
- **Defensive posture adopted:** every asset shipped in this extension — icons, illustrations, UI, copy, and code — is original work created for this project. No third-party libraries, fonts, icon sets, or images are bundled. This directly addresses the failure mode that removed GoFullPage from the store in August 2026 (a copyright dispute over a design element). Provenance is documented in [compliance.md](compliance.md).

---

## 4. Branding rationale (summary)

Full detail in [branding.md](branding.md).

| Element | Decision | Rationale |
|---|---|---|
| **Personality** | Precise, calm, unshowy, trustworthy | The category's problem is unreliability and broken trust. The brand should feel like a tool that works, not a startup that pitches. |
| **Primary colour** | Violet `#7A5CFF` | Deliberate escape from the category's blue (GoFullPage, Awesome Screenshot) and red-orange (FireShot). Violet reads modern and software-native without reading playful. |
| **Accent colour** | Amber `#FFB020` | Marks the active tool and the capture frame. High contrast against violet; signals "this is live" without using alarm red. |
| **Base** | Near-black ink `#0F1117` | The editor is a dark canvas so the user's screenshot — usually a bright web page — is the brightest thing on screen. The tool disappears; the work is the focus. |
| **Logo mark** | A tall page form continuing past a capture frame, with a downward vector | Depicts the product's single idea — *there is more page than screen, and we get all of it* — in one glyph that survives 16 px. |
| **Typography** | System UI stack (Segoe UI / SF / Inter / Roboto) | Native feel, zero download weight, zero third-party font licence exposure, perfect OS rendering. Consistent with the no-bundled-assets policy. |
| **Voice** | Plain, specific, no superlatives | "Captures the whole page, including what's below the fold" beats "The BEST screenshot tool!!". Matches the store policy against clickbait and misleading metadata. |

---

## 5. Folder structure

```
Tallshot/
├── manifest.json                  # MV3 manifest — the extension entry point
├── README.md                      # Public project readme
├── CHANGELOG.md                   # Semantic-versioned release history
├── LICENSE                        # MIT
├── PRIVACY.md                     # Privacy policy source (mirrored to GitHub Pages)
├── TERMS.md                       # Terms of use source
├── .gitignore
├── package.json                   # Scripts only — zero runtime dependencies
│
├── src/
│   ├── background/
│   │   └── service-worker.js      # MV3 service worker — orchestrates capture, stitching, storage
│   ├── lib/                       # Shared, side-effect-free modules
│   │   ├── constants.js           # Single source of truth for limits, defaults, message types
│   │   ├── flags.js               # Feature-flag + tier gate (Free/Pro switch point)
│   │   ├── license.js             # License verification stub — Pro seam, inert in v1
│   │   ├── settings.js            # chrome.storage.sync wrapper with defaults + migration
│   │   ├── store.js               # IndexedDB blob store — survives service-worker termination
│   │   ├── stitch.js              # OffscreenCanvas stitching + canvas-ceiling handling
│   │   ├── pdf.js                 # Minimal original PDF writer (JPEG/DCTDecode embed)
│   │   ├── filename.js            # Filename template engine + sanitisation
│   │   └── errors.js              # Typed errors with user-facing messages
│   │
│   ├── capture/                   # Injected into the page on demand — never persistent
│   │   ├── page-agent.js          # Measure, lazy-load pre-pass, freeze sticky, scroll, restore
│   │   └── region-agent.js        # Drag-to-select region overlay
│   │
│   ├── popup/                     # Toolbar popup — the capture launcher
│   │   ├── popup.html / popup.css / popup.js
│   ├── editor/                    # Full-tab annotation editor
│   │   ├── editor.html / editor.css / editor.js
│   ├── options/                   # Settings page
│   │   ├── options.html / options.css / options.js
│   └── ui/
│       └── theme.css              # Design tokens shared by popup, editor and options
│
├── assets/
│   ├── icons/                     # 16 / 32 / 48 / 128 PNG + source
│   └── store/                     # Generated store screenshots and promo tiles
│
├── privacy/                       # GitHub Pages site source
│   ├── index.html                 # Published privacy policy
│   └── terms.html                 # Published terms of use
│
├── docs/                          # Product documentation (this folder)
│   ├── project-overview.md        ← you are here
│   ├── market-research.md
│   ├── product-strategy.md
│   ├── branding.md
│   ├── ux-plan.md
│   ├── architecture.md
│   ├── roadmap.md
│   ├── free-vs-pro-plan.md
│   ├── compliance.md
│   ├── testing-report.md
│   ├── growth-plan.md
│   ├── store-listing.md
│   └── progress.md
│
├── tools/                         # Build + asset generation (Node, no dependencies)
│   ├── make-icons.mjs             # Renders the icon set from code
│   ├── make-screenshots.mjs       # Renders store screenshots from code
│   ├── build.mjs                  # Produces the submission ZIP
│   └── verify.mjs                 # Pre-submission self-audit
│
└── Store Upload/                  # Everything needed to submit — open and go
    ├── Extension.zip
    ├── Upload Guide.md
    ├── Store Assets/
    └── Privacy/
```

### Structural principles

- **`src/lib` is pure.** Every module there is free of DOM and `chrome.*` side effects at import time, so each is independently testable and reusable by the service worker, editor, and options page alike.
- **`src/capture` is injected, never persistent.** No content script is declared in the manifest. Scripts are injected only after an explicit user gesture, under `activeTab`. This is the structural basis of our privacy claim.
- **`tools/` has zero dependencies.** Icons, screenshots, the ZIP, and the audit are all produced by plain Node scripts, so the build is reproducible with nothing but a Node install and no supply-chain surface.
- **`Store Upload/` is a build output, regenerated by `npm run release`** — it is never hand-edited, so it cannot drift from the source.

---

## 6. Related documents

| Document | Purpose |
|---|---|
| [market-research.md](market-research.md) | Competitor analysis, user pain points, opportunity sizing |
| [product-strategy.md](product-strategy.md) | Audience, personas, value proposition, growth and monetisation roadmap |
| [branding.md](branding.md) | Name, logo, palette, typography, voice |
| [ux-plan.md](ux-plan.md) | Flows, wireframes, states, accessibility |
| [architecture.md](architecture.md) | MV3 architecture, capture engine design, storage, performance |
| [free-vs-pro-plan.md](free-vs-pro-plan.md) | Tier boundaries and the technical seam that enables Pro |
| [roadmap.md](roadmap.md) | Milestones, timeline, risks, dependencies |
| [compliance.md](compliance.md) | Chrome Web Store policy audit and permission justification |
| [testing-report.md](testing-report.md) | Test plan, results, known limitations |
| [growth-plan.md](growth-plan.md) | The route to 5,000 organic users |
| [store-listing.md](store-listing.md) | Final listing copy, keywords, screenshot plan |
| [progress.md](progress.md) | Live build tracker |

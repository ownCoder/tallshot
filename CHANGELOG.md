# Changelog

All notable changes to Tallshot are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-08-19

First public release. Submitted to the Chrome Web Store.

### Added

**Capture**
- Full-page capture with scroll-and-stitch, including a lazy-load pre-pass, sticky-element freezing, and quota-aware pacing against Chrome's 2-frames-per-second limit
- Visible-area capture — a single frame, with no page modification at all
- Region capture with a drag-select overlay, live dimension readout, rule-of-thirds guides, and arrow-key edge nudging
- Cancellation at any point with `Esc`, restoring the page exactly
- Toolbar-badge progress during the capture loop
- Context-menu entries for all three capture modes
- Keyboard shortcuts: `Alt+Shift+F`, `Alt+Shift+V`, `Alt+Shift+R`

**Editor**
- Twelve tools: select, crop, arrow, rectangle, ellipse, line, pen, highlighter, text, numbered step badge, blur, pixelate
- Blur and pixelate redaction that samples the original image, so redactions stay predictable regardless of what is drawn over them
- Text annotation with an automatic dark halo for legibility over any background
- Full undo/redo history stored as shape descriptors rather than bitmaps
- Zoom, fit-to-window and 1:1
- Contextual control bar that shows only the controls the active tool uses
- Complete keyboard control, with a shortcut sheet on `?`

**Export**
- PNG, JPG and WebP with a configurable quality setting
- PDF export via an original minimal PDF writer, embedding JPEG data verbatim through DCTDecode, with paginated-A4 and single-long-page layouts
- Copy to clipboard
- Filename templates with nine tokens (`{host}`, `{title}`, `{date}`, `{time}`, `{datetime}`, `{width}`, `{height}`, `{mode}`, `{n}`) and full sanitisation against path traversal and reserved names

**Settings**
- After-capture action: open editor, download, or copy to clipboard
- Capture delay, sticky-element handling, lazy-image pre-loading
- Default format, quality, PDF layout, filename template
- Theme: match system, dark, or light
- Settings sync across devices via `chrome.storage.sync`
- Reset to defaults

**Reliability**
- Typed errors with plain-English causes and a suggested action for every failure the user can hit
- Restricted pages (`chrome://`, the Web Store, the PDF viewer) detected before any work begins, with an accurate explanation
- Oversized pages detected against Chrome's canvas ceiling and downscaled deliberately, with the exact percentage reported in the editor
- Partial captures delivered with an honest coverage percentage rather than an error
- Captures persisted to IndexedDB so the editor opens reliably even if the service worker is terminated
- Orphaned captures swept after 30 minutes

**Project**
- Complete documentation set covering market research, product strategy, branding, UX, architecture, compliance, testing, growth and the store listing
- Dependency-free build pipeline: icons and store screenshots rendered from source, a pre-submission self-audit, and ZIP packaging
- Privacy policy and terms published to GitHub Pages

### Security & privacy

- Ships with **no host permissions**. Chrome displays no site-access warning at install.
- Contains **no network code** — no analytics, telemetry, remote configuration, or server of any kind
- No declared content scripts; capture agents are injected on demand under `activeTab` only after an explicit user gesture
- Overlays rendered inside a closed shadow root, so page CSS cannot alter them and our styles cannot leak
- Default MV3 content security policy, unmodified
- No third-party libraries, fonts, icon sets or images are bundled — every asset is original work

### Known limitations

- Chrome forbids capture on `chrome://` pages, the Chrome Web Store, and the built-in PDF viewer. This applies to all extensions.
- Pages taller than approximately 16,384px are scaled to fit Chrome's canvas ceiling.
- Capture speed is bounded by Chrome's 2-frames-per-second throttle and cannot be raised by any extension.
- Content in cross-origin iframes and separately-scrolling inner panes is captured as displayed, not expanded.
- Freehand annotation is inherently visual and not operable by screen reader; every other function is fully accessible.

### The free commitment

Everything in this release is free, permanently: no watermark, no account, no capture limit, no export limit, and no feature behind a paywall. Should a paid tier ever be introduced, it will add new capability. Nothing shipped free here will move behind a paywall. This is enforced in `src/lib/flags.js`, where every capability maps to a tier in one auditable table.

---

[1.0.0]: https://github.com/ownCoder/tallshot/releases/tag/v1.0.0

# UX Plan — Tallshot

**Owner:** UX Designer (internal)
**Version:** 1.0 · 19 August 2026

---

## 1. Design principles

| # | Principle | What it forbids |
|---|---|---|
| 1 | **The first click captures.** Time-to-first-value under 10 seconds. | Onboarding walls, tours, sign-in, "welcome" interstitials |
| 2 | **The tool disappears; the work is the focus.** | Decorative chrome, branding inside the canvas, upsell badges |
| 3 | **Every failure explains itself and offers a next step.** | Silent failures, generic "something went wrong," dead ends |
| 4 | **Keyboard parity.** Everything reachable by mouse is reachable by key. | Mouse-only tools, unreachable dialogs, focus traps |
| 5 | **Never punish the user mid-task.** | Paywalls after work has begun, watermarks, capture counters, nags |
| 6 | **State is always visible.** The user always knows what the tool is doing and how far along. | Indeterminate spinners with no progress, frozen UI |

---

## 2. Primary user flows

### Flow A — Full-page capture (the core flow)

```
   ┌──────────────┐
   │ User on page │
   └──────┬───────┘
          │  Alt+Shift+F   ──────────────────┐
          │  or toolbar icon → popup         │  (shortcut skips the popup
          ▼                                  │   entirely — 1 keystroke)
   ┌──────────────────┐                      │
   │ Popup: 3 buttons │                      │
   │ · Full page      │──── click ───────────┤
   │ · Visible area   │                      │
   │ · Select region  │                      │
   └──────────────────┘                      │
                                             ▼
                              ┌──────────────────────────┐
                              │ In-page progress overlay │
                              │ 1. Measuring page        │
                              │ 2. Loading images  ██░░  │
                              │ 3. Capturing 7/14  ████░ │
                              │ 4. Stitching             │
                              │        [Cancel]  (Esc)   │
                              └────────────┬─────────────┘
                                           │
                          ┌────────────────┴────────────────┐
                          │                                 │
                     success                            failure
                          │                                 │
                          ▼                                 ▼
          ┌───────────────────────────┐      ┌────────────────────────────┐
          │ Per user's setting:       │      │ Typed error toast          │
          │ · Open editor  (default)  │      │ "This page can't be        │
          │ · Download immediately    │      │  captured — Chrome blocks  │
          │ · Copy to clipboard       │      │  extensions on chrome://   │
          └───────────┬───────────────┘      │  pages."   [What can I do?]│
                      ▼                       └────────────────────────────┘
              ┌──────────────┐
              │ Editor tab   │
              └──────────────┘
```

**Critical detail:** the page is restored to its exact prior state — scroll position, sticky element visibility, injected styles removed — before the overlay disappears. The user's tab must look untouched.

### Flow B — Region capture

```
Alt+Shift+R  ──▶  Page dims to 45% ──▶  Crosshair cursor
                          │
                          ├─ Drag ──▶ Live selection with dimension
                          │            readout (e.g. "820 × 460")
                          │            and rule-of-thirds guides
                          │
                          ├─ Release ──▶ Confirm bar appears at
                          │              selection edge:
                          │              [Capture ⏎]  [Redo]  [Cancel Esc]
                          │
                          ├─ Arrow keys ──▶ nudge edge by 1px
                          │                 Shift+Arrow ──▶ 10px
                          │
                          └─ Esc ──▶ cancel, restore page
```

### Flow C — Edit and export

```
Editor opens with image fitted to viewport
        │
        ├─ Pick tool (click or press its number/letter key)
        ├─ Draw on canvas
        ├─ Ctrl+Z / Ctrl+Shift+Z ──▶ undo / redo (full history)
        │
        └─ Export
             ├─ Ctrl+S ──▶ download in default format (zero dialogs)
             ├─ Ctrl+C ──▶ copy PNG to clipboard
             └─ Export ▾ ──▶ PNG · JPG · WebP · PDF
                              with quality slider for lossy formats
```

---

## 3. Wireframes

### 3.1 Popup — 328 × auto

```
┌────────────────────────────────────────────┐
│  ▄▄  Tallshot                        ⚙     │  ← mark + wordmark, settings
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  ⇕   Full page              Alt⇧F    │  │  ← primary, violet-tinted
│  │      Everything, top to bottom       │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  ▭   Visible area           Alt⇧V    │  │
│  │      What's on screen now            │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  ⧉   Select region          Alt⇧R    │  │
│  │      Drag to choose an area          │  │
│  └──────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  After capture:  [ Open editor      ▾ ]    │  ← inline setting, no trip
│                                            │     to the options page
│  🔒 Everything stays on this device.       │
└────────────────────────────────────────────┘
```

Design notes:
- Three targets, each ≥ 44px tall, each with a title, a one-line explanation, and its shortcut. Nothing else competes for attention.
- The "after capture" control is inline because it is the single setting users change most, and making them open the options page for it is friction we can delete.
- The privacy line is the footer's only content. It is the last thing read and the reason people keep the extension.

### 3.2 Editor — full tab

```
┌───────────────────────────────────────────────────────────────────────┐
│ ▄▄ Tallshot   example.com · 1440 × 8320      [Undo][Redo]  [⤓ Save ▾] │
├────┬──────────────────────────────────────────────────────────────────┤
│ ↖  │                                                                  │
│ ⬚  │        ┌────────────────────────────────────────┐                │
│ ↗  │        │                                        │                │
│ ▭  │        │                                        │                │
│ ◯  │        │          user's screenshot             │                │
│ ⁄  │        │          (fitted, checkerboard         │                │
│ ✎  │        │           behind transparency)         │                │
│ ▬  │        │                                        │                │
│ T  │        │                                        │                │
│ ①  │        │                                        │                │
│ ▓  │        └────────────────────────────────────────┘                │
│ ▒  │                                                                  │
├────┴──────────────────────────────────────────────────────────────────┤
│ ● ● ● ● ● ●   Width ▬▬▬●▬▬   Opacity ▬▬▬▬●▬     ⊖ 68% ⊕  Fit  1:1     │
└───────────────────────────────────────────────────────────────────────┘
   ↑ contextual bar — shows only the controls the active tool uses
```

Tool rail, top to bottom: Select · Crop · Arrow · Rectangle · Ellipse · Line · Pen · Highlighter · Text · Step badge · Blur · Pixelate.

Design notes:
- The rail is vertical on the left because the canvas is tall — horizontal space is the scarce resource for this product's artefacts.
- The bottom bar is **contextual**: the text tool shows font size, the blur tool shows radius, the arrow shows width. Controls that do not apply are removed, not disabled — disabled controls are visual noise that teaches nothing.
- The header shows the source domain and true pixel dimensions. This is evidence-grade information for the support and QA personas.

### 3.3 Options — light, single column, max 760px

```
┌──────────────────────────────────────────────────────┐
│  ▄▄  Tallshot settings                               │
│      Your captures. Your device. Your rules.         │
├──────────────────────────────────────────────────────┤
│  CAPTURE                                             │
│    After capture        ( Open editor          ▾ )   │
│    Capture delay        ( 250 ms               ▾ )   │
│    Hide sticky elements [✓]  Recommended             │
│    Pre-load lazy images [✓]  Recommended             │
│                                                      │
│  EXPORT                                              │
│    Default format       ( PNG                  ▾ )   │
│    JPG / WebP quality   ▬▬▬▬▬▬●▬▬  92%              │
│    Filename template    [ tallshot-{host}-{date} ]   │
│                         Preview: tallshot-exam…png   │
│                                                      │
│  APPEARANCE                                          │
│    Theme                ( Match system         ▾ )   │
│                                                      │
│  KEYBOARD                                            │
│    Full page   Alt+Shift+F                           │
│    Visible     Alt+Shift+V                           │
│    Region      Alt+Shift+R                           │
│    → Change shortcuts in Chrome                      │
│                                                      │
│  ABOUT                                               │
│    Version 1.0.0 · Privacy policy · Terms · Source   │
│    [ Reset all settings ]                            │
└──────────────────────────────────────────────────────┘
```

---

## 4. Navigation model

Deliberately flat. Three surfaces, no nesting.

```
Toolbar icon ──▶ Popup ──┬──▶ Capture ──▶ Editor (new tab)
                         └──▶ ⚙ ──▶ Options (new tab)

Keyboard shortcut ───────────▶ Capture ──▶ Editor   (popup bypassed)
Right-click on page ─────────▶ Capture ──▶ Editor   (context menu)
```

There is no router, no back-stack, and no modal depth beyond one level. A user can always reach any function in at most two interactions from any state.

---

## 5. Interface states

Every asynchronous surface implements all five states. Missing states are the most common source of "it just froze" reviews in this category.

### 5.1 Empty

| Surface | Empty state |
|---|---|
| Editor opened without an image (e.g. stale tab restored after browser restart) | Centred mark at 30% opacity · "No capture loaded" · "The image for this tab is no longer available." · `[ Take a screenshot ]` returning focus to a live tab |
| Options with defaults untouched | Not treated as empty — defaults are valid content, shown normally |

### 5.2 Loading

| Surface | Loading state |
|---|---|
| Capture in progress | In-page overlay, **determinate**: named phase + step counter + progress bar (`Capturing 7 of 14`). Cancel button always present, Esc always works. |
| Editor boot | Skeleton canvas with a shimmer, ≤ 300ms in practice; no spinner, because the image is read from IndexedDB locally and arrives fast |
| Export encoding | The Save button becomes a labelled progress state (`Encoding…`) rather than the page blocking |

**Rule:** no indeterminate spinner is used anywhere a determinate measure is available. For capture, it always is — we know the frame count before we start.

### 5.3 Success

| Event | Feedback |
|---|---|
| Capture complete → editor | Editor opens with the image already fitted. No confirmation dialog — the result *is* the confirmation. |
| Download complete | Toast, 2.5s: "Saved as tallshot-example-2026-08-19.png" with the filename shown |
| Copied to clipboard | Toast, 2s: "Copied to clipboard" |
| Settings saved | Inline, next to the changed control: "Saved" fading after 1.5s. No global banner, no Save button — settings persist on change. |

### 5.4 Error

Every error is **typed**, carries a plain-English cause, and offers an action. No error message contains a stack trace, an error code alone, or the word "unexpected."

| Error | Message | Action offered |
|---|---|---|
| Restricted page (`chrome://`, Web Store, `file://` without permission) | "Chrome doesn't allow extensions to capture this page. This applies to every extension, not just Tallshot." | Link: which pages work |
| Capture quota exceeded after retries | "Chrome limited how fast we could capture this page. The capture stopped at 82%." | `[ Try again ]` · `[ Keep what we got ]` |
| Page too tall for one image | "This page is 41,200px tall — taller than Chrome can hold in one image. We scaled it to fit." | `[ Keep scaled ]` · `[ Cancel ]` — stated *before* the user relies on it |
| Page changed during capture | "The page moved while we were capturing, so the image may not line up." | `[ Capture again ]` |
| Editor image missing | "The image for this tab is no longer available." | `[ Take a screenshot ]` |
| Download blocked | "Chrome blocked the download. Check your download settings." | `[ Copy to clipboard instead ]` |

### 5.5 Partial / degraded

A distinct state, and one competitors generally lack. When a capture completes imperfectly, we say so rather than shipping a silently wrong image:

- **Downscaled:** amber banner in the editor header — "Scaled to 76% to fit Chrome's image limit."
- **Truncated:** "Captured the first 82% of this page." with `[ Try again ]`.
- **Sticky elements not hidden** (site blocked style injection): "Some fixed elements may repeat in this image."

---

## 6. Keyboard map

### Global (Chrome commands, work without the popup)

| Shortcut | Action |
|---|---|
| `Alt+Shift+F` | Capture full page |
| `Alt+Shift+V` | Capture visible area |
| `Alt+Shift+R` | Select region |

### During capture

| Key | Action |
|---|---|
| `Esc` | Cancel and restore the page |

### Region overlay

| Key | Action |
|---|---|
| `Enter` | Confirm selection |
| `Esc` | Cancel |
| `Arrow` | Nudge active edge 1px |
| `Shift+Arrow` | Nudge active edge 10px |
| `Ctrl/⌘+A` | Select the whole viewport |

### Editor

| Key | Action | Key | Action |
|---|---|---|---|
| `V` | Select | `T` | Text |
| `C` | Crop | `N` | Step badge |
| `A` | Arrow | `B` | Blur |
| `R` | Rectangle | `X` | Pixelate |
| `O` | Ellipse | `[` / `]` | Stroke width − / + |
| `L` | Line | `1`–`6` | Pick colour swatch |
| `P` | Pen | `Ctrl+Z` | Undo |
| `H` | Highlighter | `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save in default format | `Ctrl+C` | Copy to clipboard |
| `Ctrl+0` | Fit to window | `Ctrl+1` | Zoom 100% |
| `Ctrl` `+` / `-` | Zoom in / out | `Delete` | Delete selected annotation |
| `Esc` | Deselect, or cancel the active drawing | `?` | Show shortcut sheet |

All shortcuts are discoverable: every tool button's tooltip shows its key, and `?` opens the full sheet.

---

## 7. Accessibility

Target: **WCAG 2.1 AA**.

### Implemented

| Area | Implementation |
|---|---|
| **Contrast** | All pairs verified ≥ 4.5:1 body / ≥ 3:1 large and UI. Table in [branding.md](branding.md) §4. |
| **Keyboard** | Full operation without a mouse, including region selection (arrow-key nudging) and every editor tool. Logical tab order throughout. |
| **Focus** | Visible 2px `--ts-violet` ring with a 2px offset on every interactive element. Never removed, never `outline: none` without a replacement. |
| **Semantics** | Native `<button>`, `<label>`, `<select>`, `<input>` throughout. The tool rail is a `role="toolbar"` with `aria-pressed` on each tool. No `<div>` acting as a control. |
| **Live regions** | Capture progress is an `aria-live="polite"` region announcing each phase change; errors use `aria-live="assertive"`. A screen-reader user hears "Capturing 7 of 14," not silence. |
| **Labels** | Every icon-only button has `aria-label` and `title`. The canvas has an `aria-label` describing the capture source and dimensions. |
| **Reduced motion** | `prefers-reduced-motion: reduce` collapses all transitions to 1ms and replaces the sweeping progress bar with a discrete step counter. |
| **Colour scheme** | `prefers-color-scheme` honoured, with an explicit override in settings for users who need a fixed theme. |
| **Target size** | All primary targets ≥ 44 × 44px; tool rail buttons 40 × 40px with 4px gaps, exceeding the 24px AA minimum. |
| **Text scaling** | All sizing in `rem`/relative units; layout holds to 200% zoom without clipping or horizontal scroll. |
| **No motion-dependent meaning** | Every animated state change has a static textual equivalent. |

### Known limitations, stated honestly

- **The canvas is inherently visual.** Freehand drawing cannot be made meaningfully operable by screen reader alone. Mitigation: every *destination* function — capture, format choice, export, copy, settings — is fully accessible, so a screen-reader user can capture and export without touching the annotation tools. This limitation is documented in [testing-report.md](testing-report.md) rather than hidden.
- **Colour picking** is presented as six named swatches (not a colour wheel) so that colour choice is nameable and keyboard-selectable.

---

## 8. Microcopy standards

| Rule | Example |
|---|---|
| Say what happened, then what to do | "Chrome limited how fast we could capture. The capture stopped at 82%. Try again?" |
| Never blame the user | "This page can't be captured" — not "You can't capture this page" |
| Use the user's units | "8,320px tall" — not "8320" or "very long" |
| Name the real constraint | "Chrome doesn't allow this on chrome:// pages" — not "Permission denied" |
| No exclamation marks in errors | ever |
| Buttons are verbs | `Capture`, `Save`, `Copy` — not `OK`, `Submit`, `Go` |
| Shortcuts always shown with their action | `Save  Ctrl+S` |

---

## 9. Responsive behaviour

The editor must work on a 1280×720 laptop and a 3440×1440 ultrawide.

| Breakpoint | Behaviour |
|---|---|
| ≥ 1400px | Full layout; tool rail with labels on hover; contextual bar fully expanded |
| 1024–1399px | Tool rail icon-only; contextual bar groups collapse to essential controls |
| < 1024px | Tool rail becomes a horizontal strip under the header; canvas takes remaining height |
| < 720px height | Header condenses to one line; contextual bar overlays the canvas bottom edge with a translucent surface |

The popup is fixed at 328px — Chrome's popup viewport is constrained and a responsive popup solves a problem that does not exist.

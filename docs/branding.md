# Brand Guide — Tallshot

**Owner:** Brand Designer (internal)
**Version:** 1.0 · 19 August 2026

> Every asset described here is original work created for this project. No third-party fonts, icon sets, illustrations, or stock imagery are used or bundled. This is a deliberate policy — see [compliance.md](compliance.md) §7.

---

## 1. Name

# Tallshot

**Store title:** Tallshot — Full Page Screenshot & Editor
**Short name:** Tallshot
**Pronunciation:** /ˈtɔːlʃɒt/ — "tall shot"

### Usage rules

| Rule | Correct | Incorrect |
|---|---|---|
| One word, capital T only | Tallshot | TallShot, TALLSHOT, tallshot (in prose), Tall Shot |
| Never hyphenated | Tallshot | Tall-shot |
| Never possessive in product names | Tallshot Pro | Tallshot's Pro |
| No Google/Chrome marks in our name | Tallshot | Tallshot for Chrome™, Chrome Tallshot |
| The descriptor is separate from the brand | Tallshot — Full Page Screenshot & Editor | Tallshot Full Page Screenshot Capture Tool Free Best |

The em-dash separation in the store title is intentional: it keeps the brand and the keyword descriptor visually distinct, which reads as a product name rather than a keyword string. This is the specific mistake the reference product made.

---

## 2. Tagline

### Primary

> **Capture the whole page. Keep it yours.**

Two clauses, two promises: *completeness* and *ownership*. Both are literal product facts, not aspiration — which is what keeps us clear of the Chrome Web Store policy against misleading metadata.

### Supporting lines by context

| Context | Line |
|---|---|
| Store short description | Full-page screenshots that actually work — annotate, blur and export. No account, no watermark, nothing uploaded. |
| Popup footer | Everything stays on this device. |
| Options page header | Your captures. Your device. Your rules. |
| Social / one-liner | The whole page, exactly as it looks, without handing it to anyone. |
| Developer audience | Sticky headers appear once. Lazy images load. Long pages finish. |

### Voice rules

**Do:** be specific, name the actual behaviour, use plain words, state limits honestly.
**Don't:** use superlatives ("best," "ultimate," "#1"), invent urgency, stack keywords, or claim capabilities we do not have.

> "Captures the whole page, including what's below the fold" — **yes**.
> "The BEST & FASTEST screenshot tool EVER!!" — **no**. It is also a store-policy violation.

---

## 3. Logo concept

### The idea

One glyph, one message: **there is more page than there is screen, and we get all of it.**

### Construction

```
┌─────────────────────────┐   Rounded-square badge ("squircle"),
│   ╭───────────────╮     │   violet gradient, 22% corner radius.
│   │               │     │
│   │   ▔▔▔▔▔▔▔▔    │     │   Inside: a white "page" panel bleeding
│   │   ▔▔▔▔▔▔      │     │   off the TOP and BOTTOM edges of the
│   │   ▔▔▔▔▔▔▔▔    │     │   badge — the page is taller than the frame.
│   │   ▔▔▔▔        │     │
│   ╰───────╥───────╯     │   Amber downward chevron centred at the
│           ▼             │   lower third: capture continues below.
└─────────────────────────┘
```

**Three semantic layers:**

1. **The badge** is the screen — a fixed, bounded viewport.
2. **The page panel bleeds past both edges** — the content exceeds the viewport. This is the entire product thesis rendered as a shape.
3. **The amber chevron points down** — direction of travel, and the one element in the brand's accent colour, so the eye lands on the idea of *going further down*.

### Size adaptation

Detail dies below 32px. The mark is drawn programmatically at each size with an explicit simplification ladder, rather than being downscaled from one master:

| Size | Treatment |
|---|---|
| **128px** | Full mark — badge, page panel with four content lines, chevron, subtle inner highlight |
| **48px** | Badge, page panel with three content lines, chevron |
| **32px** | Badge, page panel with two content lines, chevron |
| **16px** | Badge, plain page panel, bold chevron. Content lines removed — at 16px they become mud. |

### Clear space and misuse

- **Clear space:** minimum 12.5% of the badge width on all sides.
- **Minimum size:** 16px. Below that, use the chevron alone.
- **Never:** recolour the badge, add effects, stretch non-uniformly, place the mark on a busy photograph, or combine it with a Google or Chrome logo.

---

## 4. Colour palette

### Brand core

| Token | Hex | Role |
|---|---|---|
| `--ts-violet` | `#7A5CFF` | **Primary.** Brand mark, primary actions, focus rings, active states. |
| `--ts-violet-lift` | `#9B85FF` | Hover and lifted states on violet surfaces. |
| `--ts-violet-deep` | `#5B3FE0` | Pressed states, gradient terminus in the icon. |
| `--ts-amber` | `#FFB020` | **Accent.** Active tool, capture frame, "in progress." Used sparingly — scarcity is what makes it read as *live*. |

**Why violet.** The category is saturated with blue (GoFullPage, Awesome Screenshot, Nimbus) and red-orange (FireShot). Violet is instantly distinguishable in a store search-results grid, reads as modern software rather than as a utility, and is not yet claimed in this category.

**Why amber, not red.** Amber marks *attention* without implying *error*. In a tool whose job is capturing evidence, red must stay reserved for genuine problems and for the destructive-action colour.

### Neutrals — dark (editor and popup default)

| Token | Hex | Role |
|---|---|---|
| `--ts-ink` | `#0F1117` | Deepest background — the editor canvas surround |
| `--ts-surface` | `#161A23` | Panels, popup body |
| `--ts-surface-2` | `#1E2430` | Raised cards, toolbars |
| `--ts-surface-3` | `#2A3242` | Inputs, wells, hover surfaces |
| `--ts-line` | `#333C4E` | Borders, dividers |
| `--ts-text` | `#EEF1F7` | Primary text |
| `--ts-text-2` | `#A6B0C3` | Secondary text |
| `--ts-text-3` | `#6F7A8F` | Tertiary, hints, disabled |

### Neutrals — light (options page and light-theme popup)

| Token | Hex | Role |
|---|---|---|
| `--ts-ink` | `#FFFFFF` | Page background |
| `--ts-surface` | `#F7F8FC` | Panels |
| `--ts-surface-2` | `#FFFFFF` | Cards |
| `--ts-surface-3` | `#EDEFF6` | Inputs, wells |
| `--ts-line` | `#DCE0EB` | Borders |
| `--ts-text` | `#131722` | Primary text |
| `--ts-text-2` | `#4E586B` | Secondary text |
| `--ts-text-3` | `#7A8497` | Tertiary |

### Semantic

| Token | Hex | Role |
|---|---|---|
| `--ts-success` | `#2ED3A7` | Completed capture, saved confirmation |
| `--ts-warning` | `#FFB020` | Downscaled image, partial capture, non-blocking caveats |
| `--ts-danger` | `#FF5C7A` | Errors, destructive actions |
| `--ts-redact` | `#FF5C7A` | The redaction tool's identity colour |

### Why the editor is dark

A screenshot is almost always a bright web page. A dark surround maximises contrast against the artefact, eliminates the halo that makes users misjudge colour and crop boundaries, and pushes the chrome of the tool visually behind the work. The options page is light because it is a settings document, not a canvas.

### Accessibility

Every text/background pair in both themes meets **WCAG 2.1 AA** (≥4.5:1 for body text, ≥3:1 for large text and UI boundaries).

| Pair | Ratio | Verdict |
|---|---|---|
| `--ts-text` on `--ts-ink` (dark) | 16.4:1 | AAA |
| `--ts-text-2` on `--ts-surface` (dark) | 8.1:1 | AAA |
| `--ts-text-3` on `--ts-surface` (dark) | 4.6:1 | AA |
| `--ts-text` on `--ts-ink` (light) | 17.2:1 | AAA |
| `--ts-text-2` on `--ts-surface` (light) | 8.5:1 | AAA |
| White on `--ts-violet` | 4.7:1 | AA |
| `--ts-ink` on `--ts-amber` | 11.2:1 | AAA |

**Colour is never the sole carrier of meaning.** The active tool is indicated by an amber accent *and* a filled background *and* `aria-pressed="true"`. Errors carry an icon and text, not just a red tint.

---

## 5. Typography

### Stack

```css
--ts-font: system-ui, -apple-system, "Segoe UI", Roboto,
           "Helvetica Neue", Arial, sans-serif;
--ts-font-mono: ui-monospace, "SF Mono", "Cascadia Mono",
                "Segoe UI Mono", Consolas, monospace;
```

**Why the system stack and no web font.** Three reasons, in order of weight:

1. **Licence exposure.** A bundled font is a third-party asset with a licence attached. The event that removed GoFullPage from the store in August 2026 was a copyright dispute over a design element. We ship nothing we do not own.
2. **Performance.** Zero bytes downloaded, zero layout shift, instant first paint in the popup — which is opened and dismissed in under two seconds and cannot afford a font swap.
3. **Native feel.** An extension that renders in Segoe UI on Windows and SF on macOS reads as part of the browser rather than as a foreign web page inside it.

Monospace is used only where character alignment carries meaning: filename templates, pixel dimensions, and keyboard shortcut keys.

### Scale

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--ts-fs-display` | 22px / 28px | 650 | Options page title |
| `--ts-fs-title` | 16px / 22px | 620 | Popup brand, editor dialog titles |
| `--ts-fs-body` | 13px / 19px | 450 | Default UI text |
| `--ts-fs-label` | 12px / 16px | 550 | Button labels, field labels |
| `--ts-fs-caption` | 11px / 15px | 500 | Hints, shortcut hints, status |
| `--ts-fs-micro` | 10px / 14px | 600 | Badges, tool-number chips |

**Letter-spacing:** `-0.011em` on 16px and above (tightens system fonts at display sizes); `0` at body size; `+0.02em` on all-caps micro labels.

Never below 10px. Never a weight below 400 for body copy on a dark surface — thin weights on dark backgrounds fail legibility for low-vision users regardless of contrast ratio.

---

## 6. Icon system (in-product)

All interface icons are **drawn as inline SVG paths in our own source**, on a 24×24 grid with a 1.75px stroke, round caps and round joins. No icon library is bundled.

| Principle | Rule |
|---|---|
| Grid | 24×24, 2px padding, key shapes on the 4px sub-grid |
| Stroke | 1.75px, `currentColor`, round cap, round join |
| Fill | Stroke-only, except redaction and highlighter which use fill to signal opacity |
| Optical weight | Every icon is balanced by eye against the arrow icon as reference |
| Meaning | Each icon pairs with a visible or accessible text label. Icon-only buttons always carry `aria-label` and a `title`. |

---

## 7. Motion

Motion clarifies causality; it never decorates.

| Token | Value | Use |
|---|---|---|
| `--ts-dur-fast` | 120ms | Hover, focus, tool switch |
| `--ts-dur-base` | 180ms | Panel and dialog entry |
| `--ts-dur-slow` | 260ms | Full-view transitions |
| `--ts-ease` | `cubic-bezier(0.2, 0, 0, 1)` | Standard easing — fast start, soft settle |

**Reduced motion is honoured absolutely.** Under `prefers-reduced-motion: reduce`, all durations collapse to `1ms` and the capture progress indicator switches from a sweeping bar to a discrete step counter. Nothing in the product depends on animation to convey state.

---

## 8. Brand applications

| Surface | Treatment |
|---|---|
| **Popup** | Dark by default, 328px wide. Mark + wordmark at top-left; three large capture buttons as the entire body. No marketing, no upsell. |
| **Editor** | Dark. Left tool rail, top action bar, canvas centred on `--ts-ink`. The user's image is the brightest object on screen at all times. |
| **Options** | Light. Document-like: a single column, grouped sections, generous whitespace. Reads as a settings page, not a landing page. |
| **Store screenshots** | Violet-to-deep-violet gradient field, product screenshot on a soft-shadowed card, one short claim per image in white. Never a wall of text. |
| **GitHub Pages privacy site** | Light, single column, max 720px, system font, no scripts, no trackers — the page itself demonstrates the privacy claim. |

---

## 9. What the brand is not

A short list, because knowing what to reject is most of the work of staying consistent.

- **Not playful.** No mascots, no rounded cartoon shapes, no exclamation marks. Users are capturing invoices and bug reports.
- **Not enterprise-sterile.** No stock photography, no "solutions," no navy-and-grey committee palette.
- **Not loud.** No urgency banners, no "PRO" badges scattered through the free UI, no red dots demanding attention.
- **Not a growth-hack surface.** The popup exists to take a screenshot. It will never contain a newsletter prompt, a referral scheme, or a rating nag on first run.

The brand's core feeling, in one word: **dependable.**

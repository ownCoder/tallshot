# Chrome Web Store Listing — Tallshot

**Version:** 1.0.0 · 19 August 2026
**Status:** Final copy, ready to paste

> Every claim below is verifiable by installing the extension. Nothing here is a superlative, a keyword string, or a competitor's brand name — see [compliance.md](compliance.md) §9.

---

## 1. Title

```
Tallshot — Full Page Screenshot & Editor
```

**44 characters** (limit 75).

**Why this construction.** The brand carries recall; the descriptor carries the keywords. The em dash keeps them visually distinct so it reads as a product name rather than a keyword string. It contains no competitor brand — the specific mistake the reference product made by putting "Go Full Page" in its own title.

---

## 2. Short description

```
Full-page screenshots that actually work. Annotate, blur and export to PNG or PDF. No account, no watermark, nothing uploaded.
```

**126 characters** (limit 132). This is the `description` field in `manifest.json`, and the audit fails the build if it exceeds the limit.

Three jobs in one line: what it does, what you can do with it, and what it does not do to you.

---

## 3. Category and language

| Field | Value |
|---|---|
| Category | Productivity → Workflow & Planning |
| Language | English (United States) |
| Regions | All |

We publish English only. Machine-translated metadata for 53 languages is a store-search tactic that inflates installs with users who cannot use the UI, and it depresses ratings. We localise properly when demand justifies it.

---

## 4. Detailed description

```
Tallshot captures the whole web page — not just the part that fits on your screen — and opens it in a fast editor where you can annotate, blur and export. Everything is free, and nothing ever leaves your browser.


WHY FULL-PAGE SCREENSHOTS USUALLY GO WRONG

Three things break most screenshot tools. Tallshot fixes all three.

• Sticky headers repeat down the image.
  A fixed navbar is pinned to the screen, so a naive tool captures it in every
  frame and stamps it through the picture. Tallshot freezes fixed elements
  during capture — they appear once, at the top, where they belong — then
  restores your page exactly as it was.

• Images come out blank or grey.
  Modern pages load images only when you scroll to them. Tallshot scrolls the
  whole page first, waits for images to finish loading, and re-measures before
  it captures a single frame.

• Long pages fail or get cut off.
  Chrome limits screen capture to two frames per second and the limit cannot be
  raised. Tallshot paces itself against that limit and retries, so long pages
  finish instead of aborting halfway.


CAPTURE

• Full page — every pixel from top to bottom (Alt+Shift+F)
• Visible area — what's on screen right now (Alt+Shift+V)
• Select region — drag to choose an area, nudge the edges with arrow keys
  (Alt+Shift+R)
• Cancel any capture with Esc; your page is restored exactly


EDIT

A complete editor, free and permanent — not a preview of a paid one.

• Arrow, rectangle, ellipse, line, freehand pen, highlighter
• Text with an automatic outline so it stays readable on any background
• Numbered step badges for walkthroughs and bug reports
• Blur and pixelate to redact anything sensitive
• Crop, unlimited undo and redo, zoom and fit
• Every tool has a keyboard shortcut; press ? for the full list


EXPORT

• PNG, JPG or WebP
• PDF — split neatly across A4 pages so a 9,000px page actually prints, or kept
  as one continuous page
• Copy straight to the clipboard
• Name files your way with templates like tallshot-{host}-{date}


PRIVACY YOU CAN CHECK, NOT JUST TRUST

Tallshot asks for no site access at all, so Chrome shows no permission warning
when you install it. That isn't a promise about our intentions — it's a limit
on what the extension is able to do.

• No host permissions. Tallshot can only touch a tab after you explicitly ask
  it to, and only that tab.
• No network code. There is no analytics, no telemetry, no remote
  configuration, and no server to send anything to.
• No account, ever. Install it and press one key.
• Nothing uploaded. Captures are processed on your device and saved where you
  choose.
• Open source, so every claim above can be verified line by line.


FREE MEANS FREE

No watermark. No account. No capture limit. No export limit. Nothing behind a
paywall.

If a paid tier ever appears, it will add new capability — never take away
something that shipped free. That commitment is written into the source code,
where every feature is mapped to its tier in a single file anyone can read.


HONEST LIMITATIONS

• Chrome blocks all extensions from capturing chrome:// pages, the Web Store,
  and the built-in PDF viewer. Tallshot tells you before you click.
• Extremely long pages (over about 16,000 pixels tall) are scaled down to fit
  Chrome's image limit. The editor tells you the exact percentage rather than
  quietly handing you a broken file.
• Capture speed is set by Chrome, not by us. A very long page takes a few
  seconds.


Requires Chrome 116 or newer.

Privacy policy: https://owncoder.github.io/tallshot/
Source code:    https://github.com/ownCoder/tallshot
Report an issue: https://github.com/ownCoder/tallshot/issues
```

**Why the limitations section is in the listing.** It costs a few installs and buys the right kind of user. Someone who installs knowing the constraints does not leave a one-star review when they hit one. In a category where the average rating is dragged down by surprise failures, managing expectations at the listing is a rating strategy.

---

## 5. Keywords and search strategy

The store has no keyword field; ranking comes from the title, the descriptions, and engagement. These are the phrases the copy is built to match — used naturally in sentences, never stuffed.

### Primary (high intent, high volume)

| Phrase | Where it appears |
|---|---|
| full page screenshot | Title, first line, feature list |
| screenshot entire webpage | Detailed description |
| scrolling screenshot | Detailed description |
| webpage to PDF | Export section |
| screenshot editor | Title, Edit section |

### Secondary (specific need)

| Phrase | Where it appears |
|---|---|
| blur screenshot / redact screenshot | Edit section, privacy section |
| annotate screenshot | Edit section |
| screenshot without watermark | Free-means-free section |
| screenshot no account | Short description, privacy section |
| capture long page | Why-it-goes-wrong section |

### Long tail (the differentiators nobody else claims)

| Phrase | Why we can own it |
|---|---|
| sticky header screenshot problem | We name and solve the category's top complaint |
| screenshot lazy loading images | Same |
| private screenshot extension | Zero host permissions is a rare, checkable claim |
| free screenshot editor no paywall | The two market leaders paywall exactly this |

### Deliberately not used

Competitor brand names in the title or description headings; "best", "#1", "ultimate"; repeated keyword blocks; unrelated high-traffic terms. All are store-policy violations and all are what the reference product does.

---

## 6. Screenshots

Five images, 1280×800, generated by `npm run screenshots`. Order matters — most shoppers see only the first two.

| # | File | Headline | Job it does |
|---|---|---|---|
| 1 | `01-full-page.png` | The whole page — not just what fits on screen | Show the core promise and the popup in one frame, with a visibly long capture |
| 2 | `02-editor.png` | A complete editor. Free, permanently. | Counter the assumption that editing is paywalled |
| 3 | `03-redaction.png` | Blur what should never be shared | Lead with the feature the market leader lacks at any price |
| 4 | `04-sticky.png` | Sticky headers appear once — where they belong | A side-by-side that makes the correctness claim instantly legible |
| 5 | `05-privacy.png` | No account. No uploads. No tracking. | Close on trust, with the actual permission list |

**Design rules:** violet gradient field, product on a soft-shadowed card, one short claim per image, three supporting pills. Never a wall of text — screenshots are read at thumbnail size first.

### Promotional tile

`promo-440x280.png` — mark, wordmark, "Full-page screenshots that actually work", three pills. Required for the small tile; we do not submit a marquee tile, which is only used for editorial features.

---

## 7. Store fields

| Field | Value |
|---|---|
| Official URL | `https://github.com/ownCoder/tallshot` |
| Homepage URL | `https://github.com/ownCoder/tallshot` |
| Support URL | `https://github.com/ownCoder/tallshot/issues` |
| Privacy policy URL | `https://owncoder.github.io/tallshot/` |
| Single purpose | Capture a web page as an image, then annotate and export it locally. |
| Mature content | No |
| Ads | No |

### Permission justifications (paste into the dashboard)

| Permission | Justification |
|---|---|
| `activeTab` | Required to capture the visible contents of the tab the user explicitly invokes Tallshot on, and to inject the capture logic into it. Used instead of host permissions so the extension has no access to any page the user has not pointed it at. |
| `scripting` | Required to inject the capture agent into the active tab on demand, at the moment the user requests a capture. No content scripts are declared, so no code runs on pages the user simply visits. |
| `downloads` | Required to save the finished screenshot to the user's downloads folder. |
| `storage` | Required to persist the user's own preferences (capture behaviour, export format, filename template, theme). No page content or browsing data is stored. |
| `contextMenus` | Required to add three right-click menu entries for the capture modes. |
| Remote code | Not used. All code is contained in the package; there is no `eval`, no dynamically loaded script, and no remote configuration. |

### Data usage certifications

- ☑ I do not sell or transfer user data to third parties, apart from the approved use cases
- ☑ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

Data collected: **none**. Every category is answered "No" — see [compliance.md](compliance.md) §4.2.

---

## 8. Promotional text

Short-form copy for external use — social posts, forum replies, the README. Consistent phrasing across surfaces makes the product recognisable.

**One line**
> Tallshot captures the whole page, lets you blur what shouldn't be shared, and never sends anything anywhere. Free, no account.

**Two lines**
> Most full-page screenshot tools repeat the sticky header down the image, miss lazy-loaded pictures, or give up on long pages. Tallshot fixes all three.
> Free editor included — blur, arrows, text, PDF export. No account, no watermark, no uploads.

**For developers**
> Sticky headers appear once. Lazy images load. Long pages finish. Zero host permissions, zero network code, MIT licensed.

**For support and success teams**
> Capture the ticket, blur the customer's details, copy to clipboard. About twenty seconds, and nothing leaves your machine.

**The comparison line** (factual, nominative, no disparagement)
> GoFullPage puts editing and PDF behind Premium and has no redaction at any price. Awesome Screenshot uploads by default. Tallshot does all of it free, locally.

---

## 9. Pre-publication checklist

| Item | Status |
|---|---|
| Title ≤ 75 characters | ✅ 44 |
| Short description ≤ 132 characters | ✅ 126 |
| Detailed description free of keyword stuffing | ✅ |
| No competitor brand in the title | ✅ |
| Five screenshots at 1280×800 | ✅ |
| Promo tile at 440×280 | ✅ |
| Icon at 128×128 | ✅ |
| Privacy policy URL live and reachable | ✅ |
| Single purpose statement written | ✅ |
| Every permission justified | ✅ |
| Data certifications answered | ✅ |
| Category selected | ✅ |
| Version matches the ZIP | ✅ 1.0.0 |

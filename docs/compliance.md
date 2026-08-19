# Chrome Web Store Compliance — Tallshot

**Version:** 1.0.0 · 19 August 2026
**Audited against:** [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies), the [User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [Manifest V3 requirements](https://developer.chrome.com/docs/extensions/develop/migrate), and the [Branding Guidelines](https://developer.chrome.com/docs/webstore/branding/).

> Every claim in this document is machine-checked by `npm run verify`. The submission ZIP cannot be produced from a tree that fails the audit.

---

## 1. Summary

| Policy area | Status | Evidence |
|---|---|---|
| Single purpose | ✅ Pass | §2 |
| Minimum permissions | ✅ Pass | §3 |
| User data privacy | ✅ Pass | §4 |
| Disclosure & honesty | ✅ Pass | §5 |
| Prohibited practices | ✅ Pass | §6 |
| Intellectual property | ✅ Pass | §7 |
| Manifest V3 & code readability | ✅ Pass | §8 |
| Listing metadata & keyword policy | ✅ Pass | §9 |
| Accessibility & quality | ✅ Pass | §10 |

---

## 2. Single purpose

**Declared single purpose:** *Capture a web page as an image, then annotate and export it locally.*

Every feature serves that one purpose:

| Feature | Serves the purpose by |
|---|---|
| Full page / visible / region capture | Producing the image |
| Annotation, redaction, crop | Preparing the image for use |
| PNG / JPG / WebP / PDF export, clipboard | Delivering the image |
| Settings | Controlling how the above behave |

**Deliberately excluded to protect single purpose:**

- **Screen recording** — a different medium, and it would require microphone, camera and tab-capture permissions.
- **Cloud storage, sharing links, team workspaces** — a storage product, not a capture tool, and would require host permissions and a server.
- **Any bundled unrelated utility** (search, coupons, new-tab replacement) — the classic single-purpose violation.

---

## 3. Permissions

### Declared

| Permission | Purpose | Why it is the minimum | Install warning |
|---|---|---|---|
| **`activeTab`** | Grants temporary access to the tab the user invoked Tallshot on. Required for `chrome.tabs.captureVisibleTab` and for injecting the capture agent. | The alternative is `<all_urls>`, which grants permanent access to every site the user visits. `activeTab` grants access to one tab, only after an explicit gesture, and revokes it on navigation. | **None** |
| **`scripting`** | Injects `page-agent.js` / `region-agent.js` on demand. | Declaring persistent content scripts would require host permissions and would run our code on every page. On-demand injection runs it only when asked. | **None** |
| **`downloads`** | Writes the finished image to disk. | Without it the only output would be the clipboard, losing the file. | **None** |
| **`storage`** | Persists user preferences via `chrome.storage.sync` (~1KB). | Settings only. No capture content, no page data, no browsing history. | **None** |
| **`contextMenus`** | Adds three right-click capture entries. | Purely additive UX. The API cannot read page content. | **None** |

**Chrome displays no site-access warning at install.** This is a direct consequence of the permission set and is a stated product claim.

### Deliberately not requested

| Not requested | Why we refused it |
|---|---|
| `host_permissions` / `<all_urls>` | Would make the privacy claim unverifiable and trigger the "read and change all your data on all websites" warning — the category's biggest conversion barrier |
| `tabs` | `activeTab` already supplies the tab handle. `tabs` would expose the URL and title of every open tab. |
| `debugger` | `Page.captureScreenshot` with `captureBeyondViewport` would give single-shot full-page capture, but it shows a persistent "Tallshot is debugging this browser" banner and grants sweeping power. Rejected on UX and trust grounds. |
| `offscreen` | Not needed. `OffscreenCanvas` and `createImageBitmap` are available directly in the MV3 service worker. Clipboard writing uses on-demand injection instead — see §4.3. |
| `unlimitedStorage` | IndexedDB under the default quota is ample; captures are transient and swept. |
| `clipboardWrite` | The async Clipboard API works in a focused extension page without it. |
| `cookies`, `history`, `bookmarks`, `management`, `webRequest`, `proxy`, `nativeMessaging` | No feature needs them. All are in the build's forbidden list. |

`tools/verify.mjs` fails the build if any permission outside the approved five appears in the manifest, if `host_permissions` or `content_scripts` are declared, or if a declared permission is not justified in this document.

---

## 4. User data

### 4.1 What Tallshot collects

**Nothing.**

| Data category | Collected? |
|---|---|
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity (clicks, scrolls, keystrokes) | No |
| Website content | **Not collected.** Screenshot pixels are produced on the user's device, held in local browser storage only until the editor opens them, and never transmitted. |

### 4.2 Chrome Web Store data disclosure answers

| Question | Answer |
|---|---|
| Does this item collect user data? | **No** |
| Is data sold to third parties? | **No** — nothing is collected |
| Is data used or transferred for purposes unrelated to the item's single purpose? | **No** |
| Is data used or transferred to determine creditworthiness or for lending? | **No** |

**Certifications made at submission:**
- ✅ I do not sell or transfer user data to third parties, apart from the approved use cases
- ✅ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

### 4.3 Where data lives

| Store | Contents | Lifetime | Leaves the device? |
|---|---|---|---|
| `chrome.storage.sync` | User preferences only (~1KB) | Until reset | Only via the user's own Chrome Sync, under Google's account controls — never to us |
| IndexedDB (`tallshot` → `captures`) | The stitched capture blob | Deleted the moment the editor loads it; anything orphaned is swept after 30 minutes | No |
| Downloads folder | The exported file the user asked for | Permanent, under the user's control | No |
| Clipboard | The image, when the user copies it | Until overwritten | No |

**Clipboard implementation note.** Writing an image to the clipboard from a service worker requires either the `offscreen` permission or on-demand injection. We chose injection to keep the permission list at five. The injected function receives only the image we just produced, writes it to the clipboard, and returns a boolean. It reads nothing from the page. If a page's `Permissions-Policy` blocks clipboard access, the capture falls back to a download rather than being lost.

### 4.4 Network activity

**There is none.** The extension contains no `fetch` to a remote origin, no `XMLHttpRequest`, no `WebSocket`, and no `sendBeacon`. The only `fetch` calls in the codebase target `data:` and `blob:` URLs the extension created itself. `tools/verify.mjs` scans every source file for these patterns and fails the build on any match.

### 4.5 Privacy policy

- **Source:** [`PRIVACY.md`](../PRIVACY.md)
- **Published:** https://owncoder.github.io/tallshot/
- **Terms of use:** https://owncoder.github.io/tallshot/terms.html

The published page is static HTML with no scripts, no external requests and no trackers — the page itself demonstrates the claim it makes.

---

## 5. Disclosure and honesty

| Requirement | How we meet it |
|---|---|
| All functionality disclosed | Every feature is listed in the store description, the README and the CHANGELOG. Nothing is hidden or activated later. |
| No undisclosed behaviour | There is no remote configuration, no feature flag server, and no deferred code loading. What is in the ZIP is everything the extension does. |
| Accurate description | Every claim in the listing is verifiable by installing it. Limitations are stated in the README and the CHANGELOG rather than discovered by users. |
| Honest degraded states | When a capture is downscaled or partial, the editor says so with an exact percentage. We do not present a compromised result as a clean one. |
| No misleading name | "Tallshot" is our own coined mark. The listing does not include a competitor's brand name — see §7 and §9. |

---

## 6. Prohibited practices

| Prohibited | Status |
|---|---|
| Malicious or deceptive code | None. No obfuscation, no minification, no packing — the shipped source is readable and is identical to the repository. |
| Remote code execution | None. No `eval`, no `new Function`, no `importScripts`, no injected remote `<script>`. MV3's CSP is used unmodified. Build-enforced. |
| Deceptive installation or functionality | None. No bundling, no post-install redirects, no surprise tabs. The one page opened on install is the settings/welcome page. |
| Affiliate injection, ad injection, coupon injection | None. |
| Cryptomining | None. |
| Keyword or metadata spam | None — see §9. |
| Artificially boosting ratings, clickbait | None. No rating prompt on install; reviews are asked for only after demonstrated successful use, and never with an incentive. |
| Impersonation | None. The brand, icon and copy are original and resemble no other product. |
| Hate speech, violence, adult content | None. |

---

## 7. Intellectual property

This section exists because the highest-profile removal in this category — GoFullPage, 11 August 2026, 11M+ users — was a **copyright dispute over a design element**, not a security issue. Our defence is to own everything we ship.

| Asset | Provenance |
|---|---|
| Extension name "Tallshot" | Coined for this project. Clearance search documented in [project-overview.md](project-overview.md) §3 — no Chrome Web Store listing, no conflicting software mark. |
| Logo and icon set | Generated procedurally by `tools/make-icons.mjs`. Every pixel is computed from geometry we wrote. No stock, no traced artwork, no icon-set derivative. |
| Interface icons | Original SVG paths authored in our source on a 24×24 grid. No icon library is bundled or referenced. |
| Typography | System font stack only. No font file is bundled, so no font licence applies. |
| Store screenshots | Rendered by `tools/make-screenshots.mjs` from our own markup. The demo page depicted ("Northwind Analytics") is fictional; no real brand, site, person or trademark appears. |
| Code | Written for this project. **Zero runtime dependencies** — including the PDF writer and the PNG encoder, which are ours rather than bundled libraries. |
| Copy | Original throughout. No competitor's marketing text is reused. |
| Google/Chrome marks | Not used in our name, icon or branding, per the Branding Guidelines. Chrome is referenced only factually ("requires Chrome 116 or newer"). |

**Competitor references.** Comparative claims in our documentation (for example, that a competitor lacks redaction) are factual, verifiable, and used nominatively. No competitor's brand appears in the extension name, the icon, or the listing title.

---

## 8. Manifest V3 and code quality

| Requirement | Status |
|---|---|
| Manifest V3 | ✅ `manifest_version: 3`, service worker background, `chrome.scripting` |
| No background page | ✅ Service worker only, declared `type: "module"` |
| No remote code | ✅ Everything bundled; build-enforced |
| Default CSP | ✅ Unmodified; no relaxation requested |
| Readable code | ✅ Not minified, not obfuscated. The ZIP contents are byte-identical to the repository source. |
| No inline script or inline event handlers | ✅ Build-enforced across all three HTML surfaces |
| `minimum_chrome_version` | ✅ `"116"` — the floor for the APIs used |
| Package size | ✅ Approximately 100 KB unpacked |
| Deprecated APIs | ✅ None used |

---

## 9. Listing metadata

The policy prohibits keyword stuffing, misleading metadata, and using another product's brand for search reach. This is the specific failure of the reference product analysed in [market-research.md](market-research.md) §3.

| Rule | How the listing complies |
|---|---|
| No keyword stuffing | Title is `Tallshot — Full Page Screenshot & Editor`: one brand plus one accurate descriptor. Not a keyword string. |
| No competitor brand in the title | The title contains no competitor mark. |
| Description matches behaviour | Every listed feature exists in the shipped build. |
| No superlatives or clickbait | No "best", "#1", "ultimate", or manufactured urgency anywhere in the copy. |
| No fake locale coverage | English only. We do not publish machine-translated metadata for search reach in 53 languages we do not support. |
| Screenshots represent the product | All five are the real UI, with real design tokens, showing real behaviour. |
| Category | Productivity → Workflow & Planning, which matches the single purpose. |

Final copy: [store-listing.md](store-listing.md).

---

## 10. Accessibility and quality

| Area | Status |
|---|---|
| WCAG 2.1 AA contrast | ✅ All pairs verified — table in [branding.md](branding.md) §4 |
| Keyboard operation | ✅ Complete, including region selection and every editor tool |
| Visible focus | ✅ 2px ring on every interactive element; never removed |
| Semantic markup | ✅ Native controls throughout; `role="toolbar"` with `aria-pressed` on tools |
| Screen-reader announcements | ✅ `aria-live` on capture progress and errors |
| Reduced motion | ✅ `prefers-reduced-motion` honoured; no meaning conveyed by motion alone |
| Colour independence | ✅ Active states carry accent, fill and `aria-pressed` — never colour alone |
| Text scaling | ✅ Layout holds to 200% zoom |
| Stated limitations | ✅ Canvas drawing is inherently visual; documented rather than hidden — [ux-plan.md](ux-plan.md) §7 |

---

## 11. Submission checklist

| Item | Status |
|---|---|
| Manifest V3, version 1.0.0 | ✅ |
| Five permissions, all justified above | ✅ |
| No host permissions | ✅ |
| Icons at 16, 32, 48, 128 | ✅ |
| Five screenshots at 1280×800 | ✅ |
| Promo tile at 440×280 | ✅ |
| Title ≤ 75 characters | ✅ 44 |
| Short description ≤ 132 characters | ✅ 126 |
| Privacy policy published and reachable | ✅ |
| Data-use certifications answered | ✅ §4.2 |
| Single purpose declared | ✅ §2 |
| No remote code | ✅ Build-enforced |
| Source readable, unminified | ✅ |
| `npm run verify` passes | ✅ |

---

## 12. Ongoing obligations

| Obligation | Our practice |
|---|---|
| Keep the privacy policy accurate | Any change to data handling updates `PRIVACY.md`, the published page, and this document in the same commit |
| Keep permissions minimal | A new permission requires a documented justification here, or `verify.mjs` fails the build |
| Respond to review feedback | Every store review answered; defects fixed and the fixing version named in the reply |
| Version discipline | Semantic versioning, enforced consistent across `manifest.json`, `package.json`, `constants.js` and `CHANGELOG.md` by the audit |
| Re-audit before each release | `npm run release` runs the audit and refuses to package a non-compliant tree |

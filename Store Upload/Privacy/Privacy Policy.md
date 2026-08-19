# Privacy Policy — Tallshot

- **Effective:** 19 August 2026
- **Last updated:** 19 August 2026
- **Applies to:** Tallshot browser extension, version 1.0.0 and later
- **Published at:** https://owncoder.github.io/tallshot/

---

## The short version

**Tallshot does not collect, transmit, store or sell any of your data.**

Everything happens on your device. There is no server, no account, no analytics, and no tracking. Your screenshots never leave your browser unless you save or copy them yourself.

---

## 1. What we collect

**Nothing.**

Tallshot has no backend. There is no server to send data to, no account system, and no analytics or telemetry of any kind. We cannot see your screenshots, the pages you visit, or how often you use the extension — not because we choose not to look, but because the extension is not built to report anything.

| Category | Collected |
|---|---|
| Name, email, or any personal identifier | No |
| Screenshots or page content | No |
| Browsing history or visited URLs | No |
| Clicks, scrolls, keystrokes, or usage analytics | No |
| IP address or device identifiers | No |
| Location | No |
| Financial or payment information | No |
| Crash reports or diagnostics | No |

---

## 2. What stays on your device

Tallshot stores three things locally. None of them is transmitted anywhere.

### Your settings
Your preferences — capture behaviour, default export format, quality, filename template, theme — are saved using `chrome.storage.sync`. This is roughly one kilobyte of configuration values. It contains no screenshots and no browsing data.

If you have Chrome Sync enabled, Chrome may sync these settings between your own signed-in devices. That transfer is handled entirely by Google under your Chrome account settings; it does not pass through us, and we have no access to it. You can disable it in Chrome's sync settings.

### Your capture, briefly
When you take a screenshot and choose to open it in the editor, the image is written to your browser's local IndexedDB storage so that the editor tab can load it reliably. **It is deleted as soon as the editor has it.** If a capture is ever orphaned — for example you close the editor tab before it loads — it is automatically removed after 30 minutes.

### Files you export
When you save a screenshot, it goes to your normal downloads folder. When you copy one, it goes to your system clipboard. Both are entirely under your control.

---

## 3. Permissions, and what each one actually allows

Tallshot requests five permissions. Chrome shows **no site-access warning** when you install it, because none of them grants access to your browsing.

| Permission | What it allows | What it does not allow |
|---|---|---|
| **activeTab** | Capture and interact with the single tab you explicitly invoked Tallshot on. Access is granted only by your click, keyboard shortcut, or right-click, and is revoked when you navigate away. | Access to any other tab, or to any page you did not invoke Tallshot on |
| **scripting** | Insert the capture logic into that one tab, at the moment you ask for a capture | Running on pages you visit normally. Tallshot registers no content scripts, so it is not present on any page until you invoke it. |
| **downloads** | Save the image you exported | Reading your download history or accessing other files |
| **storage** | Remember your settings | Storing page content or browsing data |
| **contextMenus** | Add three right-click menu entries | Reading page content |

### What Tallshot deliberately does not request

`<all_urls>` or any host permission · `tabs` · `debugger` · `cookies` · `history` · `bookmarks` · `webRequest` · `nativeMessaging`

The absence of host permissions is the important one: it means Tallshot is **structurally incapable** of reading pages you have not pointed it at. This is not a promise about our intentions — it is a property of what Chrome will let the extension do.

---

## 4. What Tallshot reads from a page

When you capture a page, Tallshot reads only what it needs to produce a correct image:

- The page's dimensions and your scroll position
- Which elements are `position: fixed` or `position: sticky`, so headers do not repeat down the image
- The device pixel ratio, so the output is sharp

It does **not** read page text, form fields, passwords, cookies, local storage, or any other page data — and nothing it reads is transmitted anywhere. It is used to compute the capture and then discarded.

---

## 5. Third parties

There are none.

- No analytics provider
- No error-reporting service
- No advertising or tracking network
- No content delivery network
- No third-party libraries, fonts, or icon sets bundled in the extension
- No data shared, sold, rented or transferred to anyone

---

## 6. Chrome Web Store data disclosures

Tallshot certifies to Google that:

- It does not sell or transfer user data to third parties, apart from the approved use cases
- It does not use or transfer user data for purposes unrelated to its single purpose
- It does not use or transfer user data to determine creditworthiness or for lending purposes

These certifications are trivially satisfied, because no user data is collected in the first place.

---

## 7. Children

Tallshot is a general-purpose utility, is not directed at children, and collects no data from anyone, including children under 13.

---

## 8. Your rights

Most privacy policies explain how to request access to or deletion of your data. Because Tallshot holds no data about you, there is nothing to request. If you want to remove everything Tallshot has ever stored:

1. Open `chrome://extensions`
2. Remove Tallshot

That deletes your settings and any local storage. Files you exported remain in your downloads folder, where you put them.

Under the GDPR, CCPA and comparable laws we act as neither a data controller nor a data processor with respect to your captures, because we never receive them.

---

## 9. Security

- All processing is local, so there is no transmission to intercept and no database to breach.
- The extension contains no remote code execution: no `eval`, no dynamically loaded scripts, no remote configuration. This is enforced automatically by an audit that runs before every release.
- The shipped code is not minified or obfuscated, and is identical to the public source, so anyone can verify these claims.
- Source: https://github.com/ownCoder/tallshot

---

## 10. Changes to this policy

If this policy changes, the "Last updated" date changes with it and the change is recorded in the project's CHANGELOG.

**If Tallshot ever begins collecting any data of any kind, it will require your explicit, informed, opt-in consent, and will be disclosed here and in the release notes before it ships.** No data collection will ever be enabled by default or introduced silently.

---

## 11. Contact

- **Issues and questions:** https://github.com/ownCoder/tallshot/issues
- **Email:** owncoder@gmail.com

---

*Tallshot is an independent project. It is not affiliated with, endorsed by, or sponsored by Google LLC. Chrome is a trademark of Google LLC.*

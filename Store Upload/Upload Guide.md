# Upload Guide — Tallshot 1.0.0

**Everything needed to submit is in this folder.** Open it, follow the steps, submit.

You already have a verified Chrome Web Store developer account with two published extensions, so this guide covers only this submission — no account setup.

**Estimated time: 15 minutes.**

---

## What's in this folder

```
Store Upload/
├── Extension.zip                  ← upload this to the Package tab
├── Upload Guide.md                ← you are here
├── Store Assets/
│   ├── Screenshot 1 — Full page capture.png    1280×800
│   ├── Screenshot 2 — Editor.png               1280×800
│   ├── Screenshot 3 — Blur and redaction.png   1280×800
│   ├── Screenshot 4 — Sticky headers.png       1280×800
│   ├── Screenshot 5 — Privacy.png              1280×800
│   ├── Promo tile 440x280.png                  440×280
│   ├── icon-16.png / icon-32.png / icon-48.png / icon-128.png
│   └── Store Listing Copy.md      ← all text to paste, in order
└── Privacy/
    ├── Privacy Policy URL.txt     ← the URLs for the dashboard fields
    ├── Privacy Policy.md
    ├── Terms of Use.md
    ├── privacy-policy.html
    └── terms-of-use.html
```

---

## Step 1 — Verify the package before uploading

Two minutes that prevent a rejected submission.

1. Unzip `Extension.zip` to a temporary folder.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Confirm:
   - It loads with **no errors**.
   - The install prompt shows **no site-access warning** — this is the point of the permission design. If you see "Read and change all your data on all websites", something is wrong; stop and investigate.
   - Press `Alt+Shift+F` on any ordinary website. A capture should complete and the editor should open.
6. Remove the unpacked copy before uploading.

---

## Step 2 — Create the new item

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. **Add new item**.
3. Upload **`Extension.zip`**.
4. Wait for the upload to process, then continue to the listing form.

---

## Step 3 — Store listing tab

Copy from `Store Assets/Store Listing Copy.md`. The exact strings are in sections 1, 2 and 4 of that file.

| Dashboard field | What to enter | Source |
|---|---|---|
| **Item name** | `Tallshot — Full Page Screenshot & Editor` | §1 |
| **Short description** | The 126-character line beginning "Full-page screenshots that actually work…" | §2 |
| **Detailed description** | The full block in §4 — paste the whole thing, keep the line breaks | §4 |
| **Category** | Productivity → Workflow & Planning | §3 |
| **Language** | English (United States) | §3 |

### Graphic assets

| Field | File | Notes |
|---|---|---|
| **Store icon** | `Store Assets/icon-128.png` | 128×128 |
| **Screenshots** | All five, **in numbered order** | 1280×800. Order matters — most shoppers see only the first two. |
| **Small promo tile** | `Store Assets/Promo tile 440x280.png` | 440×280 |
| **Marquee promo tile** | *(leave empty)* | Only used for editorial features |

### Additional fields

| Field | Value |
|---|---|
| **Official URL / Homepage** | `https://github.com/ownCoder/tallshot` |
| **Support URL** | `https://github.com/ownCoder/tallshot/issues` |
| **Mature content** | No |

---

## Step 4 — Privacy practices tab

This is the tab that most often causes rejection. Every answer is already decided; do not improvise.

### Single purpose

Paste exactly:

```
Capture a web page as an image, then annotate and export it locally.
```

### Permission justifications

Paste each one into the matching field. Full text is in `Store Assets/Store Listing Copy.md` §7.

| Permission | Justification (summary — paste the full text from §7) |
|---|---|
| `activeTab` | Capture the visible contents of the tab the user explicitly invokes Tallshot on, and inject the capture logic into it. Used instead of host permissions. |
| `scripting` | Inject the capture agent into the active tab on demand. No content scripts are declared. |
| `downloads` | Save the finished screenshot to the user's downloads folder. |
| `storage` | Persist the user's own preferences. No page content or browsing data. |
| `contextMenus` | Add three right-click menu entries for the capture modes. |
| **Remote code** | Select **"No, I am not using remote code."** All code is in the package. |

### Data usage

**Answer "No" to every data category.** Tallshot collects nothing.

| Category | Answer |
|---|---|
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | No |

### Certifications — tick all three

- ☑ I do not sell or transfer user data to third parties, apart from the approved use cases
- ☑ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

Paste from `Privacy/Privacy Policy URL.txt`:

```
https://owncoder.github.io/tallshot/
```

**Before submitting, open that URL in a browser and confirm it loads.** A dead privacy policy URL is an automatic rejection.

---

## Step 5 — Distribution tab

| Field | Value |
|---|---|
| **Visibility** | Public |
| **Distribution** | All regions |
| **Pricing** | Free |

---

## Step 6 — Final review before submitting

| Check | ✓ |
|---|---|
| Version shows **1.0.0** in the dashboard | ☐ |
| Package uploaded without errors | ☐ |
| Item name is 44 characters, exactly as in §1 | ☐ |
| Short description is 126 characters | ☐ |
| Detailed description pasted in full, formatting intact | ☐ |
| All five screenshots uploaded **in order** | ☐ |
| Promo tile uploaded | ☐ |
| Store icon uploaded | ☐ |
| Category: Productivity → Workflow & Planning | ☐ |
| Single purpose statement entered | ☐ |
| All five permission justifications entered | ☐ |
| "Not using remote code" selected | ☐ |
| Every data category answered **No** | ☐ |
| All three certifications ticked | ☐ |
| Privacy policy URL entered **and confirmed loading** | ☐ |
| Support and homepage URLs entered | ☐ |
| Loaded unpacked and smoke-tested (Step 1) | ☐ |

---

## Step 7 — Submit

Click **Submit for review**.

**What to expect.** Review typically takes a few hours to a few days. Extensions requesting no host permissions and no sensitive data — like this one — generally clear faster than average, because the reviewer has little to investigate.

---

## If it is rejected

Do not resubmit blindly. Read the stated reason and match it below.

| Reason given | What to do |
|---|---|
| Permission not justified | Re-paste the justification from §7 — the full text, not the summary. Ensure `docs/compliance.md` §3 covers it. |
| Privacy policy inaccessible | Open the URL yourself. Check GitHub Pages is enabled and the `gh-pages` branch has `index.html` at its root. |
| Single purpose unclear | Re-paste the single purpose statement verbatim; do not add features to it. |
| Metadata / keyword spam | Should not occur — the copy is deliberately clean. If cited, reply asking which phrase; do not guess and rewrite. |
| Misleading description | Identify the claim cited and either evidence it or remove it. Never soften an accurate claim just to clear review. |

Fix, then resubmit. Most rejections are a single field.

---

## After it goes live

1. **Install from the store yourself.** Verify the listing renders correctly and the extension works from a real store install, not just unpacked.
2. **Do not announce yet.** [growth-plan.md](../docs/growth-plan.md) §4 opens with a deliberately quiet week: find the defects real websites expose before inviting an audience.
3. **Tag the release:** `git tag v1.0.0 && git push --tags`
4. **Watch the reviews.** Answer every one within 48 hours. Reply again with the version number when a reported bug is fixed.

---

## Regenerating this package

Everything here is a build output and is never edited by hand:

```bash
npm run release
```

That renders the icons, renders the store screenshots, rebuilds the privacy site, runs the compliance audit, and — only if the audit passes — produces `Extension.zip` and reassembles this folder.

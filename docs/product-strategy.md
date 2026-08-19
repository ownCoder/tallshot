# Product Strategy — Tallshot

**Owner:** Product Manager (internal)
**Version:** 1.0 · 19 August 2026
**Input:** [market-research.md](market-research.md)

---

## 1. The core problem

> **A web page is taller than a screen, and every tool that tries to bridge that gap either breaks, charges, or watches you.**

Unpacked into the three failures users actually hit:

**Failure 1 — It comes out wrong.**
The sticky navbar is stamped down the image seven times. The product photos are grey placeholders because they never lazy-loaded. The bottom third is missing because Chrome's capture throttle aborted the run. The user does not know why; they know the file is unusable and they have to try again or give up.

**Failure 2 — The thing they need costs money.**
Capture is free; drawing an arrow on it is Premium. Blurring a customer's email address before pasting into a ticket is Premium — or, in the market leader's case, not available at any price. The user hits the paywall *after* they have already invested in the workflow.

**Failure 3 — They can't tell what it's doing.**
Install prompts ask to "read and change all your data on all websites." Some extensions in this category have been documented harvesting browsing activity. A screenshot tool sees, by definition, exactly what is on screen — including the invoice, the medical portal, the internal dashboard. Users are right to be nervous, and the category has earned that nervousness.

### Why now

August 2026 handed this problem a moment. GoFullPage — 11M users, the category's default answer — was pulled from the Chrome Web Store on 11 August and remotely disabled with an "unsafe" banner. The cause was a copyright dispute, not a breach, but the users who saw the warning did not know that. The category's most trusted product became, for a week, its most alarming one.

---

## 2. The solution

**Tallshot is a full-page screenshot tool whose engine is the product.**

Three commitments, each traceable to a failure above:

| Failure | Commitment | Implementation |
|---|---|---|
| It comes out wrong | **The capture is correct on real pages, not just simple ones** | Lazy-load pre-pass; sticky/fixed element freezing; quota-aware capture pacing with backoff; explicit oversize handling; exact page restoration |
| It costs money | **Everything that shipped free stays free, forever, in writing** | No watermark, no account, no capture cap, no export cap. Full editor including redaction and PDF. Committed in README, CHANGELOG and store listing. |
| You can't tell what it's doing | **Privacy is structural, not promised** | `activeTab` only — no host permissions, so Chrome shows no site-access warning at install. Zero network code. Public source. |

### Product definition in one sentence

> Tallshot captures any web page — the visible area, a dragged region, or the entire scrollable page — and opens it in a fast local editor where you can annotate, redact and export, without an account, a watermark, or a single byte leaving your browser.

---

## 3. Target audience

### Primary segments

| Segment | Size signal | What they capture | Why they leave a competitor |
|---|---|---|---|
| **Support & success agents** | Highest-frequency users in the category | Bug reports, error states, customer-facing evidence | Need redaction (customer PII) — market leader doesn't have it at any price |
| **QA / web developers** | Strong Reddit & HN overlap | Layout bugs, regression evidence, long pages with sticky chrome | Need *correct* captures — they are exactly the users who notice a repeated navbar |
| **Designers & design reviewers** | Product Hunt / X native | Competitor pages, full-site references, design audits | Need fidelity and full-page height; hate watermarks |
| **Students & researchers** | Very large, low-intensity | Articles, receipts, course pages, sources | Need free-forever and PDF; will not create an account |
| **Ops, finance, admin** | Underserved | Invoices, dashboards, records, compliance evidence | Need redaction and local-only processing for policy reasons |

### Secondary

Journalists archiving pages, real-estate and e-commerce sellers capturing listings, teachers building materials, anyone assembling documentation.

### Explicitly not our audience

Users who want screen *recording*, cloud libraries, team workspaces or sharing links. Serving them would break single-purpose, expand the permission surface, and put us in direct competition with well-funded suites on their strongest ground.

---

## 4. User personas

### Persona 1 — Priya, Support Engineer

**Context:** 32, mid-size B2B SaaS, handles 40+ tickets a day. Lives in a helpdesk tab and the product's admin console.

**Job to be done:** *When a customer reports a broken page, I need to attach proof to the ticket in under 30 seconds — with their account number and email hidden, because our policy forbids PII in ticket attachments.*

**Current pain:** Her tool captures fine but has no blur. She screenshots, downloads, opens Paint, draws black boxes, re-saves, uploads. Four minutes per ticket, several times a day.

**What wins her:** Redaction in the same window as capture, one keystroke to copy the finished image to the clipboard, no upload step.

**Success metric:** Ticket-evidence time drops from ~4 minutes to under 30 seconds.

---

### Persona 2 — Marcus, Front-End Developer

**Context:** 27, agency, ships marketing sites. Reviews his own work across breakpoints all day.

**Job to be done:** *I need a pixel-accurate capture of a 9,000px landing page — with the sticky header appearing once, at the top, where it belongs — to paste into the PR.*

**Current pain:** Every free tool he has tried repeats the sticky header down the image or drops the hero images that lazy-load. He has fallen back to DevTools' "Capture full size screenshot," which works but is five clicks deep and cannot annotate.

**What wins him:** A capture that is simply correct on the first try, plus keyboard shortcuts. He is the user most likely to *notice* engineering quality — and most likely to tell other developers about it.

**Success metric:** Zero re-captures. He stops opening DevTools for this.

---

### Persona 3 — Aisha, PhD Researcher

**Context:** 26, humanities, archives sources constantly. Institutional laptop, cautious about what she installs.

**Job to be done:** *I need the whole article, permanently, as a PDF I can cite and file — without making another account or wondering who else is reading my research.*

**Current pain:** Print-to-PDF mangles layout. The tools that do it properly want a sign-up, and she does not want her reading history in someone's cloud.

**What wins her:** PDF export in the free tier, no account, and a permission prompt that does not ask to read all her data on all websites.

**Success metric:** She installs without hesitating, and it becomes her default archive step.

---

### Persona 4 — Tom, Operations Manager

**Context:** 44, logistics, low technical confidence, high compliance obligation.

**Job to be done:** *I need to file evidence of a dashboard state for an audit, with supplier pricing blacked out, and I need to be sure it isn't going anywhere.*

**Current pain:** He does not know which extensions are safe. He has been told by IT not to install anything that "reads all your data."

**What wins him:** An install prompt with no site-access warning, a plain-English privacy policy, and a UI where the first screen has three buttons, not thirty.

**Success metric:** He completes a capture without asking anyone for help.

---

## 5. Value proposition

### Positioning statement

> **For** people who need the whole page — not just the part that fits on screen —
> **Tallshot** is a Chrome screenshot tool
> **that** captures long pages correctly and lets you annotate, redact and export them locally,
> **unlike** GoFullPage, Awesome Screenshot and Nimbus,
> **because** everything is free with no account, and nothing you capture ever leaves your browser.

### The value ladder

| Level | Statement |
|---|---|
| **Functional** | Capture the entire scrollable page — sticky headers appear once, lazy images load, long pages finish. |
| **Practical** | Annotate, blur and export to PNG, JPG, WebP or PDF in the same window, with no upgrade prompt. |
| **Emotional** | Stop worrying about what a screenshot extension can see. It has no permission to see anything you didn't point it at. |
| **Identity** | You use tools that respect you. |

---

## 6. Unique selling proposition

### The one-line USP

> **The only full-page screenshot tool with a complete free editor — including blur redaction — that has no host permissions and no network code at all.**

Each clause is a defensible, verifiable claim:

| Claim | Why competitors can't match it easily |
|---|---|
| **Complete free editor** | GoFullPage and FireShot monetise precisely this. Matching us means giving up revenue. |
| **Blur redaction free** | GoFullPage lacks it *entirely*, including Premium. Not a pricing gap — a product gap. |
| **No host permissions** | Awesome Screenshot and Nimbus depend on broad access for cloud sync and recording. Dropping it means removing features. |
| **No network code** | Any product with analytics, accounts or cloud storage fails this by construction. |

### The three supporting proof points

1. **"Sticky headers appear once."** Concrete, checkable in five seconds, and it is the category's single most-complained-about defect.
2. **"No account, no watermark, no limits — permanently."** Written into the repository, not just the marketing.
3. **"Chrome shows no site-access warning when you install it."** A claim the user verifies at install time, before they even trust us.

---

## 7. Growth strategy

Detailed execution in [growth-plan.md](growth-plan.md). Strategic frame:

### Phase A — Capture the displacement window (weeks 1–4)

The GoFullPage outage created a population of users actively searching for a replacement. This is a discovery opportunity with a closing window — GoFullPage will likely be restored.

- Store listing engineered around the actual search phrases: *full page screenshot*, *screenshot entire webpage*, *scrolling screenshot*, *webpage to PDF*.
- Honest comparison content that names the real trade-offs, including where competitors are better. Credibility converts better than superlatives, and it keeps us clear of the store's clickbait policy.
- Community presence where the displaced users already are, contributing as a builder rather than dropping links.

### Phase B — Convert quality into ranking (months 2–4)

Chrome Web Store ranking is materially driven by rating and review volume. Our engineering investment in correctness is a *growth* investment, because it produces the reviews that produce the ranking.

- Ask for the review at the moment of demonstrated success — after several completed captures — never on install.
- Treat every negative review as a bug report with a public reply and a version number that fixes it.

### Phase C — Compound through word of mouth (months 4–12)

The personas most likely to recommend (Marcus the developer, Priya the support engineer) recommend on *reliability*, not features. Retention work is growth work.

### The growth engine in one line

> Correctness → reviews → store ranking → installs → more correctness pressure.

---

## 8. Retention strategy

Installs are vanity; the metric that matters is **weekly active capture**.

| Lever | Mechanism |
|---|---|
| **Time-to-first-value under 10 seconds** | The popup opens directly onto three capture buttons. No onboarding wall, no tour, no sign-in. The first capture *is* the onboarding. |
| **Zero-friction repeat use** | Keyboard shortcuts (`Alt+Shift+F` full page, `Alt+Shift+V` visible, `Alt+Shift+R` region) make it muscle memory. Muscle memory is the strongest retention mechanic available to an extension. |
| **The workflow ends inside Tallshot** | Capture → annotate → redact → export/copy without leaving the window. Every tool that forces an export into another app loses the habit to that app. |
| **Never punish the user** | No upgrade interstitials, no watermarks, no counters, no nags. The single most common uninstall trigger in this category is a paywall appearing mid-task. |
| **Settings that actually persist** | Preferred format, quality, filename template and post-capture action sync across devices via `chrome.storage.sync`, so the tool matches the user's habits rather than the reverse. |
| **Failures explain themselves** | When something cannot work — a `chrome://` page, a PDF viewer, an oversized page — we say exactly what happened and what to do, with no dead ends. Silent failure is the top uninstall cause for capture tools. |

### Retention targets

| Metric | Target |
|---|---|
| Day-7 retention | ≥ 40% |
| Day-30 retention | ≥ 25% |
| Weekly captures per active user | ≥ 5 |
| Uninstall rate in first 48h | ≤ 15% |

*Measured via Chrome Web Store developer dashboard install/uninstall data only. We collect no in-product analytics — this is a deliberate trade of measurement precision for the privacy claim that differentiates us.*

---

## 9. Monetisation roadmap

Full tier definition in [free-vs-pro-plan.md](free-vs-pro-plan.md).

### Principle

**Pro is additive, never subtractive.** Nothing that ships free in v1.0 will ever move behind a paywall. This is a written commitment, and it is also the correct commercial choice: the category's clearest cautionary tale is Nimbus/FuseBase, which paywalled its core function and lost both users and rating.

### Timeline

| Stage | Trigger | Action |
|---|---|---|
| **Phase 1 — Free** | Launch → 5,000 users | Everything free. No monetisation surface whatsoever. Build rating, reviews and trust. |
| **Phase 1.5 — Signal gathering** | 5,000 users | Optional support link. Listen for which power-user requests recur — the Pro feature set should be discovered, not guessed. |
| **Phase 2 — Pro launch** | Product-market fit confirmed: ≥5,000 users, ≥4.5 rating, ≥25% D30 retention | Introduce Pro as *new* capability. Free tier untouched. |
| **Phase 3 — Sustain** | Post-Pro | Fund ongoing free development from Pro revenue. |

### Pro pricing hypothesis

| Option | Price | Rationale |
|---|---|---|
| Monthly | $2.49 | Undercuts Awesome Screenshot ($8/mo) decisively; positioned as a tip, not a subscription decision |
| Annual | $19 | ~36% saving; the expected default |
| **Lifetime** | **$39** | **Expected best-seller.** This audience is actively fleeing subscriptions — Nimbus's $60/yr is the counter-example we position against. A one-time price is itself a trust signal. |

### Technical readiness

The Free/Pro seam exists in v1.0 and is inert: `src/lib/flags.js` gates every capability behind a tier check, and `src/lib/license.js` is a stub that always returns the free tier. Enabling Pro is a matter of implementing the licence check behind that interface — no architectural rewrite. See [architecture.md](architecture.md) §9.

---

## 10. Roadmap to 5,000 users

Detailed tactics in [growth-plan.md](growth-plan.md). Strategic checkpoints:

| Checkpoint | Users | Gate to pass before continuing |
|---|---|---|
| **Launch** | 0 | Store approval; zero P0 defects; privacy policy live |
| **Week 2** | 100 | ≥4.0 rating; every review answered |
| **Week 4** | 500 | Ranking on "full page screenshot"; first 10 reviews in |
| **Week 8** | 1,500 | D7 retention ≥40%; no unresolved P1 defects |
| **Week 16** | 3,000 | ≥25 reviews at ≥4.5; organic installs exceed campaign-driven ones |
| **Week 24** | **5,000** | **PMF gate → begin Pro development** |

### The gates matter more than the numbers

Each checkpoint is a *stop condition*, not just a milestone. If the rating is below 4.0 at week 2, the correct action is to fix the product, not to market harder. Growth spend on a product with a broken capture engine converts installs into one-star reviews, which permanently damages store ranking. The order is non-negotiable: **fix, then grow**.

---

## 11. Strategic risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GoFullPage is restored and reclaims attention | **High** | Medium | Never position as a substitute. Compete on the editor and redaction, which it does not have at any price. |
| A well-funded competitor copies the free-editor position | Medium | High | Our moat is the *absence* of a business model to protect. They must sacrifice revenue; we sacrifice nothing. |
| Chrome Web Store rejection or removal | Low | **Critical** | Minimum permissions, single purpose, all-original assets, published privacy policy, documented provenance. See [compliance.md](compliance.md). |
| Capture engine fails on a popular site class | Medium | High | Explicit test matrix across page archetypes; typed errors with actionable messages; fast patch cadence. See [testing-report.md](testing-report.md). |
| Growth stalls below 5,000 | Medium | Medium | The gates above force a diagnosis — product or distribution — before more spend. |
| Chrome deprecates or further restricts capture APIs | Low | High | Capture logic is isolated behind one module boundary (`src/capture` + `stitch.js`), so an API change is a contained rewrite. |

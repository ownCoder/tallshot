# Growth Plan — Tallshot

**Goal:** 5,000 organic users
**Target date:** 24 weeks from launch (early February 2027)
**Budget:** $0 paid acquisition
**Owner:** Growth Strategist (internal)

---

## 1. The strategic situation

Two facts shape everything below.

**The category is temporarily unstable.** GoFullPage — 11M+ users, the default answer to "how do I screenshot a whole page" — was pulled from the Chrome Web Store on 11 August 2026 and remotely disabled with an "unsafe" warning. The cause was a copyright dispute, not a breach, but millions of users saw a broken toolbar button in the same week. Competitors published "GoFullPage alternative" landing pages within 72 hours.

**That window will close.** GoFullPage will very likely be restored. So the plan is *not* "capture the refugees" — it is "use the window to get discovered, then keep people through quality." A displacement-driven install that churns in a week is worth nothing; it is worse than nothing if it leaves a two-star review.

**Therefore the growth engine is:**

> Correctness → reviews → store ranking → installs → more correctness pressure.

Everything in this document either produces the first discovery or protects the loop.

---

## 2. The funnel, with real numbers

| Stage | Conversion assumption | Basis |
|---|---|---|
| Store listing impression → detail page | 3–6% | Category norm for a mid-ranked listing |
| Detail page → install | 12–20% | Raised by no-permission-warning and honest screenshots |
| Install → first successful capture | **>90%** | Our design target — the popup opens straight onto three buttons |
| First capture → day-7 retained | 40% | Our target |
| Retained → leaves a review | 1–3% | Category norm; higher when asked at the right moment |

**Working backwards from 5,000 users in 24 weeks:**

- 5,000 installs at ~15% detail-page conversion → ~33,000 detail-page visits
- At ~4% impression-to-detail → ~825,000 search impressions
- Which requires ranking on page 1 for at least one primary phrase
- Which requires roughly **40–60 reviews at 4.5+**, achievable from ~2,500 retained users

The dependency chain is unforgiving and it runs one way: **rating gates ranking, ranking gates installs.** That is why §6 exists and why the checkpoints in §8 are stop conditions rather than milestones.

---

## 3. Chrome Web Store SEO

The store's ranking signals, in rough order of weight: title and description keyword match, install count, rating and review volume, engagement/retention, update recency.

We can influence four of the five immediately.

### 3.1 Listing optimisation

Done — full copy in [store-listing.md](store-listing.md). The principles:

- **Title separates brand from keywords.** `Tallshot — Full Page Screenshot & Editor`. Keywords are in the descriptor, recall is in the brand.
- **Primary phrases appear naturally in the first 200 characters**, which is what search indexes most heavily and what a shopper reads before clicking.
- **No stuffing, no competitor brands.** Both are policy violations, and the reference product's 2.8 rating shows the tactic does not save a weak product anyway.
- **Screenshot 1 does the selling.** Most shoppers never scroll past image two.

### 3.2 Target phrases

| Priority | Phrase | Why we can win it |
|---|---|---|
| 1 | full page screenshot | Highest intent. Contested, but our title matches exactly. |
| 2 | screenshot entire webpage | Same intent, less contested |
| 3 | scrolling screenshot | Describes the mechanism users search for |
| 4 | webpage to PDF | Distinct job; our PDF is free and paginated |
| 5 | blur screenshot / redact screenshot | **Low competition, high value.** The market leader has no redaction at any price. |
| 6 | screenshot without watermark | Purchase-intent phrase; we satisfy it absolutely |
| 7 | screenshot no account | Same |

Phrases 5–7 are the wedge. We will not outrank an 11M-user incumbent on phrase 1 in year one; we can plausibly own 5–7 within weeks because almost nobody competes on them.

### 3.3 Update cadence

Recency is a ranking input and a trust signal. Ship a real, changelog-documented update every 3–4 weeks for the first six months. Never a version bump with no substance — users read changelogs, and empty updates read as manipulation.

---

## 4. Launch sequence

### Week 0 — Preparation (before submission)

- [ ] Extension approved and live
- [ ] Privacy policy live on GitHub Pages
- [ ] Repository public, README complete
- [ ] All five screenshots final
- [ ] Comparison content drafted but **not yet published**

### Week 1 — Quiet launch

Deliberately quiet. The first week is for finding the defects that only real websites expose.

- Publish. Do not announce.
- Personally test against 30+ real sites across the archetypes in [testing-report.md](testing-report.md).
- Fix anything broken and ship 1.0.1 if needed.
- **Gate:** zero P0 defects before any promotion.

Launching loudly on day one, before a single stranger has used the product, is how a category entrant collects its permanent one-star reviews.

### Weeks 2–3 — Community seeding

Where the audience actually is, contributing as a builder rather than dropping links.

| Channel | Approach |
|---|---|
| **r/chrome, r/productivity** | A "I built this because sticky headers kept repeating in my screenshots" post. Technical, honest about limitations, links in a comment rather than the body. |
| **r/webdev, r/Frontend** | Lead with the engineering: the 2-captures-per-second quota, the sticky-freeze approach, why the actual scroll position matters. Developers reward the *explanation*, not the pitch. |
| **Hacker News (Show HN)** | "Show HN: Tallshot — full-page screenshots with no host permissions". HN's audience specifically values the zero-permission architecture and MIT source. Post once, answer every comment, never argue. |
| **Support/CS communities** | The redaction workflow — capture, blur customer details, copy to clipboard. This is Priya's exact job, and it is a product demo rather than an ad. |

**Rules for every community post:**
1. Never post a bare link.
2. Name the limitations before someone else does.
3. Answer every reply, including hostile ones, without defensiveness.
4. Never post the same text to two communities.
5. If a moderator says it is off-topic, delete it and move on.

### Week 4 — Product Hunt

Launch once the product has real users and a handful of reviews — a Product Hunt launch with zero social proof converts poorly and cannot be repeated.

- **Tagline:** "Full-page screenshots that actually work — free, local, no account"
- **First comment:** the maker story, honestly told: what was broken in the category and what we did about it
- **Assets:** the five store screenshots plus a short screen recording of a genuinely long page capture
- **All day:** answer every comment personally
- **Target:** top 10 of the day; a modest, achievable objective that produces a durable backlink and a credibility badge

### Weeks 5–12 — Content and compounding

Content that would be worth reading even if we sold nothing. Each piece targets a real search query and demonstrates competence rather than asserting it.

| Piece | Query it serves |
|---|---|
| Why your full-page screenshot has the header repeated five times | The category's most-searched failure |
| How Chrome's 2-captures-per-second limit shapes every screenshot extension | Developer-audience credibility, genuinely under-documented |
| How to redact a screenshot properly (and why blur is not always enough) | Support/compliance audience; honest about blur vs pixelate |
| Full-page screenshot tools compared, including where each one is better | Comparison intent; credibility comes from conceding real advantages |
| Turning a long web page into a readable PDF | "webpage to PDF" intent |

The comparison piece must name where competitors beat us — GoFullPage's handling of inner scrollable elements is genuinely excellent. A comparison that finds the author's own product best on every axis is read as an advertisement and converts like one.

### Weeks 6–24 — Short-form video

Low effort, occasionally high leverage. Every clip is under 40 seconds and shows a real problem being solved.

| Idea | Hook |
|---|---|
| Sticky header repeat, side by side | "Why does my screenshot have the menu bar five times?" |
| Redact a support ticket in 15 seconds | "Before you paste that screenshot into the ticket…" |
| A 9,000px page captured in one image | The visual is the whole pitch |
| The permission screen with no warning on it | "This is what a screenshot extension should ask for" |
| Long article to paginated PDF | "Save any article as a real PDF" |

**X / Twitter:** build-in-public posts — a defect found and fixed, a capture-engine detail, a user's problem solved. Never a bare "check out my extension".

---

## 5. Review generation

Reviews are the ranking lever *and* the trust lever, and they are the one thing money cannot buy legitimately.

### The mechanic

A single, quiet, non-blocking prompt in the **options page only** — never the popup, never over a capture — that appears once, when:

- the user has completed **at least 10 successful captures**, and
- it has been **at least 7 days** since install, and
- no capture has failed in their last 5 attempts, and
- they have never dismissed it before.

If dismissed, it never returns.

**Why so conservative.** Asking on install is asking a stranger to vouch for you. Asking after ten successes is asking someone who has evidence. The former produces low ratings and uninstalls; the latter produces the reviews that lift ranking.

> **Implementation note:** this counter does not exist in 1.0.0, because it requires storing a usage count and the launch build deliberately stores nothing beyond settings. It is scheduled for 1.1 as a single local counter in `chrome.storage.sync`, disclosed in the changelog and the privacy policy. Until then we ask for reviews only in community posts and the README.

### Responding to reviews

Every review gets a reply within 48 hours.

| Review | Response |
|---|---|
| Positive | Short, specific thanks. No upsell. |
| A feature request | Say yes or no honestly, with the reason. If yes, name the version. |
| A bug report | Ask for the site, reproduce it, fix it, then **reply again with the version number that fixes it** |
| Unfair or mistaken | Correct the record politely, once. Never argue. Never ask for the review to be changed. |

A one-star review that ends with "fixed in 1.0.3, thanks for reporting" converts more shoppers than a five-star review with no reply. It is public evidence that the developer is present.

### What we will never do

Incentivised reviews, review swaps, fake accounts, asking friends to rate, or gating a feature behind a rating. All are policy violations, all are detectable, and all risk the removal that just cost the category leader 11M users.

---

## 6. The quality gate (non-negotiable)

**Growth spend on a product with a broken capture engine converts installs into one-star reviews, which permanently damages store ranking.** Ranking recovers slowly; a bad early rating average is arithmetically hard to escape.

Therefore, at every checkpoint:

```
IF rating < 4.0  OR  any P0 defect open
    → STOP all promotion
    → fix the product
    → resume only when the gate clears
```

The order is fixed: **fix, then grow.** Never the reverse.

---

## 7. Measurement

We collect **no in-product analytics** — that is the deliberate trade that makes the privacy claim true. Everything below comes from the Chrome Web Store developer dashboard and public sources.

| Metric | Source | Target at week 24 |
|---|---|---|
| Weekly installs | Dashboard | 250+/week |
| Total users | Dashboard | 5,000 |
| Uninstall rate | Dashboard | < 15% in first 48h |
| Rating | Dashboard | ≥ 4.5 |
| Review count | Dashboard | ≥ 40 |
| Impressions → installs | Dashboard | ≥ 12% |
| GitHub stars / issues | GitHub | Directional interest signal |

**What we knowingly give up:** feature-level usage data, funnel instrumentation, cohort analysis. We cannot see which tool is most used or where users get stuck. We accept slower, blunter product learning in exchange for a privacy claim no competitor can match. Qualitative signal — issues, reviews, community replies — has to do the work instead, which means reading every single one.

---

## 8. Checkpoints

Each is a **stop condition**, not a milestone.

| Week | Users | Gate to clear before continuing |
|---|---|---|
| 1 | 25 | Zero P0 defects. Tested against 30+ real sites. |
| 2 | 100 | Rating ≥ 4.0. Every review answered. |
| 4 | 500 | Ranking on page 1 for at least one long-tail phrase. First 10 reviews in. |
| 8 | 1,500 | Uninstall rate < 15%. No unresolved P1 defects. |
| 12 | 2,200 | ≥ 20 reviews at ≥ 4.5. Two content pieces ranking. |
| 16 | 3,000 | Organic installs exceed campaign-driven installs. |
| 20 | 4,000 | Update cadence sustained. Rating holding ≥ 4.5. |
| **24** | **5,000** | **PMF gate cleared → begin Pro development** ([free-vs-pro-plan.md](free-vs-pro-plan.md) §6) |

---

## 9. Risks

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| GoFullPage restored, attention window closes | **High** | Medium | Never position as a substitute. Compete on the editor and redaction, which it lacks at any price. The window is for discovery; retention is the actual plan. |
| Store review rejection or delay | Medium | High | Compliance audited and build-enforced ([compliance.md](compliance.md)). Fix and resubmit within 48h. |
| A capture defect on a popular site class | Medium | High | Archetype test matrix, typed errors, fast patch cadence. Treat every bug review as a P1. |
| Community post received as spam | Medium | Low | Contribute before posting; lead with the engineering; accept moderation without argument. |
| Growth stalls between 1,000 and 2,000 | Medium | Medium | Diagnose before spending: low impressions is an SEO problem, low conversion is a listing problem, low retention is a product problem. Each has a different fix. |
| A well-funded competitor copies the free-editor position | Low | High | Our moat is the absence of a business model to protect. They must sacrifice revenue; we sacrifice nothing. |
| Success outruns capacity to support | Low | Medium | A good problem. Triage by defect severity; ship fixes, not feature requests. |

---

## 10. After 5,000

The plan does not end at the number; the number is a gate.

1. **Confirm PMF** against every condition in [free-vs-pro-plan.md](free-vs-pro-plan.md) §6 — not the user count alone.
2. **Discover the Pro set from demand**, not from the guesses in that document. If 5,000 users repeatedly ask for something not on the list, the list is wrong.
3. **Port to Edge and Firefox.** Edge is nearly free — same platform, and GoFullPage's own outage showed users will move browsers for a tool they rely on.
4. **Keep the free tier growing.** Pro funds free development; it does not replace it.

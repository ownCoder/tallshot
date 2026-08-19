# Roadmap — Tallshot

**Owner:** Product Manager (internal)
**Version:** 1.0 · 19 August 2026

---

## 1. Milestones

### ✅ M0 — Research and strategy (complete)

| Deliverable | Status |
|---|---|
| Market research: competitors, pain points, the August 2026 disruption | ✅ |
| Product strategy: audience, personas, positioning, monetisation | ✅ |
| Name selection and trademark clearance | ✅ |
| Brand system: palette, typography, logo, voice | ✅ |
| UX plan: flows, wireframes, states, accessibility | ✅ |
| Technical architecture | ✅ |
| Free/Pro tier boundaries and the technical seam | ✅ |

### ✅ M1 — Version 1.0.0 (complete — ready to submit)

| Deliverable | Status |
|---|---|
| MV3 extension: service worker, popup, editor, options | ✅ |
| Capture engine: full page, visible, region | ✅ |
| Lazy-load pre-pass, sticky freezing, quota-aware pacing, exact restoration | ✅ |
| Editor: 12 tools including blur and pixelate redaction | ✅ |
| Export: PNG, JPG, WebP, PDF (original writer), clipboard | ✅ |
| Filename templating with sanitisation | ✅ |
| Typed errors with actionable messages | ✅ |
| Icons and store assets generated from source | ✅ |
| Privacy policy and terms published to GitHub Pages | ✅ |
| Automated compliance audit and runtime test suite (89 checks) | ✅ |
| Complete documentation set | ✅ |
| Submission package assembled | ✅ |

### ⬜ M2 — Launch and stabilise (weeks 1–4)

| Deliverable | Gate |
|---|---|
| Store approval | — |
| 30+ real-site verification pass | Zero P0 defects |
| 1.0.x patches for anything real users hit | Rating ≥ 4.0 |
| Community seeding (Reddit, HN, support communities) | Only after the defect gate clears |
| Product Hunt launch | Only with real users and reviews in place |
| Every review answered within 48h | Ongoing |

**Exit:** 500 users, rating ≥ 4.0, no unresolved P1.

### ⬜ M3 — Version 1.1 (weeks 5–10)

Features chosen from what real users actually ask for, not from this list. Current candidates:

| Candidate | Rationale |
|---|---|
| Review prompt (10+ successful captures, 7+ days, never repeated) | Required for the ranking loop. Needs a local usage counter — disclosed in the changelog and privacy policy. |
| Capture delay per-site memory | Heavy sites need a longer settle; asking once is better than asking every time |
| Additional colour swatches and a custom colour input | The most predictable annotation request |
| Arrow style variants (straight, curved, double-headed) | Common in support workflows |
| "Copy as PNG" from the popup without opening the editor | Removes a step from the highest-frequency workflow |
| Improved inner-scrollable-element handling | The one place GoFullPage is genuinely better than us |

### ⬜ M4 — Version 1.2 (weeks 11–16)

| Candidate | Rationale |
|---|---|
| Edge Add-ons port | Near-free — same platform. GoFullPage's outage proved users will switch browsers for a tool they rely on. |
| Localisation: German, Spanish, French, Portuguese, Japanese | Only if install data shows real demand. Properly translated UI, never machine-translated metadata. |
| Annotation defaults remembered per tool | Small, high-frequency quality-of-life win |
| Export presets | Recurring request in support workflows |

### ⬜ M5 — Product-market fit gate (week 24)

Not a feature milestone — a decision point. Pro development begins only if **every** condition holds:

| Condition | Threshold |
|---|---|
| Users | ≥ 5,000 |
| Rating | ≥ 4.5 |
| D30 retention | ≥ 25% |
| Open P1 defects | 0 |
| Recurring feature requests identified | ≥ 3 |

If the gate fails, the correct response is to fix the product, not to monetise it. Details in [free-vs-pro-plan.md](free-vs-pro-plan.md) §6.

### ⬜ M6 — Version 2.0 / Pro (post-gate)

Only after M5 clears. Candidates in [free-vs-pro-plan.md](free-vs-pro-plan.md) §3: scheduled capture, batch capture, OCR text extraction, optional end-to-end-encrypted cloud sync, custom watermark, annotation presets, capture history.

Implementation is confined to `getTier()` and `activate()` in `src/lib/license.js`. **No existing call site changes, and no free feature moves behind the paywall.**

### ⬜ M7 — Firefox port (opportunistic)

Requires a `browser.*` compatibility shim and event-page rather than service-worker semantics. Scheduled only when Chrome and Edge are stable and the maintenance cost is affordable.

---

## 2. Timeline

```
2026                                              2027
Aug     Sep        Oct        Nov        Dec       Jan        Feb
│       │          │          │          │         │          │
├─ M1 ✅ ship 1.0.0
│
└──┬────┤ M2  Launch & stabilise        →  500 users, ≥4.0
   │    │
   │    └──┬──────┤ M3  v1.1            →  1,500 users
   │       │      │
   │       │      └──┬───────┤ M4  v1.2 →  3,000 users
   │       │         │       │
   │       │         │       └───────┬──────────┤ M5  PMF gate → 5,000
   │       │         │               │          │
   │       │         │               │          └── M6  Pro (only if gated)
   │       │         │               │
   └───────┴─────────┴───────────────┴─── Continuous: reviews answered,
                                          defects patched, docs updated
```

Dates are targets, not commitments. Every milestone is gated on quality, and a gate that does not clear delays the next milestone rather than being waived.

---

## 3. Dependencies

| Dependency | Type | Risk if it fails | Contingency |
|---|---|---|---|
| Chrome Web Store approval | **Blocking** | Nothing ships | Compliance audited and build-enforced; fix and resubmit within 48h |
| GitHub Pages availability | **Blocking** | Privacy policy URL dead → listing rejected | Static HTML; can be re-hosted anywhere in minutes |
| `chrome.tabs.captureVisibleTab` stability | Critical | Core capture breaks | Isolated behind one module boundary; a change is a contained rewrite |
| MV3 platform stability | Critical | Architectural rework | Already on MV3; no deprecated APIs used |
| Chrome canvas limits | Moderate | Taller pages need more downscaling | Already detected and handled explicitly |
| Developer time | Ongoing | Slower cadence | Zero infrastructure cost means the project survives low-activity periods |
| **No third-party runtime dependencies** | — | — | Zero supply-chain surface by construction |

---

## 4. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Store rejection or removal | Low | **Critical** | Minimum permissions, single purpose, all-original assets, published policy, build-enforced audit. §7 of [compliance.md](compliance.md) documents provenance specifically because a copyright dispute is what removed the category leader. |
| R2 | Capture engine fails on a popular site class | Medium | High | Archetype test matrix, browser-driven regression suite, typed errors, fast patches |
| R3 | GoFullPage restored, discovery window closes | **High** | Medium | Never positioned as a substitute; compete on the editor and redaction it lacks at any price |
| R4 | Growth stalls below 5,000 | Medium | Medium | Checkpoint gates force a diagnosis — impressions, conversion or retention — before more effort |
| R5 | Chrome changes or restricts capture APIs | Low | High | Capture logic isolated to `src/capture` + `stitch.js` |
| R6 | A competitor copies the free-editor position | Medium | High | Our moat is having no business model to protect; they must sacrifice revenue |
| R7 | Support load exceeds capacity | Low | Medium | Triage by severity; ship fixes over features; the docs answer common questions |
| R8 | Trademark challenge to "Tallshot" | Low | High | Clearance search documented. A formal registry search precedes any significant marketing spend — tracked below. |
| R9 | A security defect in the injected agent | Low | High | Agent reads geometry only; closed shadow DOM; no page content read; security review each release |

---

## 5. Open items carried forward

Things deliberately not done in 1.0, recorded so they are not forgotten.

| Item | Target | Note |
|---|---|---|
| Formal USPTO/EUIPO trademark search | Before paid marketing | The clearance in [project-overview.md](project-overview.md) §3 is a public search, not a legal opinion |
| Review prompt with local usage counter | 1.1 | Needs a stored count; must be disclosed in the changelog and privacy policy first |
| Inner scrollable element capture | 1.1–1.2 | The one area where GoFullPage is genuinely better |
| Localisation | 1.2 | Only with install data proving demand; properly translated UI, never metadata spam |
| Edge Add-ons submission | 1.2 | Same package, separate listing |
| Firefox compatibility shim | Post-1.2 | Requires event-page semantics |

---

## 6. Release checklist

Run before every version, not just this one.

- [ ] `npm run verify` passes with zero failures
- [ ] `npm run test:runtime` passes with zero failures
- [ ] Version bumped consistently in `manifest.json`, `package.json`, `src/lib/constants.js`
- [ ] `CHANGELOG.md` entry written, with real substance
- [ ] Any new permission justified in `compliance.md` — otherwise the audit fails the build
- [ ] Privacy policy re-checked if data handling changed at all
- [ ] Screenshots regenerated if the UI changed
- [ ] Manual pass over the archetype matrix in [testing-report.md](testing-report.md) §4.1
- [ ] `npm run release` produces the ZIP and assembles `Store Upload/`
- [ ] ZIP loaded unpacked and smoke-tested before upload
- [ ] Git tag `vX.Y.Z` pushed
- [ ] `docs/progress.md` updated

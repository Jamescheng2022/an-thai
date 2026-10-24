# Source and editorial evidence — pile-integrity-test-report-review-checklist

- Content ID: ANTHAI-WEB-EDITORIAL-20261017-01; reuse of 2026-10-18 v2 editorial candidate, not a new article.
- Compiled/rechecked: 2026-10-24 (Asia/Bangkok).
- Status: DRAFT ONLY. No independent engineering/Codex acceptance for this candidate, no real preview article, no production publication.
- Target lane: Jamescheng2022/an-thai, existing PR #14 branch content/daily-insights.
- Review audience: Thai project owner representative, contractor, field/testing engineer reviewing a low-strain integrity report.
- Buyer question: A “pass” conclusion looks inconsistent with a questionable waveform—what supporting evidence and limitations should be checked before an engineering decision?
- Scope: low-strain impact integrity screening; not a load capacity certification, defect diagnosis, approval promise, or contract acceptance rule.
- Original: /mnt/data/anthai-pit-report-review-v2-20261018.md (outside repo); drafted October 17, revised October 18; revised here to project JSON and clarified official source status.
- Current source 1: ASTM D5882-16 official page, https://store.astm.org/d5882-16.html (verified 2026-10-24): standard withdrawn 2025, no replacement; public scope/significance notes approximation, context and inability to determine bearing capacity. Do not imply D5882-16 is current Thai-required standard.
- Current source 2: ILAC G8:09/2019 (official catalog), https://ilac.org/publications-and-resources/ilac-guidance-series/ (verified 2026-10-24): decision rules/conformity guidance for laboratories, not pile acceptance specification or evidence of AN-THAI accreditation.
- Project-dependent assumptions: raw-data access rights, contractual standard, Thai sign-off rules, test method selection, required report contents, safe site access. All must be checked by the responsible parties.
- No real customer stories, jobsite photos, measured traces, numerical wave velocities, loads, invented quality scores or acceptance thresholds.

## Original visuals (programmatic SVG, not photos)
All five files are original ChatGPT-created non-scale explanatory SVGs for this article, created 2026-10-24. No third-party image material, source-photo license, logo impersonation, or client data; intended for editorial illustrative use only. Render raster variants only if independently verified. SVG has no scripts, network resources or external fonts.

| Path | px / viewBox | role | alt and caption |
| --- | --- | --- | --- |
| `assets/images/insights/pit-report-review-cover.svg` | 1200 × 680 | cover | Conceptual engineering evidence review. Caption: not a real project or recorded test trace. |
| `assets/images/insights/pit-report-review-scope.svg` | 720 × 930 | body 1 | What low-strain response can inform vs. cannot establish; based on ASTM scope. |
| `assets/images/insights/pit-report-review-traceability.svg` | 720 × 1010 | body 2 | Pile ID → field record → setup → raw evidence → signed interpretation. |
| `assets/images/insights/pit-report-review-triage.svg` | 720 × 1020 | body 3 | Context-first workflow for an unusual trace; no fictional thresholds. |
| `assets/images/insights/pit-report-review-handover.svg` | 720 × 1080 | body 4 | Six-item engineering review evidence pack. |

## Technical handoff, controls and unfinished gates

- JSON: `drafts/insights/pile-integrity-test-report-review-checklist.json` (excluded from publication by the existing Insights build); DO NOT move into `content/insights` until final engineering/visual/language review and publication approval.
- Cover=1, distinct body visuals=4; total=5. Each section embeds the actual SVG relative path with alt/caption/declaration and accurate intrinsic viewBox/px dimensions.
- Visual styles use editorial diagrams rather than fabricated field photography. Check 320/390 px labels in real browser on article preview before release; vector clarity alone is not a mobile visual PASS.
- Four diagrams answer four distinct questions (test scope, record chain, interpretation workflow, evidence pack); none is a duplicate recolor or crop.
- CTA: Article prose specifies the verified engineering-services route `/contact.html?type=engineering#enquiry-form`. Current generic template CTA button still points to `/contact.html`; have original PR #14 implementer add safe per-article route selector or confirm generic route acceptance in existing review chain.
- Sources are visible plaintext URLs because the current escaped-JSON renderer has no safe citation-link schema. Original PR implementer should evaluate minimal allowlisted editorial source links; do not inject unsafe raw HTML into paragraphs.
- Framework commit `d0c13a90b0147cadead267125d36680675abda42`: AGY author/Claude Lead reviewed the figure renderer and localization; the GitHub Codex independent final review was still pending when this candidate work started.
- No paid subscriptions, emails, CRM, production merges, DNS, credentials or existing Review/P2 bypass.
- Required before production: independent final factual/technical review, English proofing, SVG visual review, build and localized index check, mobile browser QA, approved move to content, exact-SHA Codex review as required, original publisher deployment, public article/each figure/CTA readback, archived final receipt. No Thai/Chinese article translation is claimed.

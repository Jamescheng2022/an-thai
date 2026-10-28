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

## 2026-10-26 continuation — mobile readability and editorial routing (original content ID)

- Primary sources rechecked 2026-10-26: ASTM D5882-16 officially withdrawn 2025, no replacement, low-strain signals do not establish bearing capacity (https://store.astm.org/d5882-16.html); ILAC G8:09/2019 provides general laboratory conformity decision-rule guidance, not a pile acceptance standard (https://ilac.org/publications-and-resources/ilac-guidance-series/).
- Retained original 1 cover plus 4 desktop explanatory SVGs and the existing English article, all still draft. Added four new purpose-built 400px mobile SVG variants with larger readable text. These represent the SAME four concepts and do NOT count as four more body images. No site photographs, measured signals or manufacturer images. All source images are original programmatic conceptual visuals.
- Structured article fields `sections[].links` and `cta_route=engineering` now clarify the intended clickable official references and correct engineering enquiry route; the current published renderer DOES NOT consume those extra fields and must not be reported as passing link/CTA acceptance yet.
- The production Insights renderer also applies `max-height:540px` to full-height desktop diagrams. The original approved frontend implementer must extend its renderer to validate/serve the optional mobile asset via `<picture>`, render HTTPS source links with escaping, route the fixed engineering CTA safely, and remove the article-only figure height cap. No framework/production modification is made in this content-only candidate.
- Still **DRAFT ONLY / not independently reviewed / not previewed / not published**. Claude Lead and authorized GitHub Codex review must bind the final source+asset SHA, and mobile browser checks at 320/390/820/1363 must verify readability, real rendered figures and source links before the original publisher promotes the file out of drafts. Article ID ANTHAI-WEB-EDITORIAL-20261017-01 does not change. PR14 already merged and is not a live article publication request. PR12/PR13 untouched. This is an existing content continuation, not an extra publishing actor.

## 2026-10-27 read-only continuation / exact publication gate

- **Current PR:** [#17](https://github.com/Jamescheng2022/an-thai/pull/17), branch `content/pit-report-mobile-20261026`, original article/content ID unchanged. Earlier references to PR #14 describe the origin; PR #14 was merged as the **framework**, not this article. No replacement PR, writer or publishing lane was created.
- **Current main / deployment evidence:** GitHub `main` was `fee1eace0733445df728c46951ad18fb376d28b9` (PR #16 merge, checked 2026-10-27); Vercel production `dpl_7G5E3TgnF8LhdZsi1L6qvpc31nvf` reports READY at that same SHA. `content/insights/` on main contains only `.gitkeep`; READY alone is not a public-article check.
- **Actual public read-back (2026-10-27):** `https://an-thai.com/insights.html` displays “Articles will appear here once published”; `https://an-thai.com/insights/pile-integrity-test-report-review-checklist.html` returns HTTP 404. Thus *published articles from this candidate = 0*. Public article assets and mobile article QA cannot be accepted yet.
- **Actual draft assets:** Complete `drafts/insights/pile-integrity-test-report-review-checklist.json` on this branch with one cover, four distinct desktop body SVGs and four format variants for those SAME four concepts. All nine SVGs were read as Git text blobs: declared pixel dimensions/viewBox exist; no `<script>`, `onload` or linked remote image resources were found in this text-only inspection. This is **not** a browser-render, contrast/legibility or independent artwork review.
- **Primary-source spot-check (2026-10-27):** official ASTM listing `https://store.astm.org/d5882-16.html` still states D5882-16 was withdrawn in 2025 with no replacement and cannot determine bearing capacity. Official ILAC guidance catalog `https://ilac.org/publications-and-resources/ilac-guidance-series/` still lists G8:09/2019 as general decision-rule/statement-of-conformity guidance. Neither is represented as mandatory Thai project acceptance law; this public-source check is not independent project engineering approval.
- **Confirmed renderer gap on main:** `scripts/build-insights.py` renders only desktop `<img>` body figures, ignoring `mobile_image`, `sections[].links`, and per-article `cta_route`/`cta_label`/`cta_note`. `templates/article.html` still has a generic `/contact.html` CTA. The new fields alone therefore do not achieve public responsive figures, clickable source references, or engineering-route CTA. Existing figure CSS max-height also needs narrow-screen verification. Original frontend implementer should safely validate local asset paths/intrinsic dimensions, escape HTTPS references, allowlist fixed business CTA routes and preserve draft exclusion, with independent Codex review on final code.
- **Date integrity:** article JSON currently carries `date: 2026-10-24` while still draft-only. Original editor/publisher should establish the truthful date at initial publication rather than interpreting the draft timestamp as a verified public publication date.
- **Still OPEN:** original frontend implementer correction and tests; independent exact-version engineering and code reviews; article-page visual/functional QA at 320/390/820/1363; authorized promotion from `drafts/` to `content/`, merge/deploy, public article/body/all image/source/CTA read-back and final archived release receipt. PR #12/#13, DNS, email and secrets are out of scope.

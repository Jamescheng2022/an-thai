# AN-THAI Insights editorial review evidence — pit-pretest-site-readiness-owner-checklist

**Status: DRAFT ONLY — NOT REVIEWED OR AUTHORIZED FOR PRODUCTION.** Evidence assembled 2026-11-07 Bangkok. This topic is different from the published PIT *report/waveform review*: it is a pre-test handover/checklist for Thailand project owners, main contractors and QA engineers.

## Reader / decision / caveats

The site team needs to identify which piles are tested, what as-built and installation history exists, whether pile heads can be accessed safely, and who reviews any uncertain trace **before booking the testing crew**. Suitable intended scope: low-strain concrete foundation continuity screening where technical conditions permit. Not a bearing-capacity test; not a designed safety or structural test procedure; capped/very short or unusual piles need case-specific judgment. This guide does not claim a particular Thai permitting clause, accreditation or contract requirement. Engineer/contract/authority determine final testing and acceptance basis.

## Dated source and claim register (reviewed 2026-11-07)

- Pile Dynamics PIT official product page, https://www.pile.com/products/pit/ — **manufacturer technical description:** low-strain impact with sensor/hammer, indicative section changes; manufacturer statement, not site certification.
- PDI official FAQ, https://www.pile.com/resources/faqs/faq-can-results-pit-tests-confirmed-comparing-piling-records/ — recommends reading recorded PIT responses together with installation records, ground/soil profile and neighbouring results; method-specific engineering context, not a mandated Thai acceptance rule.
- PDI official FAQ, https://www.pile.com/resources/faqs/faq-can-pile-integrity-tester-used-evaluate-length-defects-piles-supporting-existing-structures/ — access and foundation-type qualifications require engineer case review.
- PDI published example sample specification https://www.pile.com/download/sample-specifications/lostrain.pdf — pile-head surface/access and curing considerations as **example only**; no fixed curing period or percentage is asserted as universal in the draft.
- ASTM official catalog, https://store.astm.org/d5882-16.html — ASTM D5882-16 **withdrawn 2025**, no replacement listed; any project reference to this edition requires qualified project-specific contractual/authority review. No proprietary full clauses reproduced.

All document/role workflow steps are the editorial author's **practical suggestions**, not quotations of binding regulations. No invented field data, test outcomes, pile design/capacity, exact standards clauses or contractual duties. Full article text (including FAQ/CTA) is in `drafts/insights/pit-pretest-site-readiness-owner-checklist.json`.

## Actual visual inventory and provenance

Article word count using repository-equivalent pattern at drafting: **1048 English words** (verify by actual script); 3 different informative inline graphics/photos, threshold is 3 for 601–1200 words. Distinct cover does **not** count as inline. `source_visual_ids` are a human-auditable declaration, **not** image recognition. All repository bytes were fetched and checked against blobs.

| Role | Repository asset | Intrinsic dimensions | Source, restrictions |
| --- | --- | --- | --- |
| Cover, photographic | `assets/images/insights/pit-team-cover.webp` | 1000×604 | **Previously existing actual company-brochure field-personnel photography**, copied by existing Git blob SHA `f5110ce4e0188e1c8957b36ba0b151bff29ad44a` from original PR #20 (not newly shot). Image includes two personnel/documentation panels. Original source quality approximately 480×290 before enlargement; no new detail; project/date/operator not independently verified. Subject IDs: `brochure-pit-field-documentation`, `brochure-pit-field-team`. |
| Inline 1, document guide | `assets/images/insights/pit-pretest-handover-five-files.svg` | 720×990 | New original editorial vector checklist; conceptual, not a test record or project-required form. |
| Inline 1 mobile variant | `assets/images/insights/pit-pretest-handover-five-files-mobile.svg` | 480×1120 | Original smaller-screen SVG redraw of same checklist. **Not a separate fourth inline visual**. |
| Inline 2, real contextual photograph | `assets/images/insights/pit-field-sensor.webp` | 413×500 | **Previously existing actual company-brochure pile-head sensor photograph**, copied from PR #20 Git blob SHA `9796afbec153c5455805b05d8b5770158c2fca5c`; low-resolution existing reference, project/date/operator and test reading not independently verified. Subject ID `brochure-pit-sensor`; does not overlap cover personnel source IDs. |
| Inline 3, role diagram | `assets/images/insights/pit-pretest-roles-handoff.svg` | 720×1030 | New original process/responsibility diagram; no contract allocations implied. |
| Inline 3 mobile variant | `assets/images/insights/pit-pretest-roles-handoff-mobile.svg` | 480×1170 | Original mobile SVG redraw of the same process diagram. Not separately counted. |

**Totals embedded in machine-readable draft:** 1 raster photographic cover, 1 inline genuine photographic reference, 2 distinct original informative SVG inline figures, 2 matching mobile SVG variants. **All six physical image assets are actually staged on GitHub** (not only links/hashes). First 2026-11-07 intermediate draft featured a four-SVG illustration set; it was subsequently refined to meet the more stringent *photo-first* gate proposed in PR #20. The unused prototype cover SVG and pile-head SVG/mobile pair are removed from this PR's final tree, not counted as visuals. This article reuses already authorized material from the original company brochure, **not a new company project claim**. The cover is reused from an existing PIT article, so the original Lead should judge cross-article editorial originality explicitly before publication.

All figures provide `image`, `image_alt`, `caption`, `declaration`, numeric dimensions, and distinct `source_visual_ids`; the remaining two SVGs also provide `mobile_image`, `mobile_width`, `mobile_height`. The actual image byte/code sources are in the repository. All SVGs have intrinsic width/height, viewBox and accessible title. The original photo source resolution is limited, no AI photo generation has occurred.

## Gates / limitations

1. Keep the JSON in `drafts/insights/` (the current renderer excludes drafts); do not move to `content/insights/` without independent content/technical review and confirmed ownership.
2. Independently run build, `check-insights.py`, `check-editorial-photo.py` **after** existing PR #20 lands, `check-site.py`, `check-locales.py`, and interactive/mobile 320/390/820/1363 screenshots; reviewer to check no caption clipping, real image loading, no horizontal overflow. Current remote blob/JSON inspection is not a full build or mobile acceptance.
3. Do not assume PR #20 is merged; its proposed photo gate is currently on a **different Draft PR**, not in main. If PR #20 changes, rebase/revalidate PR #24 before release.
4. Independent GitHub Codex exact-final-SHA review, original Claude Lead 0488dffd final editorial sign-off, authorized publisher merge/deploy, post-release production readback all remain pending. Photo-scope review should verify the image bytes and distinctness, not trust metadata alone.
5. Neither this draft nor the image references are new production article URLs, contract/quotation evidence or permission to send emails, alter DNS/secrets, bypass SSO or submit customer forms.

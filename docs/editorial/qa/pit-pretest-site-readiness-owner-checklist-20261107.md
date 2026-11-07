# Editorial review packet — pit-pretest-site-readiness-owner-checklist

Status: **DRAFT ONLY / not publishable / independent review pending**. Reviewed sources: 2026-11-07. Writer: existing AnThai daily editorial lane; no new agent/publisher/schedule. This article is purposely stored under `drafts/insights/`, excluded from production build. The existing PR #20 photo-remediation work is separate and untouched by this new distinct topic; the already published PIT-report checklist addresses post-test waveform review whereas this proposed article addresses **pre-test client/site readiness**.

## Buyer problem / applicability

Audience: Thai owner-representatives, main contractors and on-site QA engineers. Decision: what documents and working conditions to prepare before requesting a low-strain PIT visit; no capacity assessment, site-specific test plan or acceptance promise. Scope: suitable concrete piles in ordinary low-strain top-access context; short, capped, steel/open-section and atypical piles require separate evaluation.

## Verifiable primary/source claims (check date 2026-11-07)

| Claim | Source | Category / caveat |
| --- | --- | --- |
| PIT records low-strain impact response and concerns integrity, not bearing capacity | https://www.pile.com/products/pit/ | Manufacturer's method/product statement, not a project approval |
| Compare PIT traces with installation records, soil profile and neighbouring piles | https://www.pile.com/resources/faqs/faq-can-results-pit-tests-confirmed-comparing-piling-records/ | Manufacturer technical FAQ / contextual guidance |
| More complex access may need specialized instrumentation and engineer-selected method | https://www.pile.com/resources/faqs/faq-can-pile-integrity-tester-used-evaluate-length-defects-piles-supporting-existing-structures/ | Manufacturer FAQ / case-dependent |
| ASTM D5882-16 withdrawn 2025, no replacement listed | https://store.astm.org/d5882-16.html | Official ASTM catalog status; no licensed text reproduced; contractual edition remains project-specific |

No numerical pile capacity, soil strength, test interval, ASTM clause, local permit requirement, load level or invented engineering measurement is asserted. Site checklist and roles graphic are the author's practical workflow suggestions, **not standard clauses** or site instructions. The project engineer must approve actual scope and procedure. 2026-11-07 publication date is **draft authoring date only** until genuine release.

## Image manifest / provenance

All four SVG assets are newly authored original deterministic vector graphics within this deliverable, not external copies, licensed third-party photographs, client documents, actual AN-THAI projects, or AI-generated photographic scenes. Original code is the SVG source bytes. Cover and all three body images depict **different concepts** (editorial readiness cover, documents, site head readiness, roles). The explanatory illustrations are unscaled and non-engineering; no numerical measurements. Color contrast and aspect ratios were chosen for narrow-screen reading; **real 320/390/820/1363 browser screenshot acceptance still required**.

| Usage | Asset | Intrinsic px | Content | Rights |
| --- | --- | --- | --- | --- |
| cover | `assets/images/insights/pit-pretest-owner-cover.svg` | 1100×700 | Illustrated editorial guide cover with document checklist and conceptual field-test symbol | AN-THAI original editorial SVG; generated in-house |
| inline 1 | `assets/images/insights/pit-pretest-handover-five-files.svg` | 720×990 | Five-part previsit document checklist for pile testing | AN-THAI original editorial SVG; generated in-house |
| inline 2 | `assets/images/insights/pit-pretest-pile-head-readiness.svg` | 720×980 | Conceptual diagram showing clear access, suitable pile head, and engineer-selected measuring positions | AN-THAI original editorial SVG; generated in-house |
| inline 3 | `assets/images/insights/pit-pretest-roles-handoff.svg` | 720×1030 | Pre-test responsibility handoff for owner, contractor, testing crew, and design engineer | AN-THAI original editorial SVG; generated in-house |

All inline images contain `image_alt`, `caption`, `declaration`, dimensions and unique `source_visual_ids` in the JSON. SVGs have intrinsic width/height, viewBox, title and aria-label. They are part of the JSON section render sequence; not merely additional unattached assets. No mobile variant is needed at draft stage for portrait inline graphics, but actual mobile readability remains **unverified** pending browser acceptance.

## Acceptance gates

- English article body word count including headings/captions/FAQ per existing `build-insights.py` approach: 1031 words; **3 distinct inline visuals + 1 separate cover**, meeting the 601–1200 tier if this count holds in actual script.
- Verify all five JSON/article images relative paths and source declarations against actual GitHub blobs; run existing `build-insights.py`, `check-insights.py`, `check-editorial-photo.py`, locale/static checks, independent facts/editorial and Code review at exact SHA.
- Do **not** move this file into `content/insights/` until existing Claude Lead and independent reviewer approve; then original authorized publisher handles merge/deploy and public readback including images/CTA/mobile and indexing.
- No email, contact-form submission, DNS/secret changes or production merge authorized.

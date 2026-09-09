# AN-THAI integration and quality report — 2026-09-09

## Result

Integrated the owner-provided `anthai-website-handoff.zip` into the existing redesign branch, preserving the six-page static architecture and blue/white brochure direction. No framework, backend, external fonts, tracking, stock-image host or image-generation dependency was added. No production deployment or main merge was performed.

### Completed

- Homepage: `FROM GROUND TO STRUCTURE`, explicit Testing & Inspection + Testing Equipment & Instrumentation, the agreed field-experience brand logic, and both quotation routes in the hero.
- Testing: eight requested service areas, explicit geotechnical investigation and project-specific resource/reaction/reporting confirmation.
- Equipment: eight B2B categories, each with Application, Measurement purpose, Typical user, Support and Request Quote. Category context flows into the enquiry form.
- About/capabilities: coordinated local delivery and partner resources; no invented named projects, history, client numbers, licences or distributor authorizations.
- Images: replaced eleven JavaScript-assembled base64 parts with ordinary responsive WebP images. Added intrinsic dimensions, srcset/sizes, lazy loading below the hero and accurate alt text. Brand emblem is reused from the supplied brochure image; no new emblem was drawn.
- Accessibility: associated form labels, menu expanded/controls state, focus on opening, Escape return, outside/link/resize closing, current-page labels, skip link, focus indicators, reduced-motion handling and no-JavaScript navigation fallback.
- Enquiry: handles testing/equipment and category parameters, encodes Chinese and special characters, explicitly states that the website has not sent anything. No email was sent during QA.
- SEO: six titles/descriptions/canonicals, retained six-route sitemap and robots, Organization + ProfessionalService (LocalBusiness subtype) and relevant Service graphs. Added noindex 404 document. No ratings, opening hours, registration IDs or unverified credentials were invented.

## Image inventory and provenance

All 19 WebP files total **816,044 bytes** (about 0.82 MB). This is the entire responsive image inventory, not a measured homepage transfer or load time.

| Base filename | Placement | Source classification |
| --- | --- | --- |
| hero-field.webp | Home, testing, about, capabilities | Owner-provided brochure composite |
| static-load.webp | Home static-load service | Brochure test-setup imagery |
| high-strain.webp | Home, equipment | Brochure testing composite |
| low-strain.webp | Home integrity service | Brochure test imagery plus illustration |
| csl.webp | Home CSL service | Technical illustration, visibly labelled |
| plate-load.webp | Home, testing | Brochure field-testing composite |
| lab-equipment.webp | Home, testing, equipment | Partner laboratory brochure imagery, visibly labelled |
| office.webp | Home, about | Office image from owner-provided brochure |
| capabilities.webp | Home, capabilities | Technical illustration, visibly labelled |
| brand-header.webp | Header/footer | Supplied brochure emblem, displayed via CSS crop |

The first nine files each have a `-small.webp` variant. Large files come unchanged from `anthai_site_build/assets/images`; small files come unchanged from `anthai_commit_images`. Per-file SHA-256 and dimensions are in `ASSET_MANIFEST.json`. Unused sprite experiments and alternative crops remain in the original ZIP; they are not needed by the site.

**Real AN-THAI material:** the supplied AN-THAI brochure and its image crops are the source. That verifies source identity, not independent authenticity of every scene. Do not describe all nine as proven original site photography: CSL/capabilities are diagrams, and several others contain composite artwork. No external generic placeholder or stock image was added. No specific project attribution was invented.

## Verification evidence

| Check | Result |
| --- | --- |
| `python3 scripts/check-site.py` | PASS: 7 documents, 28 referenced local files, no missing files/anchors, duplicate IDs or missing image alt/dimensions |
| Asset manifest hashes | PASS: all 19 image files match handoff bytes |
| Canonical / sitemap / robots / JSON-LD | PASS: static structure and expected routes/types |
| Legacy public-content scan | PASS: no old chat, Login/Register, Founded in 2005 or placeholder contact domains |
| `node --check assets/js/site.js` | PASS |
| `node scripts/check-interactions.cjs` | PASS: menu state/focus, category selection, safe query fallback, encoded enquiry and truthful status; isolated DOM fixtures, not a browser |
| `git diff --check` | PASS |
| Phone/email/address | Match brochure page 10, visually reviewed |
| Mobile responsive CSS | Implemented: 1120/640 breakpoints, single-column service/form layouts, compact hero, responsive title and accessible controls |
| Actual mobile / desktop browser rendering | NOT VERIFIED: cloud browser rejected the local preview address (`net::ERR_BLOCKED_BY_CLIENT`) |
| HTTP preview / measured load performance | NOT VERIFIED: cross-session local HTTP connection refused; local file validation passed |
| Accessibility audit / screen reader / 200% zoom | Semantics checked statically; actual browser/assistive-technology audit pending |
| Production 404 / redirects / caching | NOT VERIFIED; no production changes authorized |

No Lighthouse score, load time, browser screenshot, device pass or mail-delivery result is claimed.

## Merge recommendation and owner confirmation

**Do not merge yet.** The implementation is committed for review, but mobile/desktop visual QA is still outstanding. Before merge/publication:

1. Review all six routes at 320/390/768/1440 px, especially hero CTA visibility, long technical titles, brochure-image readability and the cropped emblem.
2. Confirm which brochure scenes may be described as actual AN-THAI / partner site photography. Keep the existing illustration labels unless genuine original photos replace them.
3. Confirm quoted delivery coverage, partner resources and any future named qualifications or brand authorization. This branch makes no specific licence/accreditation claims.
4. Confirm public contact details remain current; they were retained exactly from the owner-provided brochure.
5. On the eventual host, check unknown URLs return HTTP 404, canonical-domain redirects and the contact email-app flow.

## Changed files

The inventory below records this integration before commit. `QUALITY_REPORT.md` is also added. `robots.txt` and `sitemap.xml` were verified and retained byte-for-byte.

```text
 M WEBSITE_REDESIGN_SPEC.md
 M about.html
 M assets/css/site.css
 D assets/images/brand.svg
 D assets/images/brochure-sprite/part-01.b64
 D assets/images/brochure-sprite/part-02.b64
 D assets/images/brochure-sprite/part-03.b64
 D assets/images/brochure-sprite/part-04.b64
 D assets/images/brochure-sprite/part-05a1.b64
 D assets/images/brochure-sprite/part-05a2.b64
 D assets/images/brochure-sprite/part-05b.b64
 D assets/images/brochure-sprite/part-06a.b64
 D assets/images/brochure-sprite/part-06b.b64
 D assets/images/brochure-sprite/part-07.b64
 D assets/images/brochure-sprite/part-08.b64
 M assets/js/site.js
 M contact.html
 M equipment.html
 M index.html
 M portfolio.html
 M services.html
?? 404.html
?? ASSET_MANIFEST.json
?? HANDOFF_AUDIT.md
?? README.md
?? assets/images/brand-header.webp
?? assets/images/capabilities-small.webp
?? assets/images/capabilities.webp
?? assets/images/csl-small.webp
?? assets/images/csl.webp
?? assets/images/hero-field-small.webp
?? assets/images/hero-field.webp
?? assets/images/high-strain-small.webp
?? assets/images/high-strain.webp
?? assets/images/lab-equipment-small.webp
?? assets/images/lab-equipment.webp
?? assets/images/low-strain-small.webp
?? assets/images/low-strain.webp
?? assets/images/office-small.webp
?? assets/images/office.webp
?? assets/images/plate-load-small.webp
?? assets/images/plate-load.webp
?? assets/images/static-load-small.webp
?? assets/images/static-load.webp
?? scripts/check-interactions.cjs
?? scripts/check-site.py
```

## Git handoff

Target branch: `redesign/testing-equipment-20260909`.
Baseline SHA: `b522d4fb347cdd1169305984c12b8b18b15ea1f3`.
PR: https://github.com/Jamescheng2022/an-thai/pull/1
The exact final commit SHA is supplied in the PR body and final task response (a commit cannot contain its own SHA).

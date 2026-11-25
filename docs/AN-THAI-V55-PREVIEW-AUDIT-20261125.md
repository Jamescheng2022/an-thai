# AN-THAI V5.5 — Preview audit & portfolio integration
Date: 2026-11-25 · Scope: **review branch only** · No production merge

## Source and deployment inspected
- Source preview: `an-thai-git-agent-anthai-v53-v5-feaaae-jamescheng2022s-projects.vercel.app` and PR #28 at base SHA `aae7e7c`.
- Live Preview browser: 15 routes at 390, 768 and 1440px; checked HTML status, console errors, responsive overflow, images and inline diagrams. Page links protected by Vercel Authentication; browser check used an authorized temporary share session.
- Inspected: Home, About, Testing, Steel, Powder, Instruments, Cases, Insights index, 4 Insights articles, Contact, ZH About and TH About.
- 15/15 tested routes returned HTTP 200 in each viewport; no observed top-level JavaScript errors or horizontal page overflow. This does NOT certify content correctness, submission endpoints, or devices beyond tested Chromium.
- Local V5.5 build: `node scripts/build-static.cjs`, `python3 scripts/check-site.py`, and `python3 scripts/check-locales.py` passed. Locale check: 43 pages and 1712 local link/asset references.
- New Cases interaction: 23 references loaded, Industrial filter 11, search "Ford" 1, details dialog opens, visible images load, no JS errors or horizontal overflow at 390/768/1440.

## Priority issues

| Priority | Area | Finding | V5.5 status |
|---|---|---|---|
| P0 | `content/cases.json` | Four cases had `verified: true` but original references did not substantiate exact contract roles, dates, procedures or claimed signed deliverables. | Changed to `needs-review` / `verified:false`; removed fabricated precision; public publication blocked |
| P0 | `content/image_evidence.json` | Image source retrieval incorrectly equated to that photo proving a named project and to licensing. | Separated source asset evidence from project match and commercial permission; both false until approved |
| P1 | `/cases/` | Old page contained very long marketing-like case cards, incorrect project-specific hero associations and little user-driven discovery. | Replaced with brand-aligned visual categories and minimal project reference register, functional filter/search/details |
| P1 | About SVG | Inline `viewBox="0 0 985 156"` compressed to ~324×51 px at 390 viewport; technically present but practically unreadable. | Mobile uses existing four service cards; other diagram wrappers preserve legibility via horizontal scroll |
| P1 | Project photographs | Original PACO corporate banners / ROGE sector photos are not validated jobsite images for the exact titled cases. Photo reuse rights not verified. | New portfolio explicitly labels category imagery "Sector photo · not project proof"; no individual project hero claimed |
| P1 | Localized case pages | `/zh/cases/index.html` and `/th/cases/index.html` return 404; current English Cases link is usable from multilingual pages but localizations do not exist. | Not yet implemented; publication gate |
| P1 | About content | Text volume and overlapping "partner group / business unit" descriptions consume attention; "anonymized" project statement conflicts with named project leads. | Requires copy and Chinese/Thai engineering review; do not silently rewrite legal relationship |
| P2 | Insights diagrams | All sampled standalone SVG files return 200 `image/svg+xml` and loaded after scrolling in Chromium at 390/768/1440. An image-present issue may instead involve access cookie, initial lazy loading, tiny labels or a specific device. | Browser failure not reproduced for article assets; monitor actual device / screenshot and add zoom interaction later |
| P2 | Article photos | At least one PDA image is only 258px naturally and is displayed 621px wide; on desktop it appears low resolution. | Replace with legitimate higher-resolution original, retain report content |
| P2 | Contact | Contact and inquiry UI exist; code has an API route or email composition fallback. | No real message submitted; endpoint acceptance/delivery and CRM persistence unverified |

## Review of each route group
- **Home:** consistent brand/nav and service funnel; visual hierarchy still mixes four broad services; consider a shorter hero after material review.
- **About:** too much small explanatory text; mobile flow readability fixed; partner legal relationships still require Owner signoff.
- **Testing:** service scope visible; diagrams are data-oriented, but wide SVG on phone must scroll.
- **Steel procurement:** commercial boundaries disclosed; no outbound customer follow-up authorized.
- **Powder equipment:** differentiated capability, but machinery role should not imply direct manufacture where it is coordination only.
- **Testing instruments:** clear catalog direction; verify exact models/equipment ownership before catalog cards.
- **Cases:** original publication gate materially failed; V5.5 is review-only register with 23 sourced leads, not 23 approved case studies.
- **Insights:** four long form English technical articles render; diagram asset existence does not imply content engineering approval.
- **Contact:** interface renders, real submissions intentionally not executed to avoid any external messaging.
- **Languages:** EN/ZH/TH about and core services load; article details and cases are not fully localized.

## Changed files in this branch
- `cases/index.html`, `assets/css/portfolio-v55.css`, `assets/js/portfolio-v55.js`
- `content/project-references-review.json` (23 separate entries; owner, sector, primary source; all reviewOnly)
- `content/cases.json`, `content/image_evidence.json`
- `about.html`, `assets/css/styles.css`
- `docs/AN-THAI-V55-PREVIEW-AUDIT-20261125.md` (this report)

## Formal HOLD gate
Do NOT merge to `main` or replace `https://an-thai.com` until original contracting role, item-by-item scope, dates, media permissions and ZH/TH copy are approved. Four earlier "published" cases are no longer approved, even though original source banners are real assets. Avoid treating demo/sector imagery as a project's construction photographs.

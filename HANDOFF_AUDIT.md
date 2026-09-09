# Handoff audit — 2026-09-09

Completed before implementation. Baseline: `b522d4fb347cdd1169305984c12b8b18b15ea1f3`, branch `redesign/testing-equipment-20260909`, clean working tree; PR #1 open against main. Read all six pages, shared CSS/JS, redesign specification, recent log, full tracked-file inventory, ZIP README and the ten brochure pages. No AGENTS.md or workflow files exist in this checkout. No deployment commands or main edits are authorized.

## Already completed

- Lightweight six-page static structure, testing and equipment business lines, blue/white brochure direction, application sectors instead of named project claims.
- Main navigation, quotation CTAs, canonical metadata, robots and six-page sitemap.
- No AI chat, Login/Register, 2005 history or named demo projects in public pages.
- Contact details match brochure page 10: James Cheng, Thai and Chinese mobile numbers, email and Bangkok contact office. This verifies consistency with owner-provided material, not independent legal registration.
- Existing HTML internal page/fragment links resolve in both trees.

## Replace / integrate

- Use ZIP `anthai_site_build` as the working baseline, retaining its layout and content direction.
- Replace runtime base64 sprite assembly with native image files and responsive img elements. ZIP JavaScript references eleven missing `.b64` parts; copying it unchanged produces failed requests. Repository has those parts, but images depend on JavaScript and the entire sprite download.
- All nine named standalone WebP images are missing from the repository. ZIP contains larger site versions, compact commit versions, additional crops and unused sprite experiments.
- ZIP and repository index/contact markup are identical; other HTML differences are largely formatting and consistent navigation labels. CSS/JS differ materially in image loading.

## Content and usability gaps

- Shorten hero and explicitly show both business lines and requested brand statement above the fold.
- Equipment categories do not each state application, measurement purpose, typical user, support and quote action.
- Add an explicit geotechnical-investigation description and project-specific delivery scope.
- Mobile menu lacks expanded/controls state and Escape handling; form labels lack associated IDs; `?type=equipment` does not preselect the enquiry type.
- No dedicated 404 page; Service structured data absent. Hosting status-code behavior cannot be certified by static markup alone.

## Factual / visual risks

- ZIP folder names are not independent proof of photographic provenance. The brochure is a designed composite. CSL and capabilities assets are technical illustrations; never describe them as site photographs.
- Static/high/low/plate/hero images are brochure composites/crops. Describe them as brochure imagery, without invented project names, dates or ownership assertions. Preserve a source manifest and distinguish illustrations from photographs.
- Laboratory images support a partner/coordinated-service presentation, not ownership of all shown equipment or proof of accreditation. Brochure does not establish distributor authorization, calibration accreditation or universal test capacity.
- Existing SVG is a simplified logo recreation; use the supplied brochure brand image instead of presenting a newly drawn mark as the approved logo.
- Retain owner-approved contact details; no fabricated registration, founding date, client count, licence number, opening hours or ratings.
- Final merge recommendation must disclose unresolved provenance and delivery-scope confirmation, and must not trigger deployment.

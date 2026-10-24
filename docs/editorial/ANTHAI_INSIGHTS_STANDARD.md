# AN-THAI Insights — editorial and visual acceptance standard

Status: site-specific operating requirement (owner direction, 2026-10-23). This document applies to the existing AN-THAI website lane and its existing GitHub review / publication workflow. It does not authorize a separate publisher, writer, scheduler, credentials change, or production deployment.

## Purpose and priority

Publish genuinely useful, technically careful B2B engineering articles that help a customer define a requirement, select the next technical step, and submit an actionable AN-THAI enquiry. Editorial quality and meaningful enquiry intent matter more than article count. Work on a relevant, deliverable article or finish an existing pending draft on each daily cycle. Do **not** inherit the Precast.World target of ten articles a day or promise any amount of traffic, enquiries, or sales.

The four clearly identified business routes are:
1. Engineering services: pile integrity/dynamic/static testing, geotechnical investigation, agreed design conversion, and Thai submission coordination.
2. Selected steel / long-span / space-structure cooperation.
3. Selected CNBM powder-process and grinding equipment cooperation.
4. Engineering testing and measurement instruments.

Keep the scope of AN-THAI itself, partners, specialists, and manufacturers explicitly separate. Never imply that partner-owned equipment, facilities, projects, accreditation, expertise, product guarantees, or factories are owned by AN-THAI. Exit of pile-testing cold-outreach research is an **email-channel rule**, not a reason to remove pile-testing guidance from the website.

## Article design: real buyer question first

Before writing, identify a distinct buyer/engineer problem and intended reader (e.g., site engineer, owner representative, purchasing manager, project designer, equipment buyer), inspect the current website and unpublished drafts for duplicates, and verify source materials. Prefer an applied topic such as a pre-test information checklist, instrument selection boundary, required site access for a test, interpretation limits, coordination of Thai-design and submission documents, or the data a manufacturer needs before proposing a powder-process machine.

A qualifying article must contain:
- A specific problem, constraints, and when the article applies (and when it does not).
- An actionable decision tree, comparison, document checklist, workflow, or procurement / site-preparation guidance; not vague promotion.
- Clearly separated **facts supported by sources**, practical engineering judgement, project-specific unknowns, and items requiring a licensed engineer or supplier confirmation.
- A short, relevant next step linked to the **correct** AN-THAI contact route, specifying useful enquiry materials. Never mix all four offerings into a generic sales pitch.
- Distinct, readable English prose by default. Do not claim Chinese or Thai article translations exist until independently checked and actually published.

No generic SEO filler, made-up projects, project photos, reviews, client names, measurements, prices, delivery promises, approval guarantees, proprietary data, or copied manufacturer copy. Confirm current Thai legal/standards information against authoritative primary sources with dates/version/applicability; don't invent exact clauses. Client photos, reports, drawings and location data require permission or careful de-identification. Marketing illustrations are not engineering designs or reports.

## Visual contract (minimum counts)

Every article needs **one distinct editorial cover** plus **informative inline body visuals**:
- Up to 600 English words: at least 2 different useful inline visuals.
- 601–1,200 words: at least 3 different useful inline visuals.
- Above 1,200 words: at least 4 different useful inline visuals.
- Longer or complex technical guides add images at natural explanatory breakpoints.

Cover does **not** count as an inline body visual. Repeated crops, recolours, mere filenames, remote prompts, or screenshots of the same graphic do not count as additional images. These are minimum acceptance thresholds, not targets to pad low-value graphics.

Use a purposeful mix: properly licensed actual equipment/site photos where available, AI-created **clearly identified conceptual** scenes, genuine process flows, document checklists, comparison tables, site-layout concepts, and programmatic SVG for labels/quantities that need exact verification. Every graphic must answer a different question. Never label a generated scene as a real AN-THAI jobsite or client. Diagrams must not invent test readings, structural dimensions, safety factors, spans, reaction loads, equipment specifications, or standard clauses. Label conceptual/non-scale diagrams as illustrative.

For EACH image, deliver the actual repository asset bytes, source or AI-generation declaration, permission/provenance, descriptive alt text, useful caption, intrinsic dimensions, and responsive/mobile considerations. Use appropriately optimized WebP/PNG/SVG and local stable repository references. Images count only when they are **actually rendered within the production article body**, loaded at real public URLs, not merely present in a zip, Library, PR comment, or GitHub folder.

## Publishing technology gate — existing PR #14

Existing Insights work is PR #14, branch content/daily-insights. As inspected 2026-10-23, its JSON article template has only a lead-image field; scripts/build-insights.py renders section paragraphs without inline figures. **That is not yet compliant with the new illustrated-article requirement.** The same PR also has an unresolved independent Codex finding: dynamically generated index card action labels remain English inside Thai and Chinese indexes.

The **original Insights implementer** should extend its existing JSON article schema/render path to support actual paragraph-adjacent inline figures with paths, alt, captions and provenance, ensure source asset exists and generated HTML loads it, add tests for image counts/assets/alt and mobile reading, and address the locale-card finding. Retain sanitized escaping and the original draft-excluded build semantics; do not create a parallel blogging framework, duplicate content registry, alternate publishing stack, or new owner. Exact implementation needs its own existing-PR independent review.

Only place an article in the publishable content/insights source directory after full source/illustration review; keep staged/unreviewed work in drafts/insights or an original designated review branch. English article bodies may be indexed from EN/ZH/TH index pages with locally translated interface controls; never pretend article translations exist. The existing PR #14 must not merge merely to meet an editorial cadence while its review/mobile gates are open.

## Required GitHub deliverable / evidence

For each substantive article, package within the existing repository review workflow:
- Complete machine-readable article source, not only title/summary/hash.
- Cover image PLUS all body visuals as actual committed assets.
- Evidence sidecar listing article slug, intended audience/problem, dated original sources and applicability, claim checks, provenance/permissions per image, alt/caption and exact asset paths.
- Explicit preview links and exact Git branch/commit SHA, review status, publishing status, and any pending decisions.
- Every generated page's localized navigation/metadata as applicable, canonical/sitemap entries and internal links; relevant working enquiry CTA.
- No undisclosed confidential business or customer attachments.

ChatGPT daily author/research/visual work → existing GitHub content PR → existing Claude Lead and authorized independent reviewer inspect exact final text/image SHA, revise if necessary → existing authorized publisher merges and deploys → read back **production** article body and each rendered image, mobile layouts (e.g. 390/820/1363 px), CTA, EN/ZH/TH index, no overflow, image errors, sitemap and SEO. Respect existing site role and publication permissions; a PR, build success, or Vercel READY is not production acceptance.

SourceRating and Precast.World are **quality references only**. No cross-site ownership, files, client lists, production rights, posting quotas, agent-bus parallel chains or daily publication counts are inherited.

## Daily reporting

Report only actual new publicly verified article URLs and meaningful site fixes; article sources / image counts and review status if not yet published; production/mobile findings; independently verified genuine website enquiries; and specific matters requiring owner approval. Distinguish drafted, committed, reviewed, previewed, merged, deployed, publicly verified, clicked, replied, quoted, ordered and cash received. Unknown analytics are unknown, not zero. Maintain original single schedule and original BOARD / agent-bus handoff.

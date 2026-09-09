# AN-THAI website redesign — Testing + Equipment

Date: 2026-09-09
Branch: `redesign/testing-equipment-20260909`

## Goal

Rebuild the existing static website so it accurately represents AN-THAI as a Thailand-based engineering testing and inspection company while retaining testing-equipment sales as a second commercial line.

Core positioning:

> **Engineering Testing & Inspection + Testing Equipment Supply in Thailand**
>
> **From Ground to Structure — We Deliver Engineering Integrity.**

Testing and inspection should be the primary trust-building business. Equipment supply should be presented as a complementary capability, not as a separate unrelated shop.

## Visual source

The approved AN-THAI brochure is the primary visual source for the redesigned public site. Real brochure-derived AN-THAI field-testing, laboratory and office photography is used across Home, Testing & Inspection, Equipment, Capabilities and About. Main site visuals should not depend on generic stock photography.

## Problems in the current site

- The homepage was designed as an “An-Thai Engineering AI” chat interface rather than a corporate engineering website.
- Current service content was generic and did not match the actual testing business.
- The About page contained legacy/demo claims such as “Founded in 2005” and “hundreds of successful projects”; these must not be restored unless verified.
- The portfolio contained demo/stock project names and must not be presented as AN-THAI experience.
- The contact page contained placeholder contact details.
- Login/Register and AI-chat UI should remain removed from the public corporate site unless there is a real backend and business reason for them.

## Information architecture

Primary navigation:

1. Home
2. Testing & Inspection
3. Equipment
4. Projects & Capabilities
5. About AN-THAI
6. Contact

## Homepage structure

### Hero

Headline: **TEST IN THAILAND. EQUIP WITH CONFIDENCE.**

Supporting position: AN-THAI combines Thailand-based field testing with professional testing-equipment supply, connecting instrumentation, field methods, engineering evaluation and reporting.

Primary CTA: **Request a Testing Quote**
Secondary CTA: **View Testing Equipment**

### Two core business lines

#### Testing & Inspection
- Static Load Test
- High-Strain Dynamic Pile Test
- Low-Strain Integrity Test
- Crosshole Sonic Logging (CSL)
- Plate Load Test & Geotechnical Field Testing
- Geotechnical Investigation
- Material Testing
- Structural Inspection / Specialized Testing

#### Equipment & Instruments
- Pile testing instruments and systems
- Geotechnical and field-testing instruments
- Load cells, sensors and data acquisition
- Material/laboratory testing equipment
- Test accessories and instrumentation
- Equipment selection, setup, training, calibration coordination and after-sales technical support

Do not claim exclusive distribution, manufacturing ownership or specific brand authorization unless documented.

## Core service logic

Use the brochure logic:

**Investigate → Test → Evaluate → Report**

This visually connects soil investigation, pile testing, field testing, material testing and structural inspection.

## Why AN-THAI

- Thailand-based delivery
- Local engineering knowledge and professional resources
- Foundation-to-structure testing scope
- Partner laboratory network
- English / Chinese / Thai coordination where available
- Equipment knowledge connected to real field-testing practice

## Equipment section

Equipment should not look like a consumer e-commerce store. Use a professional B2B catalog and quotation workflow.

Each equipment category should explain application, measurement purpose, typical users, available support, and verified models only where supported. The main CTA is **Request Equipment Quote**.

## Experience / applications

Use only verified project photos, real testing photos and truthful application categories such as industrial plants, logistics facilities, factory developments, data centers and commercial projects, foundation testing, geotechnical support, and material/structural testing support.

Do not use invented client names, project names, quantities or performance claims.

## Visual direction

- white + engineering blue palette
- strong diagonal / industrial geometry
- real AN-THAI brochure and project/testing photography
- technical diagrams and process logic where useful
- clean industrial typography
- restrained motion
- mobile-first responsive layout

Avoid generic SaaS cards, AI-chat styling, fake dashboards and stock-photo dependence.

## Technical direction

Keep the site lightweight and maintainable with semantic HTML, shared CSS, small vanilla JS, accessible navigation/CTAs, SEO metadata, sitemap/robots, and factual structured data.

The brochure-derived photography is packaged as a compact internal WebP sprite assembled from repository-hosted text chunks at runtime because the current GitHub connector cannot directly write binary image files. The browser receives the images from the same repository/site rather than an external stock-photo host.

## Acceptance criteria

- No demo/fabricated company history, project names, contact details or certifications.
- Testing and inspection is clearly visible above the fold.
- Equipment sales is visible from the homepage and main navigation.
- Testing and equipment feel like one engineering brand.
- Approved AN-THAI brochure photography appears throughout the core pages.
- Core visual areas do not rely on Unsplash or other stock-photo hosts.
- Mobile layout works without desktop-only controls.
- All public contact details are based on approved company material.
- All service claims are traceable to AN-THAI capability or documented partner capability.
- No production deployment or `main` merge until reviewed.

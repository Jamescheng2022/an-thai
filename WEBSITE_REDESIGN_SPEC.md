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

## Problems in the current site

- The homepage is designed as an “An-Thai Engineering AI” chat interface rather than a corporate engineering website.
- Current service content is generic and does not match the actual testing business.
- The About page contains legacy/demo claims such as “Founded in 2005” and “hundreds of successful projects”; these must be removed unless verified.
- The portfolio contains demo/stock project names and must not be presented as AN-THAI experience.
- The contact page contains placeholder contact details.
- Login/Register and AI-chat UI should be removed from the public corporate site unless there is a real backend and business reason for them.

## Information architecture

Primary navigation:

1. Home
2. Testing & Inspection
3. Equipment
4. Projects & Capabilities
5. About AN-THAI
6. Contact
7. Language: EN / TH / 中文

## Homepage structure

### 1. Hero

Headline:

**FROM GROUND TO STRUCTURE**

Subheadline:

**Engineering Testing, Inspection & Test Equipment Support in Thailand**

Supporting copy:

Thailand-based engineering delivery combining local professional resources, field testing capability, partner laboratories and bilingual technical coordination.

Primary CTA: **Request a Testing Quote**
Secondary CTA: **View Testing Equipment**

### 2. Two core business lines

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

### 3. Core service logic

Use the brochure logic:

**Investigate → Test → Evaluate → Report**

This should visually connect soil investigation, pile testing, field testing, material testing and structural inspection.

### 4. Why AN-THAI

- Thailand-based delivery
- Local engineering knowledge and professional resources
- Foundation-to-structure testing scope
- Partner laboratory network
- English / Chinese / Thai coordination
- Equipment knowledge connected to real field-testing practice

### 5. Equipment section

Equipment should not look like a consumer e-commerce store. Use a professional B2B catalog and quotation workflow.

Each equipment category/card should have:

- application
- key measurement purpose
- typical users
- available support
- product/model list only where verified
- **Request Equipment Quote** CTA

### 6. Experience / applications

Use only verified project photos, real testing photos and truthful application categories. Good categories from the brochure include:

- Industrial plants
- Logistics facilities
- Factory developments
- Data centers and commercial projects
- Foundation testing projects
- Geotechnical support
- Material and structural testing support

Do not use invented client names, project names, quantities or performance claims.

### 7. Contact

Use the current marketing contact information supplied in the approved brochure. If the registered-office address and operating/contact office differ, label them separately rather than mixing them.

## Dedicated Testing pages

Create search-oriented service pages for:

- `/static-load-test.html`
- `/high-strain-pile-test.html`
- `/low-strain-integrity-test.html`
- `/csl-test.html`
- `/plate-load-test.html`
- `/geotechnical-investigation.html`
- `/material-structural-testing.html`

Each page should include purpose, method, workflow, outputs, suitable applications, standards only where verified, project-enquiry CTA and FAQ.

## Equipment page

Create `/equipment.html` with category sections rather than unverified product listings.

Suggested categories:

1. Pile Integrity Testing
2. High-Strain / Dynamic Pile Testing
3. CSL / Ultrasonic Pile Testing
4. Static Load Test Instrumentation
5. Geotechnical & Field Testing
6. Material & Laboratory Testing
7. Sensors, DAQ & Accessories
8. Calibration / Setup / Training Support

## SEO / GEO targets

Primary English intent clusters:

- pile testing Thailand
- static load test Thailand
- pile integrity test Thailand
- low strain pile test Thailand
- high strain dynamic pile test Thailand
- PDA pile test Thailand
- CSL test Thailand
- crosshole sonic logging Thailand
- plate load test Thailand
- geotechnical investigation Thailand
- material testing Thailand
- structural inspection Thailand
- pile testing equipment Thailand
- civil engineering testing equipment Thailand

Build factual, method-specific content rather than keyword stuffing.

## Visual direction

Use the brochure as the design source:

- white + engineering blue palette
- strong diagonal geometry
- real AN-THAI project/testing photography
- technical diagrams and process icons
- clean industrial typography
- restrained motion
- mobile-first responsive layout

Avoid generic SaaS cards, AI-chat styling, fake dashboards and excessive gradients.

## Technical direction

Keep the site lightweight and maintainable. The current repository is a static HTML site, so do not introduce a heavy framework unless there is a concrete need.

Preferred structure:

- semantic HTML
- shared CSS in `/assets/css/site.css`
- small vanilla JS in `/assets/js/site.js`
- local optimized images in `/assets/images/`
- responsive images (`webp`/`avif` where practical)
- accessible navigation and CTAs
- Open Graph metadata
- Organization / LocalBusiness / Service structured data where factual
- sitemap.xml and robots.txt
- canonical URLs

## Acceptance criteria

- No demo/fabricated company history, project names, contact details or certifications.
- Testing and inspection is clearly visible above the fold.
- Equipment sales is visible from the homepage and main navigation.
- Testing and equipment feel like one engineering brand.
- Mobile layout works without desktop-only controls.
- All public contact details are verified against approved company material.
- All service claims are traceable to AN-THAI capability or documented partner capability.
- No production deployment or `main` merge until reviewed.

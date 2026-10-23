# AN-THAI Engineering website

Lightweight, buildless HTML/CSS/JavaScript site for engineering testing and inspection in Thailand and B2B testing-equipment supply.

## Review branch

Work on `redesign/testing-equipment-20260909`. Do not merge main or deploy production without the owner's separate instruction. PR: https://github.com/Jamescheng2022/an-thai/pull/1

## Local review

Serve this directory with any static HTTP server, for example `python3 -m http.server 8080`. No framework, package installation or build step is required.

Validation commands (Python 3 and Node.js only):

```sh
python3 scripts/check-site.py
node --check assets/js/site.js
node scripts/check-interactions.cjs
```

`index.html`, `services.html`, `equipment.html`, `portfolio.html`, `about.html` and `contact.html` are the six public routes. `portfolio.html` intentionally presents capabilities and application sectors, not named client projects. `404.html` is the error document; the eventual hosting provider must serve it with HTTP 404 for unknown paths, including nested paths. Its root-relative links support that use.

The enquiry helper prepares a `mailto:` message; the visitor sends it from their own email app. It has no submission backend and does not claim delivery. Direct phone/email routes remain available. The submit button stays disabled until JavaScript installs its handler, preventing accidental GET submission of form values when scripts are unavailable.

## Content and images

- `WEBSITE_REDESIGN_SPEC.md`: design and business direction.
- `HANDOFF_AUDIT.md`: pre-implementation repository/ZIP audit.
- `ASSET_MANIFEST.json`: exact ZIP source, dimensions, byte sizes and SHA-256 for every image.
- `QUALITY_REPORT.md`: verification, limitations and merge recommendation.

Keep source images local. Large/small WebP variants are reused byte-for-byte from the handoff ZIP. There is no runtime sprite, external image host or generated substitute. CSL and capabilities diagrams are labelled as illustrations; the partner laboratory image does not establish laboratory ownership or accreditation. Project attribution and business credentials need their own supporting evidence.

Before publication, verify the six pages at 320/390/768/1440 px, menu keyboard behavior, mobile CTA visibility, contact links and the destination email app. Review with JavaScript disabled and at 200% text enlargement. Confirm the host's unknown-route HTTP status and canonical domain behavior. No production hosting configuration is changed by this branch.

## Insights publishing

The Insights section publishes daily engineering articles. Each article requires exactly **one JSON source file** and **one local lead image**.

The Insights index has English, Thai and Chinese chrome. Article text is published in English; no translated article URLs or hreflang claims are generated until translations exist.

### How to add an article

1. **Add the lead image:**
   - Save your image under `assets/images/insights/<slug>.webp` (or reuse an approved file in `assets/images/`).
   - Use WebP format, compressed for web performance.
   - Note the exact pixel width and height (e.g., 900x600).

2. **Create the article JSON file:**
   - Copy `drafts/insights/sample-template.json` to `content/insights/<slug>.json`.
   - The file name and the `"slug"` field must match exactly (lowercase alphanumeric with hyphens, e.g. `pile-load-testing-methods.json`).
   - Drafts in `drafts/` are strictly excluded from the build and sitemap; only files in `content/insights/` are published.

3. **Fill in the article fields:**
   ```json
   {
     "slug": "pile-load-testing-methods",
     "title": "Static and Dynamic Pile Load Testing Methods in Thailand",
     "description": "A technical guide to pile load testing standards, reaction frames, and instrumentation used in Bangkok subsoil conditions.",
     "author": "AN-THAI Engineering",
     "date": "2026-10-24",
     "image": "assets/images/insights/pile-load-testing-methods.webp",
     "image_alt": "Static pile load test reaction frame on a Bangkok construction site",
     "image_caption": "Static load test setup with hydraulic jack and dial gauge instrumentation.",
     "image_width": 900,
     "image_height": 600,
     "sections": [
       {
         "heading": "Introduction to Pile Testing",
         "paragraphs": [
           "First paragraph of technical editorial text.",
           "Second paragraph explaining the methodology and local standards."
         ]
       }
     ],
     "faq": [
       {
         "question": "What is the primary standard for static pile load testing?",
         "answer": "Testing is commonly conducted in accordance with ASTM D1143 / D1143M."
       }
     ]
   }
   ```
   - `description`: Must be between 1 and 160 characters (the build will reject descriptions over 160 characters).
   - `date`: Must be valid ISO format `YYYY-MM-DD`.
   - `image`: Must start with `assets/` and exist on disk.
   - `image_caption`: Optional string for the `<figcaption>`; if omitted, `image_alt` is used.
   - `sections`: Must contain at least one section with a non-empty heading and paragraphs.
   - `faq`: Optional array of `{ "question", "answer" }` pairs. Generates both visible FAQ accordions and `FAQPage` schema JSON-LD. Use `[]` if none.
   - All editorial text is escaped safely; HTML and Markdown syntax are not interpreted.

4. **Run the static build:**
   ```sh
   node scripts/build-static.cjs
   ```
   This automatically:
   - Compiles article pages under `dist/insights/<slug>.html` with SEO/GEO metadata, Open Graph, Twitter cards, and Schema.org Article/Breadcrumb/FAQ JSON-LD.
   - Updates `dist/insights.html`, `dist/th/insights.html`, and `dist/zh/insights.html` with responsive magazine-style lead-image cards.
   - Appends the article to `dist/sitemap.xml` and `dist/llms.txt`.

5. **Run all validation checks:**
   ```sh
   python3 scripts/check-site.py
   python3 scripts/check-locales.py
   python3 scripts/check-insights.py
   node scripts/check-interactions.cjs
   ```
   Preview `dist/` locally (e.g. `python3 -m http.server 8080 -d dist`) and verify mobile layout at 320px and 390px before publishing.

Build validation rejects missing images, descriptions longer than 160 characters,
and articles absent from the generated sitemap. Related articles use the latest
three other publications, with a link to the index when no others exist.
No article is published by this initial section change.

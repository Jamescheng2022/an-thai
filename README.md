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

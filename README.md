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

The enquiry form POSTs JSON to `/api/enquiry`, which sends a plain-text email through Resend. Success means Resend accepted the email, not confirmed inbox delivery. On failure, the form preserves its values and opens the existing `mailto:` draft for the visitor to send. Direct phone/email routes remain available. The submit button stays disabled until JavaScript installs its handler, preventing accidental GET submission of form values when scripts are unavailable.

## Enquiry backend

Set these server-side environment variables in Vercel for each intended deployment environment:

- `RESEND_API_KEY`: a Resend API key with permission to send email. Never expose it in client assets or commit it.
- `ENQUIRY_FROM_EMAIL`: a sender address on an already verified Resend domain, for example `AN-THAI <info@an-thai.com>` if that domain is verified.
- `ENQUIRY_TO_EMAIL`: comma-separated business recipients. Intended value: `info@an-thai.com,anthaicheng@gmail.com`.

All three variables are required; absent configuration returns HTTP 503 with the mailto fallback. The customer email is `reply_to`. No customer database is created; contact details and message content are passed to Resend and the configured business inboxes. The handler never logs message bodies or provider errors. It accepts JSON POST only, requires name/email/message, caps every accepted field and rejects bodies of 20 KiB or more. The hidden `website` field is a honeypot; filled submissions are acknowledged without sending.

The existing `framework: null` and `outputDirectory: "dist"` remain valid: Vercel discovers supported files in the root `api/` separately from static build output. Do not copy server code into `dist`. References: [Node functions](https://vercel.com/docs/functions/runtimes/node-js), [outputDirectory](https://vercel.com/docs/project-configuration/vercel-json#outputdirectory), [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).

Run `node scripts/test-enquiry.cjs` and `node scripts/check-interactions.cjs` for offline tests (mocked fetch only), then `node scripts/build-static.cjs` to generate the English, Chinese and Thai pages. A static-only local server cannot execute `/api/enquiry` and will exercise the email-app fallback. Real Vercel routing and inbox delivery still need an owner-authorized runtime acceptance after configuration; no real email is sent by these tests. A network timeout can be ambiguous: the fallback says submission could not be confirmed, and manually sending may produce a duplicate. The honeypot is basic spam filtering, not a rate limiter.

## Content and images

- `WEBSITE_REDESIGN_SPEC.md`: design and business direction.
- `HANDOFF_AUDIT.md`: pre-implementation repository/ZIP audit.
- `ASSET_MANIFEST.json`: exact ZIP source, dimensions, byte sizes and SHA-256 for every image.
- `QUALITY_REPORT.md`: verification, limitations and merge recommendation.

Keep source images local. Large/small WebP variants are reused byte-for-byte from the handoff ZIP. There is no runtime sprite, external image host or generated substitute. CSL and capabilities diagrams are labelled as illustrations; the partner laboratory image does not establish laboratory ownership or accreditation. Project attribution and business credentials need their own supporting evidence.

Before publication, verify the six pages at 320/390/768/1440 px, menu keyboard behavior, mobile CTA visibility, contact links and the destination email app. Review with JavaScript disabled and at 200% text enlargement. Confirm the host's unknown-route HTTP status and canonical domain behavior. No production hosting configuration is changed by this branch.

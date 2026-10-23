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

The enquiry form POSTs JSON to `/api/enquiry`, which sends a plain-text email through Resend. Success means Resend accepted the email, not confirmed inbox delivery. Definite failures preserve the form and open a `mailto:` draft. Network errors, timeouts and uncertain provider acknowledgements preserve the form and show an explicit email button without opening it automatically: the enquiry may already have arrived, so the visitor is asked to wait 1 business day before emailing. Direct phone/email routes remain available. The submit button stays disabled until JavaScript installs its handler, preventing accidental GET submission of form values when scripts are unavailable, and stays disabled during each request.

## Enquiry backend

Set these server-side environment variables in Vercel for each intended deployment environment:

- `RESEND_API_KEY`: a Resend API key with permission to send email. Never expose it in client assets or commit it.
- `ENQUIRY_FROM_EMAIL`: a sender address on an already verified Resend domain, for example `AN-THAI <info@an-thai.com>` if that domain is verified.
- `ENQUIRY_TO_EMAIL`: comma-separated business recipients. Intended value: `info@an-thai.com,anthaicheng@gmail.com`.

All three variables are required; absent configuration returns HTTP 503 with the mailto fallback. The customer email is `reply_to`. No customer database is created; contact details and message content are passed to Resend and the configured business inboxes. The handler never logs message bodies or provider errors. It accepts JSON POST only, requires name/email/message and a version-4 UUID `enquiryId`, caps every accepted field and rejects bodies of 64 KiB or more. The larger byte limit accommodates 10,000-character Chinese and Thai messages within the character caps.

Best-effort abuse checks keep the hidden `website` honeypot and silently acknowledge submissions rendered less than 3 seconds or more than 24 hours ago without sending. The page supplies a numeric `renderedAt` timestamp; it can be forged, so this only stops naive bots. A present Origin must be an `an-thai.com`, `www.an-thai.com` or `*.vercel.app` HTTP(S) origin; absent Origin is permitted. Per-IP rolling limits allow at most 3 valid attempts per 10 minutes and 10 per day, using the first `x-forwarded-for` IP or `x-real-ip` as fallback. Rejection returns HTTP 429 and the localized direct-email option. The in-memory map expires entries after a day and caps at 10,000 active IPs (new IPs receive 429 when full). These limits are per-instance and best-effort: cold starts and multiple instances do not share counts, and forged timing/origin headers or IP rotation can bypass layers. Durable protection via Vercel Firewall rate limiting or Cloudflare Turnstile is an Owner decision; neither is configured here.

The client keeps a random `enquiryId` across retries of unchanged form content in the current page and rotates it for changed content or after success. The server validates it and forwards it as Resend's `Idempotency-Key`, keeping the email payload stable across retries. No automatic retry is performed. Resend transport failures or invalid success acknowledgements return HTTP 502 with `uncertain: true`, rather than falsely declaring a definite send failure. Idempotency does not deduplicate a manually sent email or a new page/session.

The existing `framework: null` and `outputDirectory: "dist"` remain valid: Vercel discovers supported files in the root `api/` separately from static build output. Do not copy server code into `dist`. References: [Node functions](https://vercel.com/docs/functions/runtimes/node-js), [outputDirectory](https://vercel.com/docs/project-configuration/vercel-json#outputdirectory), [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).

Run `node scripts/test-enquiry.cjs` and `node scripts/check-interactions.cjs` for offline tests (mocked fetch only), then `node scripts/build-static.cjs` to generate the English, Chinese and Thai pages. Also run `python3 -X utf8 scripts/check-site.py` and `python3 -X utf8 scripts/check-locales.py` to validate source and built pages. A static-only local server cannot execute `/api/enquiry` and will exercise the email-app fallback. Real Vercel routing and inbox delivery still need an owner-authorized runtime acceptance after configuration; no real email is sent by these tests.

## Content and images

- `WEBSITE_REDESIGN_SPEC.md`: design and business direction.
- `HANDOFF_AUDIT.md`: pre-implementation repository/ZIP audit.
- `ASSET_MANIFEST.json`: exact ZIP source, dimensions, byte sizes and SHA-256 for every image.
- `QUALITY_REPORT.md`: verification, limitations and merge recommendation.

Keep source images local. Large/small WebP variants are reused byte-for-byte from the handoff ZIP. There is no runtime sprite, external image host or generated substitute. CSL and capabilities diagrams are labelled as illustrations; the partner laboratory image does not establish laboratory ownership or accreditation. Project attribution and business credentials need their own supporting evidence.

Before publication, verify the six pages at 320/390/768/1440 px, menu keyboard behavior, mobile CTA visibility, contact links and the destination email app. Review with JavaScript disabled and at 200% text enlargement. Confirm the host's unknown-route HTTP status and canonical domain behavior. No production hosting configuration is changed by this branch.

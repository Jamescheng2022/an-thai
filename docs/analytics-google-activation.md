# GA4 and Search Console activation — 2026-10-24

## Google actions (one batch for all four sites)

1. In Google Analytics, create one GA4 Property and one Web data stream per website. Do not share a property or Measurement ID across sites. Use Asia/Bangkok for consistent daily reporting. Record the numeric Property ID as well as the G- Measurement ID; data readers need the numeric ID.
2. In each Vercel project below, Settings → Environment Variables → Production: set NEXT_PUBLIC_GA_MEASUREMENT_ID to that site's real ID. Redeploy the production branch through the existing workflow, because this is a build-time setting. No placeholder ID is supplied. SourceRating still accepts legacy NEXT_PUBLIC_GA_ID as fallback; only one component configures the stream.
3. In each GA4 stream keep Enhanced Measurement → Page views → Page changes based on browser history events enabled. Do not additionally configure GTM or manual router page_view for the same stream. After activation verify one initial page_view and one per client-side navigation/back action in Realtime/DebugView; verify Preview sends none. Receipt before real IDs is code readiness, not successful Google ingestion.
4. Search Console → Add property → Domain (bare domain, no https or path). Copy Google's exact TXT value. Add TXT at @ using the DNS locations below, retain all unrelated records, then click Verify. Domain verification uses DNS; HTML/meta verification cannot replace it. Submit the sitemap listed below. No DNS values have been invented or changed.
5. Authorize Windsor.ai with the Google account that can read all four GA4 properties and all four Search Console properties. Select all eight sources/properties. GA4 supplies traffic and popular pages; Search Console supplies impressions, clicks, queries and search landing pages. Code installation does not itself authorize either API or Windsor. Confirm a read-only report succeeds before enabling daily reporting; retain the existing scheduler.

| Website | Vercel project | Production sitemap | DNS location / authoritative NS |
|---|---|---|---|
| sourcerating.com | sourcerating-website | https://www.sourcerating.com/sitemap.xml | Cloudflare → sourcerating.com → DNS → Records; harlan.ns.cloudflare.com / ullis.ns.cloudflare.com |
| nogodownsme.com | nogodwinsme | https://nogodownsme.com/sitemap.xml | Cloudflare → nogodownsme.com → DNS → Records; harlan.ns.cloudflare.com / ullis.ns.cloudflare.com |
| an-thai.com | an-thai | https://an-thai.com/sitemap.xml | Tencent Cloud DNSPod → an-thai.com → records; sausage.dnspod.net / ellis.dnspod.net |
| precast.world | precastworld | https://precast.world/sitemap.xml | Alibaba Cloud DNS → precast.world → records; dns17.hichina.com / dns18.hichina.com |

## Verified baseline

- Four homepages, robots and sitemaps respond 200; robots allow public Googlebot crawling. Home canonicals use the intended production domain, with no homepage noindex. A nonexistent route returns 404 on each.
- SourceRating apex redirects to www; NoGod and AnThai www redirect to apex. Precast www still serves 200, with apex canonical; needs an explicit redirect once the production source is reconciled.
- SourceRating sitemap contains the October 23 weld evidence article. NoGod sitemap contains its published October 19 dispatches. Neither sitemap lists draft-only articles.
- Public DNS TXT queries found no google-site-verification token on any of the four apex domains. This does NOT prove the Google account has no existing verified property. Google console access remains unverified. No homepage Google verification meta tag found; a full historical HTML verification-file inventory was not available.
- Existing Vercel Analytics and first-party conversion tracking are retained. No new scheduler, site, backend or parallel Vercel project is created.
- Vercel environment-list access returned 403 for all four projects. Existing IDs could not be inspected; no environment variables were overwritten. Original Windows worktrees and four-site task running state could not be verified; the remote environment list was empty.

## Precast source blocker

Production dpl_CKobGdj7UDLbtktaqfnJVdqYcasU was deployed by CLI and has no Git SHA/ref. Vercel source package name is precast-world-mvp with src/app and SiteTelemetry. Jamescheng2022/precastworld main at 9412c26985439b5b167946f0779c2db141183968 instead contains app/[[...slug]], Clerk and precast-app. Do not deploy this mismatched repository over production. Recover/sync the actual production worktree and verify its remote before patching GA4. Vercel source-file responses are truncated and cannot reconstruct an exact build. This is a source reconciliation blocker, not a missing Measurement ID.

## Implementation and limits

Next.js integration uses pinned @next/third-parties 16.3.3 with a server-side VERCEL_ENV=production guard and ID validation. Official loader initializes after hydration; it relies on GA4 history Enhanced Measurement rather than a second page_view emitter. See https://nextjs.org/docs/app/guides/third-party-libraries . AnThai uses the official async gtag pattern in its existing static build, with production and hostname guards, after localization; 404 pages are excluded. No real Google requests were used during synthetic checks. Core Web Vitals under active GA4 and real Google data ingestion still require post-activation measurement.


## Verified continuation — 2026-10-26

Google setup is complete. Do not create replacement properties, streams or Domain Properties.

| Site | GA4 property | Measurement ID |
|---|---|---|
| SourceRating | 560670689 | G-8FMLJ410B8 |
| Precast | 560699050 | G-8HNWR8ZPV4 |
| NoGod | 560771281 | G-PQ8JK9XK91 |
| AN-THAI | 560768888 | G-6PQ8Q9TQGJ |

The four GSC Domain Properties, submitted sitemaps and GA4-GSC links are verified in the original operating receipt. All four streams retain email redaction and now redact 16 sensitive query keys (email, email_address, name, firstname, lastname, first_name, last_name, phone, telephone, address, message, company, token, access_token, code, password). This is best-effort protection; never pass form contents or PII into event payloads.

This branch adds explicit opt-in before loading Google Analytics. Reject persists, consent withdrawal reloads to remove the running tag, and withdrawal in a second tab reloads the other tab. This gate applies to GA4; the existing first-party and Vercel instrumentation is preserved. Advertising storage, ad user data and personalization are denied. Custom Google event parameters use a bounded allowlist; no form values, visitor session identifiers, or arbitrary strings are forwarded. NoGod page_view remains owned only by GA4 Enhanced Measurement; existing first-party page_view is not forwarded.

GA4_DEBUG_MODE=true is only for controlled LOCAL production builds. It enables DebugView and traffic_type=internal; never set it on Vercel Production. Preview and Development retain the production-only guard and send no GA requests even when an ID is configured. Validate actual collection against the intended property after the owner's production release approval; local debug success does not prove the production site has been activated. Exclude debug/internal and local hostnames from audience reports.

Acceptance evidence lives in the original four-site task's evidence directory: collect-normalized.json, consent-validation.json, four *-debugview.png screenshots, redaction screenshots and build logs. Four real collect endpoints returned204, initial/navigation/back scenarios had one page_view each, and synthetic non-personal query values were redacted in the actual outgoing requests. The original task retains exact per-phase counts. No real enquiry or payment was submitted; buy_click is purchase intent, never purchase or verified revenue.

Production variables, merges, deployments and private report writes remain gated by the owner's explicit approval. Activation uses the existing Vercel project and branch workflow. Rollback uses the preceding verified deployment; remove only the new ID variable if disabling a future release. Retain Google ownership TXT records.

The consolidated reader reuses D:/precastworldv2/scripts/read-four-site-measurement.mjs and the existing monitoring lane. It is read-only, labels unavailable/uninstalled sources unknown, uses Asia/Bangkok, and never writes Blob. The existing sync-traffic-dashboard.mjs --dry-run also avoids all writes; funnel URLs use exact filtered queries instead of top-100 inference. Windsor OAuth remains an independent requirement for live GA4/GSC reports. Existing paused operations schedules are preserved; no duplicate schedule was created.

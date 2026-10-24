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

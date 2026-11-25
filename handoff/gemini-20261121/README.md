# An-Thai Living Website: Gemini V5.3 + V5.4 source handoff

**Status: isolated source handoff, NOT production-ready.** Created 2026-11-21, based on main commit `52d06df1fd1740b4b3481e6ab7c89d6224dddb41`.

## Where the code is
- Original immutable source ZIP files: `handoff/gemini-20261121/`
- Extracted inspectable source, when the import workflow completes:
  - `experiments/gemini-20261121/an-thai-site-v5-3/`
  - `experiments/gemini-20261121/an-thai-living-studio-v5-4/`

**Do not run or deploy the prototypes from repository root.** The handoff imports source into `experiments/` and does not overwrite existing website files.

## Owner intent / work for AGY
1. Use existing `main` as the authority for live pages, canonical URLs, and engineering article content. Merge the Gemini V5.3 UI/navigation/Cases structure **incrementally**, preserving `content/insights/*.json`, `scripts/build-insights.py`, original diagrams, FAQs, article text, old paths and metadata. New Gemini article HTMLs are short placeholders and MUST NOT replace existing full articles.
2. Treat V5.4 as a UX/flow prototype (simulated photo/voice, client-side chat/roles, regular expressions instead of true model calls). The actual communication and Agent participation belong to SourceRating; integrate via authorized APIs instead of creating a second chat service.
3. Build employee-first chat UX with optional inline CRM cards; integrate actual authenticated workspace, multi-tenant database security, persisted messages, real uploads/STT, Agent extraction, and human-confirmed customer/contact/lead/project/task/interaction records. Keep heavy OA/ERP out of scope.
4. Implement Content Studio: photo/voice/text -> targeted AI questions -> structured content and evidence -> pre-approved templates -> reviewer approval -> actual website publishing with new URL, sitemap, SEO links, versioning/retract/rollback. Approval and role enforcement MUST be server-side; initial draft cannot jump to published.
5. Implement a true RFQ submission path and SourceRating anonymous visitor -> AI -> live human handoff. Do not call an unconfigured endpoint "live". Respect customer/private material and public publish authorization.
6. Test mobile 390/768/1024/1440 and real backend cases, failures, isolation and authorization. Supply screenshots, test logs and clear PASS/FAIL/BLOCKED flags.
7. Deliver incremental code commits and a review PR, with explicit owner approval before production merge/deploy. No customer outreach email/WhatsApp or external publication without owner approval.

## Known unresolved issues from independent audit
- V5.3 has file-level Cases and Insights pages but 4 Insight bodies are shortened (roughly 118-173 words each), risking major SEO and expertise regression if copied over original articles.
- V5.4 UI data are ephemeral and simulated; no real SourceRating/Supabase/AI/publishing handshake demonstrated.
- Database draft RLS/policy and server approval-state logic need strengthening before any sensitive data is ingested.
- The prototype ZIPs are reference source only, not claims of validated browser QA or production readiness.

## Automatic source extraction
The branch-only workflow `.github/workflows/extract-gemini-anthai-handoff.yml` unpacks the two ZIPs into `experiments/gemini-20261121/` and commits the extracted source back to THIS branch. It does not execute prototype scripts, alter production root files, merge PRs or deploy. If the workflow is disabled, AGY may unzip these same files locally into those directories and commit them.

## Drive originals
- V5.3: https://drive.google.com/file/d/1aVmHwXIjE80951mMUWt8Ls9xpzbadpJH/view
- V5.4: https://drive.google.com/file/d/1_ularl98metWt4cEXO-o_CzzKjAKSyK-/view

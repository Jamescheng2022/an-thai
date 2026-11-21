# AN-THAI V5.2 Staging Fix Remediation Report (2026-11-21)

Maps every finding from `AnThai_V5_1_Code_Content_Audit_2026-11-21.md`:

| Item | V5.1 Audit Finding | V5.2 Fix Implemented | Verification |
| :--- | :--- | :--- | :--- |
| **P0-1** | 401 recreated `sess_2/tok_2` but retried old `sess_1` path (403); input cleared on error | Refactored `_authedFetch(pathBuilder)` in `sourcerating-embed-adapter.js` v2.2 to rebuild path with new `sessionId` on 401; `site.js` preserves input on failure and shows localized session-reset notice. | Verified in strict `sessionId<->token` pairing mock test (`tests/verify_site.py`). |
| **P0-2** | `api/inquiry.js` lacked `JSON.parse` guard, full field caps, unified honeypot & honest receipt | Hardened `api/inquiry.js` (`try/catch`, 16 KB cap, all-field caps, unified `website_url` honeypot, optional `INQUIRY_STORE_WEBHOOK_URL`, `accepted_for_delivery` status). | Static & JS syntax verified; live Vercel env/inbox test still **NOT VERIFIED** until staging deploy. |
| **P1-1** | Hardcoded English errors & unverified `Verified` role badge | Moved all live errors, statuses, and role labels to `i18n-data.js` (EN/ZH/TH); org-verified badge only renders if server returns `orgVerified: true`. | Verified across EN/ZH/TH. |
| **P1-2** | Invalid `?lang=` hreflang pointing to English canonical | Removed misleading `?lang=` hreflang tags until static `/th/` & `/zh/` URLs are built. | Verified in HTML `<head>`. |
| **P2** | `about.html` connected 4 units with sequential arrows | Replaced with 4 independent parallel unit pillars under Bangkok Hub (`SVG_ABOUT_INDEPENDENT`). | Verified in `about.html`. |
| **Content** | Unit pages lacked PIT/geotech, steel sourcing/bid parity, manufacturer boundaries, and accurate CSL/PDA wording | Rewrote all 4 unit pages with audited service cards, `You Receive`, `Before You Contact Us`, and `Related Insights`. | Verified across all 4 pages. |
| **Insights** | Zero Insights nav, hub, or legacy article indexing | Added `Insights` nav, Home `Latest Insights`, `/insights/index.html` with category filter & 4 verified published articles from `all_sites_articles.json`, and updated `sitemap.xml`. | Verified; full original article HTML bodies must be copied from live repo on staging merge (**NOT VERIFIED** online). |

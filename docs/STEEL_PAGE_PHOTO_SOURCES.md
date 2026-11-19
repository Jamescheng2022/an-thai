# International Steel Sourcing page — photography and claims notes

Status: design-preview assets only. All photos are illustrative editorial images, not evidence of AN-THAI-owned fabrication assets, projects, staff, partners or certifications. Replace with permission-cleared manufacturer photos and supplier-specific captions before using them as partner evidence.

## External photo sources

Photos are remotely embedded in `assets/css/steel-procurement.css`. Unsplash standard free license allows commercial site use, subject to its terms and releases. Each source has been checked as a non-Plus, free-to-use photo. Do not assume model/property/trademark releases.

| Position | Photographer / source | Photo page |
| --- | --- | --- |
| Hero and industrial steel photo | Declan Sun | https://unsplash.com/photos/industrial-interior-with-metal-beams-and-an-overhead-crane-TJ8YzRIiNfg |
| Industrial warehouse photo | Declan Sun | https://unsplash.com/photos/large-empty-industrial-warehouse-interior-with-metal-beams-and-windows-g_dK-Zt9ss0 |
| Fabrication/welding photo | Cemrecan Yurtman | https://unsplash.com/photos/welder-working-on-a-piece-of-metal-in-a-factory-JpzMc-FMUes |
| Steel roof photo | Neon Wang | https://unsplash.com/photos/steel-beams-form-a-complex-roof-structure-tKQ1SYcHpso |
| Complex steel structure photo | Sebastian Schuster | https://unsplash.com/photos/looking-up-at-the-intricate-steel-structure-of-a-bridge-hWBPDlbDstQ |

License: https://unsplash.com/license

## Required acceptance before deployment

- Confirm remote image delivery from Thailand, the EU and mobile connections; localize/compress approved images when possible.
- Verify 320, 390, 768, 1440 px screens, navigation, and CTA behavior using real browser tests.
- Test complete build `node scripts/build-static.cjs`, then `python3 scripts/check-site.py`, `python3 scripts/check-locales.py`, `node scripts/check-interactions.cjs` (and any current CI checks).
- The page intentionally makes no steel supplier certification, engineering licensing, own-factory, active laboratory accreditation or named project claims.
- FAQ text is visible and grounded; structured data intentionally omits FAQ schema until legal and site-wide review.
- It is English-only in this first review; existing zh/th pages stay untouched and may link to the English steel page. Add approved translations in a later phase.
- Contact links preserve existing mailto-only inquiry behavior. No client-side transmission, no backend, no automatic email sends.
- PR must not be merged or deployed without the owner's / AGY's explicit review.
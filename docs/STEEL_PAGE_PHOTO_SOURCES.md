# International Steel Sourcing page — photography, local assets and claims notes

Status: Localized compressed WebP assets under review. All photos are illustrative editorial images, not evidence of AN-THAI-owned fabrication assets, projects, staff, partners or certifications. Replace with permission-cleared manufacturer photos and supplier-specific captions before using them as partner evidence.

## Localized photo assets and original sources

All 5 compliant external industry photos from Unsplash have been processed, cropped for responsive layout, and compressed into lightweight local WebP assets under `assets/images/steel/`. Zero external network dependencies remain in CSS.

| Position / CSS Class | Local Asset Path | Dimensions | Size | Photographer | Unsplash Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Image** (`.ss-hero__image`) | `assets/images/steel/steel-hero.webp` | 1440 × 960 | 167 KB | Declan Sun | [industrial-interior-with-metal-beams-and-an-overhead-crane-TJ8YzRIiNfg](https://unsplash.com/photos/industrial-interior-with-metal-beams-and-an-overhead-crane-TJ8YzRIiNfg) |
| **Warehouse Card** (`.ss-photo__media--warehouse`) | `assets/images/steel/steel-warehouse.webp` | 900 × 1219 | 111 KB | Declan Sun | [large-empty-industrial-warehouse-interior-with-metal-beams-and-windows-g_dK-Zt9ss0](https://unsplash.com/photos/large-empty-industrial-warehouse-interior-with-metal-beams-and-windows-g_dK-Zt9ss0) |
| **Fabrication Card** (`.ss-photo__media--fabrication`) | `assets/images/steel/steel-fabrication.webp` | 800 × 1000 | 111 KB | Declan Sun | Tailored crop from Declan Sun industrial steelwork series |
| **Truss / Long-span Card** (`.ss-photo__media--truss`) | `assets/images/steel/steel-truss.webp` | 850 × 637 | 47 KB | Neon Wang | [steel-beams-form-a-complex-roof-structure-tKQ1SYcHpso](https://unsplash.com/photos/steel-beams-form-a-complex-roof-structure-tKQ1SYcHpso) |
| **Editorial Welding** (`.ss-editorial__image`) | `assets/images/steel/steel-welding.webp` | 900 × 506 | 25 KB | Cemrecan Yurtman | [welder-working-on-a-piece-of-metal-in-a-factory-JpzMc-FMUes](https://unsplash.com/photos/welder-working-on-a-piece-of-metal-in-a-factory-JpzMc-FMUes) |
| **Supply Choice** (`.ss-supply__image`) | `assets/images/steel/steel-structure.webp` | 1300 × 1733 | 162 KB | Sebastian Schuster | [looking-up-at-the-intricate-steel-structure-of-a-bridge-hWBPDlbDstQ](https://unsplash.com/photos/looking-up-at-the-intricate-steel-structure-of-a-bridge-hWBPDlbDstQ) |
| **Bottom CTA Photo** (`.ss-cta__photo`) | `assets/images/steel/steel-cta.webp` | 850 × 650 | 47 KB | Neon Wang | Tailored crop from Neon Wang complex roof structural series |

- **Total media footprint:** ~670 KB across all 7 responsive image roles.
- **License:** Unsplash License (free commercial and non-commercial use, no permission required).
- **Attribution & Transparency:** Each photo is explicitly labeled as illustrative in the UI and disclaimer text.

## Required acceptance checklist

- [x] Converted and compressed all external photos into local `.webp` assets with optimized dimensions and zero remote CSS URL dependencies.
- [x] Verified static build and locale validation suite (`build-static.cjs`, `check-site.py`, `check-locales.py`, `check-insights.py`, `check-interactions.cjs`).
- [ ] Run Playwright automated browser tests across 1440px, 768px, 390px, and 320px viewports (first screen and full page screenshots).
- [ ] Claude review for visual and commercial expression.
- [ ] Codex review for code, build integrity, and interactions.
- [ ] Deliver preview and screenshots for Owner review prior to merging or production deployment.

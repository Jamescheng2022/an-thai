# Adding a New Visual Theme (`anthai-site-themes@1.0.0`)

The theme kit separates visual presentation and optional progressive-enhancement motion from core business copy, SEO, EN/ZH/TH localization, and SourceRating/Resend inquiry handling.

## 3-Step Contract (0 Business-Code Changes)

1. **Create Preset Folder**: Add `assets/themes/presets/<id>/theme.css` (`<= 8 KB` raw / `<= 2.5 KB` gzip) scoped under `html[data-theme="<id>"]`.
2. **Optional Light Motion Hook**: Add `assets/themes/presets/<id>/preset.js` (`<= 2.0 KB` raw / `<= 0.9 KB` gzip). Respect `window.ANTHAI_THEME_KIT.prefersReducedMotion()` and animate only `transform` and `opacity` (zero WebGL/Canvas, zero fake numeric test readings on schematics).
3. **Register in Manifest**: Add one entry under `presets` in `themes/manifest.json`, then run `node scripts/check-themes.cjs` and `node scripts/build-static.cjs` to enforce byte budgets automatically.

## Applying a Preset to a Tenant (`build-tenant.cjs`)

In `config/tenants/<slug>.json`, add 1 line:

```json
"theme": "blueprint"
```

Core business LOC added: **0 lines**.

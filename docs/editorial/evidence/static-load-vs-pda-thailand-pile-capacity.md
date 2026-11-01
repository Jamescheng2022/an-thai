# Technical and editorial evidence — static-load-vs-pda-thailand-pile-capacity

**Status:** unpublished editorial draft, 2026-11-01; no completed production article URL. **Target:** AN-THAI Engineering Insights. **Audience:** Thai project designers, owners/QA, supervision engineers, pile contractors. **Owner intent:** adapt 2026-10-31 Thai/Chinese PDA-vs-SLT research into a technically rigorous, visual professional article, then independent review and original Claude Lead publication lane. Source photographs/weight slips are not reproduced in this review package because downstream public re-use permission and redaction have not been established.

## Primary sources and interpretation gates

1. **Thailand DPT standard, มยผ.1106-64 §6.1–6.4**, https://www.audit.go.th/sites/default/files/files/purchase/%E0%B8%A1%E0%B8%B2%E0%B8%95%E0%B8%A3%E0%B8%90%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B8%B3%E0%B8%AB%E0%B8%99%E0%B8%94%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%A9%E0%B8%93%E0%B8%B0%E0%B9%80%E0%B8%89%E0%B8%9E%E0%B8%B2%E0%B8%B0%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B8%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B9%83%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B8%AD%E0%B8%B2%E0%B8%84%E0%B8%B2%E0%B8%A3_1.pdf : references มยผ.1251 static and มยผ.1252 dynamic; §6.3 static method where the design/project specifications do not detail the test method. It is a standard and its applicability to a particular project must be established, **not** a claimed blanket legal mandate for every private project. Extracted text cross-checked against government-hosted PDF; browser screenshot endpoint returned size error, so no screenshot approval claim.
2. **Chulalongkorn University thesis (1996)**, https://digital.car.chula.ac.th/chulaetd/27258/ : Bangkok Y=0.963X, R²=.85; Rayong Y=1.172X, R²=.68 for the author's specific definition of CAPWAP and interpreted static capacity. Not a general accuracy percentage, per-pile error or current code calibration.
3. **Li Sa et al. 2016, 92 paired piles** https://dxkjxb.cqu.edu.cn/EN/Y2016/V12/I5/1423 : approximately ±50% study-level ratio fluctuation, NOT every pile error and NOT a Thai accuracy figure.
4. **Liu et al. 2022 Foshan PHC study** https://www.aeeisp.com/slyjzgcxb/article/id/d626d7ce-557c-43a7-96ab-98231a992cb4?viewType=citedby-info : cited comparison difference 7.1%-25.2% for the studied piles, NOT an industry acceptance limit.
5. **ASTM D4945-26** https://store.astm.org/d4945-26.html : study method measures impact force/velocity and estimates static resistance indirectly. Never reproduce or claim to license ASTM standard text. **ASTM D1143/D1143M-20** https://store.astm.org/d1143_d1143m-20.html : static compressive load and movement, apparatus and safety/engineering approval. Confirm selected editions with project specs.
6. **ISSMGE 2026 Thai comparison** https://www.issmge.org/publications/publication/comparisons-of-rapid-load-test-dynamic-load-test-and-static-load-test-on-piles-in-a-clayey-ground-in-thailand : contextual reference that alternatives can be compared; no invented full-paper numerical conclusions.

7. **China GB 55003-2021 §5.2.5**, https://gf.cabr-fire.com/m/article-39188.htm : under the Chinese design framework, single-pile ultimate axial resistance standard value determined through a static test; slower maintained-load protocol specified. Does **not** create Thai project duties.
8. **China JGJ 106-2014 §§3.3.4–3.3.6**, https://gf.cabr-fire.com/m/article-15286.htm : risk-conditional static testing and alternative/supplementary high-strain testing under specified conditions. The mentioned 1% / minimum 3 (or 2 for projects below 50) and 5% / minimum 5 belong to this Chinese standard's acceptance contexts ONLY. Do not transplant as Thai requirements. Confirm current Chinese applicability if cited as a live mandate in China; this article uses it as a historical/comparative 2014 reference.

## 2026-10-31 underlying owner research and China archive

- Original source deck: `AnThai_Pile_Testing_Engineer_Exchange_15slides_CORRECTED_BIG_BAGS_2026-10-31.pptx`, previously uploaded in conversation/library. Its slide 10 displays *actual* large netted earth bags, not small cement/sand bags; weighing slips displayed in that reference contain 5484, 5928, 6256, 6314 and 6614 kg records. Slide 11 expressly states that the photos/slips do not verify applied load, reaction safety or settlement quality.
- Exact archive photos and slips are **not attached here** and the art package uses **original schematics only**. Public reuse, photo origin, client/project attribution, readable personnel/number plates/contractor branding and weigh-slip identifiers require separate authorization/redaction. Editorial article references these as *archive examples* without treating them as independent validation or Thai field performance.
- Avoid earlier incorrect photographs of many small sandbags, unverified claims of every bag being exactly 5 tonnes, and any reuse of third-party field images without license.

## Visual file contract

- Cover = 1 local original SVG; body = 6 distinct original local SVG figures, with independent mobile variants for Thai research, PDA quality and test-decision figures (total 10 SVG files).
- Every figure is schematic and labelled non-scale; no made-up test traces, actual jobsite capacities, safety factors or apparatus dimensions. All asset SVGs are newly authored here for AN-THAI; reuse rights: original editorial work, not derivative of third-party site photos.
- Browser and build check of exact new PR SHA, independent engineering/Thai-term review, image QA and site preview are STILL REQUIRED. Only the site publisher may move approved JSON from `drafts/insights/` to `content/insights/` after final review and then check production loading on 390/820/1363 px widths.

## Editorial gates before publication

- Check the statistical attribution and definitions (especially Y/X and difference ratio); confirm exact applicability of DPT §6.3 in relevant contracts; confirm whether a Thai-language summary is wanted without implying a Thai translation of the full English article.
- Confirm pile-testing CTA route on live site; do not invent PE credentials/AnThai client projects or claim owner-supplied Chinese archive belongs to AN-THAI.
- Re-run `node scripts/build-static.cjs`, `python scripts/check-insights.py` after moving to publishable content. Review images visually in mobile viewport, links and public sitemap. Drafts are currently intentionally excluded from production build.

**No automatic merge, production deploy or true-public URL is claimed by this source upload.**

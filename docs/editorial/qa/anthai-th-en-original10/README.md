## 2026-11-07 owner-authorized revision and release

Owner follow-up: “修改后上线” (correct and publish). The prior HOLD applies to the historical REVIEW PDF, not the corrected edition described below.

- Corrected ten-page edition: `assets/downloads/an-thai-engineering-brochure-th-en.pdf`.
- Revision source, original-vs-corrected contact sheet and validation: [revision-20261107](revision-20261107/RELEASE.md).
- Original CN/EN PDF is unchanged and remains available. The rejected six-page design is not linked.
- Publication is owner-authorized editorial release, not native-Thai engineering language certification. No verified LINE Official Account claim is made.

---

# AN-THAI Original-layout Thai/English brochure — visual QA draft

Owner instruction: keep the original 10-page Chinese/English brochure's photo sequence and blue-white image composition. Do **not** replace it with the rejected six-page newly designed PDF.

## Exact sources
- Original official source: `assets/downloads/an-thai-engineering-brochure-cn-en.pdf` on main, **unchanged**.
- Review derivative (TEN pages, same A4 page geometry): `assets/downloads/an-thai-engineering-brochure-th-en-original10-REVIEW.pdf`, approximately 4.1 MB.
- Side-by-side visual comparison: `docs/editorial/qa/anthai-th-en-original10/compare_original_vs_thai.jpg`.
- Two region/translation JSON files (180 manually placed Thai text regions) and the Python/Fitz reconstruction script under this folder. Do not commit/share fonts. The script now reuses the font already embedded in the existing review PDF in a temporary directory, or accepts an explicit local --font path. No Windows paths are required.

## Honest quality status / no automatic publish
- This is a **QA DRAFT**, not signed off for Thai language or exact visual perfection.
- The original is a flattened scanned/image PDF with **no editable source layers** (10 pages, each consists of one embedded image). The source images/English are retained under the same layout; selected Chinese labels were masked in precise rectangles and replaced with a selectable Thai text layer.
- Internal automated QA PASS: 10 A4 pages, 180 Thai regions, 3944 Thai Unicode chars extracted from the PDF, none of the text regions reported renderer overflow, selectable LINE/email hyperlinks present.
- Important: some tiny Chinese characters may remain in technical illustrations; several subcaption translations are visually small at full-page scale, and some retouched areas still differ from the original pixels. Compare **each page** with the original before calling the result finished. No publication permission is implied by successful machine validation.
- Some original English captions and photographs are flattened pixels. They have **not** been retyped or reauthored. Page 10 obsolete contact numbers/163.com and WeChat QR area were covered with the current business mobile, anthaicheng@gmail.com, LINE ID rachada2018, and Bangkok/Thailand. Do not imply LINE is a verified official company account; user supplied ID for public contacts, but actual account identity must be confirmed in LINE.
- Original brochure must remain publicly linked until this derivative receives a proper Thai professional + visual editorial acceptance. A 6-page alternative `assets/downloads/an-thai-engineering-profile-th-en-2026.pdf` was rejected by owner and removed from public navigation in PR #22; do not restore it.

## Editorial requirement
Finish native Thai terminology and visual QA across **all 10 source pages**; correct any remaining Chinese/English overlap and tiny illegible captions in the **same original-layout lane**, not a redesigned brochure. After final authorization only, promote the reviewed PDF to the user-visible Thai/English brochure link, keeping the original CN/EN PDF available.

## Cloud rebuild and legibility check (2026-11-04)

Run from any directory:

```sh
python3 docs/editorial/qa/anthai-th-en-original10/build_original_layout_th_en.py --output-dir /tmp/anthai-brochure-review
```

Requires PyMuPDF, Pillow and numpy; unused OpenCV dependency removed. Source/region files resolve relative to this repository. The command creates an isolated QA PDF and page previews, not a new production brochure or website link. It checks all ten page definitions and reports region fits separately from small live text.

Cloud rebuild: 10 pages, 180 text regions, zero regions below 0.7 fit scale, **56 extracted text spans below 5.5pt**. Combining marks can be separate spans, so 56 is not a count of independent captions. This identifies a legibility risk, not Thai proofreading approval. The existing 10-page layout and English background remain unchanged. Do not publish until every small caption and remaining Chinese diagram label has been visually checked and Thai language acceptance is complete.

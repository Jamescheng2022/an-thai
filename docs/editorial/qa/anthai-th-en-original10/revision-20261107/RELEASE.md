# Original ten-page Thai-English brochure: corrected edition

Owner authorized correction and publication with “修改后上线” on 2026-11-07 (Asia/Shanghai). This continues PR #23 and preserves the existing ten-page photo sequence, page dimensions, blue-white visual structure and original CN/EN download. The six-page alternative is not restored.

## Corrections

- Corrected low-strain versus low-force wording, downward incident stress wave versus reflected wave, driving-stress assessment, and wave-equation analysis.
- Restored the four CSL steps and four outputs; restored plate-load workflow and subgrade-reaction output; restored the four laboratory capability lists including CBR, consolidation, UU/CU/CD and NDT.
- Replaced affected bilingual text blocks locally, retaining their English meaning and the original positions/columns. No photographs or technical drawings were regenerated. Existing English in the scanned background remains where not part of a repaired text block.
- Added dictionary-based Thai word-break opportunities using libthai. Text is not automatically shrunk to fit. A failed fit stops the release build.
- Cleaned the identified residual Chinese annotations, original QR code and obsolete contact block. Retained the owner-supplied telephone, Gmail and LINE ID; added clickable telephone/email/LINE links. No replacement QR code or Official Account claim was invented.
- Website home download card, navigation download and footer download use the corrected TH/EN edition. An explicit original CN/EN download remains in the same profile section, translated in all three website languages.

## Verification

- Both source and corrected PDFs have exactly ten pages and identical page dimensions.
- All ten original embedded page-image streams are byte-identical in the new PDF. The original CN/EN file SHA-256 remains `04848cb6ef00f66041cbc9780bd4652b24995a07c1296834465bddd324a27698`.
- 220 live text boxes, zero overflow. Minimum live text size 6.5pt; zero extracted text spans below 5.5pt (previous draft: 56). Dense diagram captions remain smaller than body copy; the original scanned English/photographs are inherently low resolution and are not falsely described as newly typeset throughout.
- All ten original/revised pages were rendered and visually compared. Corrections were followed by a second pass on affected pages; local evidence is [comparison.jpg](comparison.jpg).
- `node scripts/build-static.cjs`: passed, 24 localized base pages, zero missing translations.
- `python scripts/check-site.py`: passed.
- `python scripts/check-locales.py`: passed, 26 generated pages and 974 local links/assets.
- PDF hashes, dimensions-related checks and measurements: [verification.json](verification.json).

## Remaining factual limits

This is an owner-authorized editorial release. It is **not** a native-Thai engineer's final language certification; that review has not been obtained. The LINE ID is consistent with the owner-supplied website contact, but its account identity was not independently authenticated. The location remains Bangkok, Thailand rather than inserting an unconfirmed full postal address. Original company claims about partner laboratories, accreditation, experience and the Managing Director role are retained in context; this task does not independently certify those business claims.

## Rebuild

```sh
python docs/editorial/qa/anthai-th-en-original10/revision-20261107/build.py --output-dir /tmp/anthai-corrected
```

Requires PyMuPDF and system libthai. Reuses the font embedded in the historical review PDF temporarily; no font is committed separately. Original scanned image streams are retained without recompression. The script writes a separate candidate, text-fit records and ten PNG previews. The versioned publication file is copied only after the render/content checks pass.

## Rollback

Revert the publication commit to restore the previous homepage download target. The original CN/EN PDF remains unchanged throughout. Keep both the original audit and historical review derivative as traceable evidence; they are not the advertised corrected edition.

# Photo-source reconciliation — PR #20 continuation

The 2 November review correctly rejected repeated photographic subjects.

- PIT: cover now contains only the two field-team photographs. Body contains the independent method-scope diagram, traceability checklist and sensor photograph. The old worker-body crop was removed.
- SLT/PDA: cover now contains only the static reaction-frame photograph. Body retains the separate PDA apparatus composite, measurement comparison, Thai research chart and China bag reference.
- All cover/body images declare original-subject `source_visual_ids`. The publication gate rejects shared IDs, including individual panels of a cover montage. Metadata requires human verification: this is not photographic recognition.
- Source photographs remain the existing company-supplied brochure pixels. Resizing does not add photographic detail. PIT cover source is 480 × 290; static cover source is 575 × 350. Output is 1000px wide for the existing layout; no AI enhancement or invented site image. Higher resolution originals would improve desktop sharpness.
- Preserve all current production contact/LINE links and the restored original CN/EN brochure by merging current main into this existing branch. The rejected six-page brochure is not relinked.
- Not publication approval; exact-final-commit independent review and production readback remain required.

## 2026-11-05 pixel-only correction by original editorial image lane

The independent Codex review of `b769190` found a triangular sliver of a third, pile-head sensor source photograph at the left of the PIT cover, contrary to the two original-subject IDs. This was a true visual provenance defect, not a false-positive file-name match.

The existing committed `pit-team-cover.webp` (1000 × 604) was used as the **only** input. Its right-hand, personnel-only portion was cropped in source-image coordinates to `(left=230, top=70, right=1000, bottom=535)`, then resized with Lanczos to 1000 × 604 and saved as WebP. That crop removes the entirety of the leftmost sensor/soil/rebar-photo panel and retains the site-documentation worker and the two personnel beside the pile. This is a pixel-only reframe of the already-authorized brochure montage; no AI fill, masking, object fabrication, or new project claim. Existing `source_visual_ids` (`brochure-pit-field-documentation`, `brochure-pit-field-team`) still identify precisely the retained visual subjects; the separate body sensor photo is not in the cover. The image remains a low-resolution brochure crop presented at 1000 px layout width, not a newly high-resolution original or another informative body figure.

The article JSON still declares the actual file dimensions (1000 × 604), original brochure limitations and distinct body-visual IDs. The previous singular-`figure` anti-duplication code fix in commit `3c66bac` is retained. Final exact-commit independent Codex review, Claude Lead editorial acceptance, mobile 320/390/820/1363px visual QA and authorized publisher merge/deploy remain required; no production change is authorized by this file note.

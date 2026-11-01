"""Photo-first publication contract for AN-THAI Insights (no extra packages)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES = sorted((ROOT/"content/insights").glob("*.json"))
ERRORS = []
for source in ARTICLES:
    article = json.loads(source.read_text(encoding="utf-8"))
    slug = article.get("slug",source.stem)
    lead = article.get("image","")
    if not lead.endswith((".webp",".png",".jpg",".jpeg")):
        ERRORS.append(f"{slug}: lead must be a readable photographic raster, not an SVG-only placeholder")
    if article.get("image_width",0) < 1000:
        ERRORS.append(f"{slug}: lead image must be at least 1000px wide")
    if not article.get("image_caption","").strip() or not article.get("image_alt","").strip():
        ERRORS.append(f"{slug}: cover needs meaningful alt text and provenance caption")
    all_figs = [f for s in article.get("sections",[]) for f in s.get("figures",[])]
    photos = [f for f in all_figs if f.get("image","").endswith((".webp",".png",".jpg",".jpeg"))]
    charts = [f for f in all_figs if f.get("image","").endswith(".svg")]
    if not photos:
        ERRORS.append(f"{slug}: no real in-body contextual photo")
    if len(charts)>2:
        ERRORS.append(f"{slug}: {len(charts)} code-drawn SVGs overwhelm the photo-first article; edit down to the meaningful charts")
    for f in photos:
        if not f.get("declaration","").strip() or not f.get("caption","").strip():
            ERRORS.append(f"{slug}: contextual photo missing caption or provenance")
        if min(f.get("width",0),f.get("height",0)) < 260:
            ERRORS.append(f"{slug}: contextual photo too small to render crisply")
if ERRORS:
    raise SystemExit("\n".join("FAIL: "+item for item in ERRORS))
print(f"PASS: photo-first editorial QA for {len(ARTICLES)} published Insights articles")

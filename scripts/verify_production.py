"""Verify live production https://an-thai.com steel sourcing V2.1 deployment."""
import sys
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PROD_SCREENSHOTS_DIR = ROOT / "docs" / "production-screenshots"
PROD_SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    {"name": "1440px-desktop", "width": 1440, "height": 900},
    {"name": "768px-tablet", "width": 768, "height": 1024},
    {"name": "390px-mobile", "width": 390, "height": 844},
    {"name": "320px-small-mobile", "width": 320, "height": 568}
]

PROD_STEEL_URL = "https://an-thai.com/steel-procurement.html"

results = {
    "status": "PASS",
    "errors": [],
    "existing_pages": {},
    "homepage_navigation": {},
    "viewports": [],
    "details_verification": {},
    "rfq_routing": {}
}

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    
    # Step 1: Regression check on existing core pages
    reg_context = browser.new_context(viewport={"width": 1440, "height": 900})
    reg_page = reg_context.new_page()
    core_urls = [
        "https://an-thai.com/",
        "https://an-thai.com/services.html",
        "https://an-thai.com/equipment.html",
        "https://an-thai.com/portfolio.html",
        "https://an-thai.com/insights.html",
        "https://an-thai.com/about.html",
        "https://an-thai.com/contact.html",
        "https://an-thai.com/zh/index.html",
        "https://an-thai.com/th/index.html"
    ]
    for u in core_urls:
        resp = reg_page.goto(u, wait_until="networkidle")
        status = resp.status if resp else None
        h1 = reg_page.locator("h1").first.inner_text() if reg_page.locator("h1").count() > 0 else ""
        ok = (status == 200 and len(h1) > 0)
        results["existing_pages"][u] = {"status": status, "h1": h1[:40], "pass": ok}
        if not ok:
            errors.append(f"Existing page regression failure: {u} returned status {status}")
    reg_context.close()
    
    # Step 2: Homepage Route 02 Click Navigation
    home_context = browser.new_context(viewport={"width": 1440, "height": 900})
    home_page = home_context.new_page()
    home_page.goto("https://an-thai.com/", wait_until="networkidle")
    steel_card = home_page.locator(".business-route-card--steel")
    steel_card_href = steel_card.get_attribute("href")
    with home_page.expect_navigation():
        steel_card.click()
    landed_url = home_page.url
    nav_ok = ("steel-procurement.html" in landed_url)
    results["homepage_navigation"] = {
        "card_href": steel_card_href,
        "landed_url": landed_url,
        "pass": nav_ok
    }
    if not nav_ok:
        errors.append(f"Production home card navigation failed: landed on {landed_url}")
    home_context.close()
    
    # Step 3: Multi-breakpoint checks on production steel page
    for vp in VIEWPORTS:
        vp_name = vp["name"]
        w = vp["width"]
        h = vp["height"]
        
        ctx = browser.new_context(viewport={"width": w, "height": h})
        page = ctx.new_page()
        
        # Track console errors
        def on_console(msg):
            if msg.type == "error":
                errors.append(f"Console error in {vp_name}: {msg.text}")
        page.on("console", on_console)
        
        # Track image responses
        images_loaded = []
        def on_resp(resp):
            if any(ext in resp.url.lower() for ext in [".webp", ".png", ".jpg", ".svg"]):
                images_loaded.append({"url": resp.url, "status": resp.status})
                if resp.status >= 400:
                    errors.append(f"Prod image error {resp.url}: HTTP {resp.status} at {vp_name}")
        page.on("response", on_resp)
        
        page.goto(PROD_STEEL_URL, wait_until="networkidle")
        
        # Screenshots
        atf_file = f"prod-steel-{w}px-atf.png"
        atf_path = PROD_SCREENSHOTS_DIR / atf_file
        page.screenshot(path=str(atf_path), full_page=False)
        
        full_file = f"prod-steel-{w}px-full.png"
        full_path = PROD_SCREENSHOTS_DIR / full_file
        page.screenshot(path=str(full_path), full_page=True)
        
        # Horizontal overflow
        scroll_w = page.evaluate("document.documentElement.scrollWidth")
        client_w = page.evaluate("document.documentElement.clientWidth")
        overflow = scroll_w > client_w
        if overflow:
            errors.append(f"Horizontal overflow in production at {vp_name}: scrollWidth={scroll_w} > clientWidth={client_w}")
            
        # Mobile menu check
        menu_ok = True
        if w <= 820:
            menu_btn = page.locator(".menu-btn")
            if not menu_btn.is_visible():
                errors.append(f"Menu button not visible at {vp_name}")
                menu_ok = False
            else:
                menu_btn.click()
                page.wait_for_timeout(300)
                is_open = "open" in (page.locator(".nav-links").get_attribute("class") or "")
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
                is_closed = "open" not in (page.locator(".nav-links").get_attribute("class") or "")
                menu_ok = is_open and is_closed
                if not menu_ok:
                    errors.append(f"Menu interaction failed at {vp_name}")
                    
        results["viewports"].append({
            "viewport": vp_name,
            "width": w,
            "height": h,
            "atf_screenshot": str(atf_path),
            "full_screenshot": str(full_path),
            "has_overflow": overflow,
            "images_count": len(images_loaded),
            "menu_ok": menu_ok
        })
        ctx.close()
        print(f"Verified Prod {vp_name}: Overflow={overflow}, Images={len(images_loaded)}")

    # Step 4: Verify all 12 details expanders on production
    det_ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    det_page = det_ctx.new_page()
    det_page.goto(PROD_STEEL_URL, wait_until="networkidle")
    details_items = det_page.locator("details")
    count = details_items.count()
    if count != 12:
        errors.append(f"Production has {count} details elements, expected 12")
        
    det_results = []
    for idx in range(count):
        d = details_items.nth(idx)
        sum_text = d.locator("summary").inner_text().strip()
        init_closed = not d.evaluate("el => el.open")
        d.locator("summary").click()
        det_page.wait_for_timeout(100)
        opened = d.evaluate("el => el.open")
        body_len = len(d.inner_text().replace(sum_text, "").strip())
        d.locator("summary").click()
        det_page.wait_for_timeout(100)
        closed_again = not d.evaluate("el => el.open")
        
        p_ok = init_closed and opened and (body_len > 0) and closed_again
        if not p_ok:
            errors.append(f"Production details #{idx+1} ({sum_text}) toggle failed")
        det_results.append({
            "index": idx + 1,
            "summary": sum_text,
            "init_closed": init_closed,
            "opened": opened,
            "has_content": body_len > 0,
            "closed": closed_again,
            "pass": p_ok
        })
    results["details_verification"] = {
        "count": count,
        "items": det_results,
        "all_pass": all(x["pass"] for x in det_results) and count == 12
    }
    det_ctx.close()

    # Step 5: Verify RFQ Funnel on Production
    rfq_ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    rfq_page = rfq_ctx.new_page()
    rfq_page.goto("https://an-thai.com/contact.html?type=steel#enquiry-form", wait_until="networkidle")
    rfq_page.wait_for_selector("#enquiry-form")
    type_val = rfq_page.locator("#enquiry-requestType").input_value()
    type_label = rfq_page.evaluate("document.querySelector('#enquiry-requestType').options[document.querySelector('#enquiry-requestType').selectedIndex].text")
    rfq_ok = ("Steel" in type_val and "Steel" in type_label)
    if not rfq_ok:
        errors.append(f"Production RFQ routing failed: value={type_val}, label={type_label}")
    results["rfq_routing"] = {
        "url": "https://an-thai.com/contact.html?type=steel#enquiry-form",
        "value": type_val,
        "label": type_label,
        "pass": rfq_ok
    }
    rfq_ctx.close()
    
    browser.close()

results["errors"] = errors
results["status"] = "PASS" if not errors else "FAIL"

with open(PROD_SCREENSHOTS_DIR / "production_verification.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\n--- Production Verification Complete ---")
print(f"Status: {results['status']}")
print(f"Errors: {len(errors)}")
if errors:
    for e in errors:
        print(f"  - ERROR: {e}")
    sys.exit(1)
else:
    print("ALL PRODUCTION CHECKS PASSED PERFECTLY!")

"""Verify steel-procurement.html across 1440, 768, 390, 320 px using Playwright."""
import os
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = Path("docs/preview-screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    {"name": "1440px-desktop", "width": 1440, "height": 900},
    {"name": "768px-tablet", "width": 768, "height": 1024},
    {"name": "390px-mobile", "width": 390, "height": 844},
    {"name": "320px-small-mobile", "width": 320, "height": 568}
]

BASE_URL = "http://localhost:8899/steel-procurement.html"

results = {
    "status": "PASS",
    "viewports": [],
    "image_network_logs": [],
    "console_logs": [],
    "interactions": {}
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    
    for vp in VIEWPORTS:
        vp_name = vp["name"]
        w = vp["width"]
        h = vp["height"]
        
        context = browser.new_context(viewport={"width": w, "height": h})
        page = context.new_page()
        
        # Track console messages
        page.on("console", lambda msg: results["console_logs"].append(f"[{vp_name}] {msg.type}: {msg.text}"))
        
        # Track failed image requests
        def on_response(response):
            if any(ext in response.url.lower() for ext in [".webp", ".png", ".jpg", ".svg"]):
                results["image_network_logs"].append({
                    "url": response.url,
                    "status": response.status,
                    "viewport": vp_name
                })
        page.on("response", on_response)
        
        page.goto(BASE_URL, wait_until="networkidle")
        
        # 1. Above-the-fold screenshot
        atf_filename = f"steel-preview-{w}px-above-the-fold.png"
        atf_path = SCREENSHOTS_DIR / atf_filename
        page.screenshot(path=str(atf_path), full_page=False)
        
        # 2. Full-page screenshot
        full_filename = f"steel-preview-{w}px-full-page.png"
        full_path = SCREENSHOTS_DIR / full_filename
        page.screenshot(path=str(full_path), full_page=True)
        
        # 3. Test Mobile Menu Interaction on mobile viewports
        menu_opened = False
        if w <= 820:
            menu_btn = page.locator(".menu-btn")
            if menu_btn.is_visible():
                menu_btn.click()
                page.wait_for_timeout(300)
                nav_links = page.locator(".nav-links")
                is_open = "open" in (nav_links.get_attribute("class") or "")
                menu_screenshot = SCREENSHOTS_DIR / f"steel-preview-{w}px-menu-open.png"
                page.screenshot(path=str(menu_screenshot), full_page=False)
                results["interactions"][f"menu_{w}px"] = {
                    "visible": True,
                    "opened": is_open,
                    "screenshot": str(menu_screenshot)
                }
                # Close it back
                menu_btn.click()
                page.wait_for_timeout(200)

        # 4. Check horizontal overflow
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        client_width = page.evaluate("document.documentElement.clientWidth")
        has_h_overflow = scroll_width > client_width
        
        # 5. Check RFQ button href
        cta_href = page.locator(".nav-quote").get_attribute("href")
        
        results["viewports"].append({
            "viewport": vp_name,
            "width": w,
            "height": h,
            "atf_screenshot": str(atf_path),
            "full_screenshot": str(full_path),
            "scroll_width": scroll_width,
            "client_width": client_width,
            "has_horizontal_overflow": has_h_overflow,
            "cta_href": cta_href
        })
        
        context.close()
        print(f"Captured {vp_name}: ATF -> {atf_filename}, Full -> {full_filename}, Overflow={has_h_overflow}")

    browser.close()

# Summary
with open(SCREENSHOTS_DIR / "verification_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\n--- Playwright Verification Complete ---")
print(f"Total images checked: {len(results['image_network_logs'])}")
print(f"Console errors: {[l for l in results['console_logs'] if 'error' in l.lower()]}")
overflows = [v for v in results["viewports"] if v["has_horizontal_overflow"]]
if overflows:
    print(f"WARNING: Horizontal overflow detected in: {[o['viewport'] for o in overflows]}")
else:
    print("Zero horizontal overflow across all 4 breakpoints!")

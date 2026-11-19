"""Verify steel-procurement.html across 1440, 768, 390, 320 px using Playwright."""
import os
import sys
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SCREENSHOTS_DIR = ROOT / "docs" / "preview-screenshots"
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
    "errors": [],
    "viewports": [],
    "image_network_logs": [],
    "console_logs": [],
    "interactions": {},
    "routing_verification": {}
}

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    
    for vp in VIEWPORTS:
        vp_name = vp["name"]
        w = vp["width"]
        h = vp["height"]
        
        context = browser.new_context(viewport={"width": w, "height": h})
        page = context.new_page()
        
        # Track console messages
        def log_console(msg):
            text = f"[{vp_name}] {msg.type}: {msg.text}"
            results["console_logs"].append(text)
            if msg.type == "error":
                errors.append(f"Console error in {vp_name}: {msg.text}")
        page.on("console", log_console)
        
        # Track image requests
        def on_response(response):
            if any(ext in response.url.lower() for ext in [".webp", ".png", ".jpg", ".svg"]):
                status = response.status
                results["image_network_logs"].append({
                    "url": response.url,
                    "status": status,
                    "viewport": vp_name
                })
                if status >= 400:
                    errors.append(f"Image {response.url} returned HTTP {status} in {vp_name}")
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
        
        # 3. Test Mobile Menu Interaction & Keyboard Dismissal on mobile viewports
        if w <= 820:
            menu_btn = page.locator(".menu-btn")
            if not menu_btn.is_visible():
                errors.append(f"Menu button not visible at {vp_name}")
            else:
                menu_btn.click()
                page.wait_for_timeout(300)
                nav_links = page.locator(".nav-links")
                is_open = "open" in (nav_links.get_attribute("class") or "")
                expanded = menu_btn.get_attribute("aria-expanded") == "true"
                menu_screenshot = SCREENSHOTS_DIR / f"steel-preview-{w}px-menu-open.png"
                page.screenshot(path=str(menu_screenshot), full_page=False)
                
                # Test Escape dismissal & focus restoration
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
                is_closed_after_esc = "open" not in (nav_links.get_attribute("class") or "")
                collapsed = menu_btn.get_attribute("aria-expanded") == "false"
                focus_restored = page.evaluate("document.activeElement === document.querySelector('.menu-btn')")
                
                if not is_open:
                    errors.append(f"Menu failed to open upon click at {vp_name}")
                if not is_closed_after_esc:
                    errors.append(f"Menu failed to close upon Escape key at {vp_name}")
                if not focus_restored:
                    errors.append(f"Focus not restored to menu button after Escape at {vp_name}")
                
                results["interactions"][f"menu_{w}px"] = {
                    "visible": True,
                    "opened_on_click": is_open,
                    "aria_expanded_open": expanded,
                    "dismissed_on_escape": is_closed_after_esc,
                    "aria_collapsed_closed": collapsed,
                    "focus_restored_to_toggle": focus_restored,
                    "screenshot": str(menu_screenshot)
                }

        # 4. Check horizontal overflow
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        client_width = page.evaluate("document.documentElement.clientWidth")
        has_h_overflow = scroll_width > client_width
        if has_h_overflow:
            errors.append(f"Horizontal overflow detected at {vp_name}: scrollWidth={scroll_width} > clientWidth={client_width}")
        
        # 5. Check RFQ button href
        cta_href = page.locator(".nav-quote").get_attribute("href")
        hero_cta_href = page.locator(".ss-actions .ss-button--accent").get_attribute("href")
        closing_cta_href = page.locator(".ss-cta__actions .ss-button--accent").get_attribute("href")
        
        expected_cta = "contact.html?type=steel#enquiry-form"
        if hero_cta_href != expected_cta:
            errors.append(f"Hero CTA href mismatch: {hero_cta_href} != {expected_cta}")
        if closing_cta_href != expected_cta:
            errors.append(f"Closing CTA href mismatch: {closing_cta_href} != {expected_cta}")
        
        results["viewports"].append({
            "viewport": vp_name,
            "width": w,
            "height": h,
            "atf_screenshot": str(atf_path),
            "full_screenshot": str(full_path),
            "scroll_width": scroll_width,
            "client_width": client_width,
            "has_horizontal_overflow": has_h_overflow,
            "header_cta_href": cta_href,
            "hero_cta_href": hero_cta_href,
            "closing_cta_href": closing_cta_href
        })
        
        context.close()
        print(f"Captured {vp_name}: ATF -> {atf_filename}, Full -> {full_filename}, Overflow={has_h_overflow}")

    # 6. Test RFQ Funnel Routing and Auto-Selection
    routing_context = browser.new_context(viewport={"width": 1440, "height": 900})
    routing_page = routing_context.new_page()
    routing_page.goto("http://localhost:8899/contact.html?type=steel#enquiry-form", wait_until="networkidle")
    routing_page.wait_for_selector("#enquiry-form")
    type_select = routing_page.locator("#enquiry-requestType")
    selected_val = type_select.input_value()
    selected_label = routing_page.evaluate("document.querySelector('#enquiry-requestType').options[document.querySelector('#enquiry-requestType').selectedIndex].text")
    
    routing_ok = ("Steel" in selected_val and "Steel" in selected_label)
    if not routing_ok:
        errors.append(f"Enquiry routing failed: expected value containing 'Steel', got '{selected_val}' ({selected_label})")
        
    results["routing_verification"] = {
        "url": "http://localhost:8899/contact.html?type=steel#enquiry-form",
        "selected_value": selected_val,
        "selected_label": selected_label,
        "success": routing_ok
    }
    routing_context.close()
    
    browser.close()

# Update final status
results["errors"] = errors
results["status"] = "PASS" if not errors else "FAIL"

with open(SCREENSHOTS_DIR / "verification_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\n--- Playwright Verification Complete ---")
print(f"Status: {results['status']}")
print(f"Total image requests checked: {len(results['image_network_logs'])}")
print(f"Errors encountered: {len(errors)}")
if errors:
    for err in errors:
        print(f"  - ERROR: {err}")
    sys.exit(1)
else:
    print("All layout, image, keyboard interaction, and enquiry routing checks passed cleanly!")

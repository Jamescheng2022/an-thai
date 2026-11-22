"""
AN-THAI V5.3 Enterprise Website Comprehensive Playwright E2E Verification & Visual Evidence Suite.

Runs an authentic in-process HTTP server over production `dist/` and tests 20 pages x 4 viewports (390, 768, 1024, 1440):
- Zero horizontal overflow across all viewports
- Zero broken images
- Zero console errors
- Dropdown & mobile accordion interactivity
- True static multi-language navigation (/zh/ and /th/ locale protection & link routing)
- Inquiry desk drawer open/close
- Inquiry fallback card (WhatsApp direct link + one-click copy brief + email link)
- Full visual evidence screenshot generation for review
"""
import threading
import time
import socketserver
from pathlib import Path
from http.server import SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
SCREENSHOTS_DIR = ROOT / 'artifacts/screenshots'

PAGES = [
    'index.html',
    'testing.html',
    'steel-procurement.html',
    'powder-equipment.html',
    'testing-instruments.html',
    'about.html',
    'contact.html',
    'services.html',
    'equipment.html',
    'portfolio.html',
    'zh/index.html',
    'zh/insights.html',
    'zh/services.html',
    'zh/equipment.html',
    'zh/portfolio.html',
    'th/index.html',
    'th/insights.html',
    'th/services.html',
    'th/equipment.html',
    'th/portfolio.html',
    'cases/index.html',
    'cases/case-template.html',
    'insights/index.html',
    'insights/bored-pile-csl-testing-tube-debonding-anomaly-thailand.html',
    'insights/pit-pretest-site-readiness-owner-checklist.html',
    'insights/static-load-vs-pda-thailand-pile-capacity.html',
    'insights/pile-integrity-test-report-review-checklist.html'
]

VIEWPORTS = [390, 768, 1024, 1440]

KEY_SNAPSHOT_PAGES = [
    ('index.html', 'home_en'),
    ('zh/index.html', 'home_zh'),
    ('th/index.html', 'home_th'),
    ('testing.html', 'unit1_testing'),
    ('steel-procurement.html', 'unit2_steel'),
    ('powder-equipment.html', 'unit3_powder'),
    ('testing-instruments.html', 'unit4_instruments'),
    ('insights/index.html', 'insights_index_en'),
    ('zh/insights.html', 'insights_index_zh'),
    ('contact.html', 'contact')
]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Quiet logs

def start_server():
    handler = partial(QuietHandler, directory=str(DIST))
    httpd = socketserver.TCPServer(('127.0.0.1', 0), handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, port

def run_tests():
    print("=== STARTING V5.3 PLAYWRIGHT E2E & SCREENSHOT SUITE ===")
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    httpd, port = start_server()
    base_url = f"http://127.0.0.1:{port}"
    print(f"Local test server running at {base_url} serving {DIST}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            # 1. Multi-viewport responsive checks (Zero overflow, valid images, visual screenshots)
            for w in VIEWPORTS:
                page.set_viewport_size({"width": w, "height": 900})
                print(f"\n--- Checking Viewport {w}px ---")
                for p_path in PAGES:
                    page.goto(f"{base_url}/{p_path}", wait_until="networkidle")
                    page.wait_for_timeout(40)

                    # Trigger lazy-loaded images by scrolling
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(40)
                    page.evaluate("window.scrollTo(0, 0)")
                    page.wait_for_timeout(20)

                    # Measure horizontal overflow
                    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                    assert overflow <= 1, f"Horizontal overflow on {p_path} @ {w}px: {overflow}px"

                    # Check all images complete and loaded (or fetchable if deferred by browser)
                    imgs_ok = page.evaluate('''async () => {
                        for (const i of Array.from(document.images)) {
                            if (i.complete && (i.naturalWidth > 0 || (i.getAttribute('src') || '').endsWith('.svg'))) continue;
                            try {
                                const res = await fetch(i.src);
                                if (!res.ok) return false;
                            } catch (e) {
                                return false;
                            }
                        }
                        return true;
                    }''')
                    assert imgs_ok, f"Broken image detected on {p_path} @ {w}px"

                # Capture full-page visual evidence snapshots for audit review
                for rel_path, tag in KEY_SNAPSHOT_PAGES:
                    page.goto(f"{base_url}/{rel_path}", wait_until="networkidle")
                    page.wait_for_timeout(50)
                    screenshot_path = SCREENSHOTS_DIR / f"{w}px_{tag}.png"
                    page.screenshot(path=str(screenshot_path), full_page=True)

                print(f"PASS all {len(PAGES)} pages @ {w}px (zero overflow, all images loaded, visual snapshots saved)")

            # 2. Desktop Interactivity Checks @ 1440px
            page.set_viewport_size({"width": 1440, "height": 900})
            page.goto(f"{base_url}/index.html", wait_until="networkidle")
            page.wait_for_timeout(100)

            # 2.1 Services Dropdown
            print("\n--- Testing Desktop Services Dropdown ---")
            drop_btn = page.locator("#desktopServicesBtn")
            drop_menu = page.locator("#desktopServicesMenu")
            assert drop_btn.is_visible()
            drop_btn.click()
            page.wait_for_timeout(60)
            assert drop_btn.get_attribute("aria-expanded") == "true"
            assert not drop_menu.is_hidden()

            # Press Escape to close
            page.keyboard.press("Escape")
            page.wait_for_timeout(60)
            assert drop_btn.get_attribute("aria-expanded") == "false"
            print("PASS: Services dropdown opens and closes via Escape.")

            # 2.2 Language Switcher & Fresh Visitor Locale Protection (B1 Gate)
            print("\n--- Testing Fresh Visitor Static Locale Protection (/zh/ and /th/) ---")
            zh_page = browser.new_page()
            zh_page.goto(f"{base_url}/zh/index.html", wait_until="networkidle")
            zh_lang = zh_page.evaluate("document.documentElement.lang")
            assert zh_lang == "zh-CN", f"Expected zh-CN on /zh/index.html, got {zh_lang}"
            zh_pressed = zh_page.locator('.lang-btn[data-lang="ZH"]').get_attribute("aria-pressed")
            assert zh_pressed == "true", f"ZH button should have aria-pressed=true on /zh/index.html, got {zh_pressed}"

            zh_body_text = zh_page.locator("body").inner_text()
            chinese_chars = len([c for c in zh_body_text if '\u4e00' <= c <= '\u9fff'])
            assert chinese_chars > 300, f"Expected >300 Chinese characters on clean /zh/index.html, got {chinese_chars}"
            print(f"PASS: /zh/index.html rendered with {chinese_chars} Chinese characters in fresh visitor context.")

            # 2.3 Multilingual Navigation Routing (/zh/ -> /zh/insights.html)
            print("\n--- Testing Multilingual Navigation Routing ---")
            zh_page.locator('a[data-page-id="insights"]').first.click()
            zh_page.wait_for_timeout(80)
            assert "/zh/insights.html" in zh_page.url, f"Expected /zh/insights.html, got {zh_page.url}"
            assert "技术专栏" in zh_page.locator("h1").inner_text()
            assert "EN 英文原稿" in zh_page.locator(".insights-grid").inner_text()
            print("PASS: Chinese navigation stays in /zh/ context (/zh/insights.html) with authentic EN origin badges.")
            zh_page.close()

            # 2.4 Inquiry Desk Drawer Open & Close
            print("\n--- Testing Inquiry Desk Drawer Interactivity ---")
            desk_btn = page.locator("[data-open-desk]").first
            desk_btn.click()
            page.wait_for_timeout(100)
            drawer = page.locator("#deskDrawer")
            assert drawer.get_attribute("aria-hidden") == "false"
            assert "is-open" in drawer.get_attribute("class")

            # Close drawer via close button
            close_btn = page.locator("#drawerCloseBtn")
            close_btn.click()
            page.wait_for_timeout(100)
            assert drawer.get_attribute("aria-hidden") == "true"
            print("PASS: Inquiry drawer opens and closes correctly.")

            # 3. Mobile Navigation & Inquiry Fallback UX @ 390px (B5 & P1-4 Gates)
            print("\n--- Testing Mobile Menu & Inquiry Fallback UX @ 390px ---")
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base_url}/index.html", wait_until="networkidle")
            page.wait_for_timeout(100)

            # Mobile menu
            menu_btn = page.locator("#mobileMenuBtn")
            assert menu_btn.is_visible()
            menu_btn.click()
            page.wait_for_timeout(60)
            assert menu_btn.get_attribute("aria-expanded") == "true"

            # Expand mobile services accordion
            mobile_svc_btn = page.locator("#mobileServicesBtn")
            mobile_svc_btn.click()
            page.wait_for_timeout(60)
            assert mobile_svc_btn.get_attribute("aria-expanded") == "true"
            assert page.locator("#mobileServicesPanel").is_visible()
            page.screenshot(path=str(SCREENSHOTS_DIR / "390px_mobile_menu_expanded.png"))
            print("PASS: Mobile menu and services accordion verified at 390px.")

            # Close mobile menu before opening drawer
            menu_btn.click()
            page.wait_for_timeout(60)

            # Inquiry Drawer & WhatsApp Fallback UX (click visible desk button)
            page.locator('#bottomBarDeskBtn').click()
            page.wait_for_timeout(100)
            page.screenshot(path=str(SCREENSHOTS_DIR / "390px_inquiry_drawer_opened.png"))

            # Fill inquiry form in drawer
            page.locator("#drawerLoc").fill("Rayong Industrial Park")
            page.locator("#drawerContact").fill("test@client.com / +66 81 234 5678")
            page.locator("#drawerNotes").fill("Static load test 500 tons x 2 piles, ASTM D1143 standard")

            # Click Email Button -> triggers showInquiryFeedback
            page.locator("#drawerEmailBtn").click()
            page.wait_for_timeout(100)
            fb = page.locator("#drawerFeedback")
            assert fb.is_visible()
            fb_text = fb.inner_text()
            assert "WhatsApp" in fb_text
            assert "info@an-thai.com" in fb_text
            assert page.locator('#drawerFeedback a[href*="wa.me/66902921749"]').is_visible()
            assert page.locator('#drawerFeedback button[data-inquiry-copy]').is_visible()
            page.screenshot(path=str(SCREENSHOTS_DIR / "390px_inquiry_feedback_fallback.png"))
            print("PASS: Inquiry fallback card verified (WhatsApp direct link, Copy Brief button, Email link all active).")

            # Final console error check (zero tolerance, including resource 404s)
            critical_errors = console_errors.copy()
            assert not critical_errors, f"Critical console errors detected: {critical_errors}"

            browser.close()
            print("\n=== ALL V5.3 PLAYWRIGHT E2E & VISUAL TESTS PASSED (100% GREEN) ===")
    finally:
        httpd.shutdown()

if __name__ == '__main__':
    run_tests()

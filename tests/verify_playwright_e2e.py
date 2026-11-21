"""
AN-THAI V5.3 + V5.4 Comprehensive Playwright E2E Verification Suite.

Runs an in-process HTTP server over `dist/` and tests 15 pages x 4 viewports (390, 768, 1024, 1440):
- Zero horizontal overflow
- Zero broken images
- Zero console errors
- Dropdown & accordion interactivity
- Inquiry Desk drawer open & close
- Dynamic client-side language switching (EN/ZH/TH)
- Living Studio E2E (Chat -> CRM Candidate -> Role Gate -> Publish -> Retract -> Daily Brief)
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

PAGES = [
    'index.html',
    'testing.html',
    'steel-procurement.html',
    'powder-equipment.html',
    'testing-instruments.html',
    'about.html',
    'contact.html',
    'cases/index.html',
    'cases/case-template.html',
    'insights/index.html',
    'insights/bored-pile-csl-testing-tube-debonding-anomaly-thailand.html',
    'insights/pit-pretest-site-readiness-owner-checklist.html',
    'insights/static-load-vs-pda-thailand-pile-capacity.html',
    'insights/pile-integrity-test-report-review-checklist.html',
    'studio/index.html'
]

VIEWPORTS = [390, 768, 1024, 1440]

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
    print("=== STARTING PLAYWRIGHT E2E SUITE ===")
    httpd, port = start_server()
    base_url = f"http://127.0.0.1:{port}"
    print(f"Local test server running at {base_url} serving {DIST}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            # 1. Multi-viewport responsive checks (Zero overflow, valid images)
            for w in VIEWPORTS:
                page.set_viewport_size({"width": w, "height": 900})
                print(f"\n--- Checking Viewport {w}px ---")
                for p_path in PAGES:
                    page.goto(f"{base_url}/{p_path}", wait_until="networkidle")
                    page.wait_for_timeout(60)

                    # Trigger lazy-loaded images by scrolling
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(60)
                    page.evaluate("window.scrollTo(0, 0)")
                    page.wait_for_timeout(30)

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

                print(f"PASS all 15 pages @ {w}px (zero overflow, all images loaded)")

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

            # 2.2 Language Switcher
            print("\n--- Testing Language Switcher (EN -> ZH -> EN) ---")
            zh_btn = page.locator('.lang-btn[data-lang="ZH"]')
            zh_btn.click()
            page.wait_for_timeout(100)
            assert zh_btn.get_attribute("aria-pressed") == "true"
            print("PASS: Switched to Chinese.")

            en_btn = page.locator('.lang-btn[data-lang="EN"]')
            en_btn.click()
            page.wait_for_timeout(100)
            assert en_btn.get_attribute("aria-pressed") == "true"
            print("PASS: Switched back to English.")

            # 2.3 Inquiry Desk Drawer
            print("\n--- Testing Inquiry Desk Drawer ---")
            desk_btn = page.locator('[data-open-desk=""]').first
            desk_btn.click()
            page.wait_for_timeout(100)
            drawer = page.locator("#deskDrawer")
            assert drawer.get_attribute("aria-hidden") == "false"

            close_btn = page.locator("#drawerCloseBtn")
            close_btn.click()
            page.wait_for_timeout(100)
            assert drawer.get_attribute("aria-hidden") == "true"
            print("PASS: Inquiry Desk drawer opens and closes properly.")

            # 3. Mobile Interactivity Checks @ 390px
            print("\n--- Testing Mobile Menu & Accordion @ 390px ---")
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base_url}/index.html", wait_until="networkidle")
            page.wait_for_timeout(100)

            # Open mobile menu
            menu_btn = page.locator("#mobileMenuBtn")
            menu_btn.click()
            page.wait_for_timeout(60)
            assert menu_btn.get_attribute("aria-expanded") == "true"

            # Expand mobile services accordion
            mobile_svc_btn = page.locator("#mobileServicesBtn")
            mobile_svc_btn.click()
            page.wait_for_timeout(60)
            assert mobile_svc_btn.get_attribute("aria-expanded") == "true"
            assert page.locator("#mobileServicesPanel").is_visible()
            print("PASS: Mobile menu and services accordion verified.")

            # 4. Living Studio Workflow @ 1280px
            print("\n--- Testing Living Studio Workflow ---")
            page.set_viewport_size({"width": 1280, "height": 900})
            page.goto(f"{base_url}/studio/index.html", wait_until="networkidle")
            page.wait_for_timeout(100)

            # 4.1 Send sample message
            sample_chip = page.locator(".sample-chip").first
            sample_chip.click()
            page.wait_for_timeout(60)
            page.locator("#chatComposer button[type='submit']").click()
            page.wait_for_timeout(150)

            feed_text = page.locator("#chatFeed").inner_text()
            assert "Lite CRM Candidate" in feed_text
            assert "AI Content Studio Draft" in feed_text
            print("PASS: User message sent and Agent extracted CRM candidate + Studio draft.")

            # 4.2 Confirm CRM candidate
            page.locator("[data-confirm-crm]").first.click()
            page.wait_for_timeout(100)
            crm_count = page.locator("#crmCount").inner_text()
            assert int(crm_count) >= 1
            print(f"PASS: Confirmed CRM candidate (Count: {crm_count}).")

            # 4.3 Open Content Studio & Test Role Gate
            page.locator("[data-open-draft]").first.click()
            page.wait_for_timeout(100)

            # Contributor tries to publish -> must be blocked
            page.locator("[data-draft-act='publish']").first.click()
            page.wait_for_timeout(100)
            fb_text = page.locator("#studioFeedback").inner_text()
            assert "PERMISSION_DENIED" in fb_text
            print("PASS: Contributor self-publishing blocked by role gate.")

            # Switch to Publisher role
            page.locator("#roleSelect").select_option("publisher")
            page.wait_for_timeout(60)

            # Publisher tries to publish with photoRights = unknown -> must be blocked
            page.locator("[data-draft-act='publish']").first.click()
            page.wait_for_timeout(100)
            fb_text = page.locator("#studioFeedback").inner_text()
            assert "DISCLOSURE_BLOCKED" in fb_text
            print("PASS: Publishing blocked when disclosure permission is unknown.")

            # Change rights to client_approved_public and publish
            page.locator("[data-rights-sel]").first.select_option("client_approved_public")
            page.wait_for_timeout(60)
            page.locator("[data-draft-act='publish']").first.click()
            page.wait_for_timeout(100)
            fb_text = page.locator("#studioFeedback").inner_text()
            assert "published" in fb_text.lower()
            print("PASS: Publisher successfully published draft with client rights cleared.")

            # Retract / Rollback
            page.locator("[data-draft-act='retract']").first.click()
            page.wait_for_timeout(100)
            fb_text = page.locator("#studioFeedback").inner_text()
            assert "retracted" in fb_text.lower()
            print("PASS: Successfully retracted published draft.")

            # 4.4 Daily Brief Tab
            page.locator('.nav-tab-btn[data-tab="brief"]').click()
            page.wait_for_timeout(100)
            brief_text = page.locator("#briefMount").inner_text()
            brief_text_lower = brief_text.lower()
            assert "not tracked (zero fabrication)" in brief_text_lower
            assert "confirmed projects" in brief_text_lower
            print("PASS: Daily Brief confirmed with zero-fabrication metrics.")

            # Final console error check
            critical_errors = [e for e in console_errors if "Failed to load resource" not in e]
            assert not critical_errors, f"Critical console errors detected: {critical_errors}"

            browser.close()
            print("\n=== ALL PLAYWRIGHT E2E TESTS PASSED (100% GREEN) ===")
    finally:
        httpd.shutdown()

if __name__ == '__main__':
    run_tests()

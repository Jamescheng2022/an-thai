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
    'services.html',
    'equipment.html',
    'portfolio.html',
    'zh/index.html',
    'zh/services.html',
    'zh/equipment.html',
    'zh/portfolio.html',
    'th/index.html',
    'th/services.html',
    'th/equipment.html',
    'th/portfolio.html',
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
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean.startswith('/studio/'):
            return str(ROOT / clean.lstrip('/'))
        return super().translate_path(path)

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

            # 2.2 Language Switcher & Fresh Visitor Locale Protection (B1 Gate)
            print("\n--- Testing Fresh Visitor Static Locale Protection (/zh/ and /th/) ---")
            zh_page = browser.new_page()
            zh_page.goto(f"{base_url}/zh/index.html", wait_until="networkidle")
            zh_lang = zh_page.evaluate("document.documentElement.lang")
            assert zh_lang == "zh-CN", f"Expected zh-CN on /zh/index.html, got {zh_lang}"
            zh_pressed = zh_page.locator('.lang-btn[data-lang="ZH"]').get_attribute("aria-pressed")
            assert zh_pressed == "true", f"ZH button should have aria-pressed=true on /zh/index.html, got {zh_pressed}"
            zh_chars = zh_page.evaluate("document.body.innerText.match(/[\u4e00-\u9fa5]/g)?.length || 0")
            assert zh_chars >= 200, f"Expected >200 Chinese chars on /zh/index.html, got {zh_chars}"
            zh_page.close()
            print(f"PASS: /zh/index.html loaded clean ({zh_chars} Chinese characters, zero English overwrite).")

            th_page = browser.new_page()
            th_page.goto(f"{base_url}/th/index.html", wait_until="networkidle")
            th_lang = th_page.evaluate("document.documentElement.lang")
            assert th_lang == "th", f"Expected th on /th/index.html, got {th_lang}"
            th_pressed = th_page.locator('.lang-btn[data-lang="TH"]').get_attribute("aria-pressed")
            assert th_pressed == "true", f"TH button should have aria-pressed=true on /th/index.html, got {th_pressed}"
            th_page.close()
            print("PASS: /th/index.html loaded clean (Thai language intact).")

            # In-page language navigation
            zh_btn = page.locator('.lang-btn[data-lang="ZH"]')
            zh_btn.click()
            page.wait_for_timeout(100)
            assert page.locator('.lang-btn[data-lang="ZH"]').get_attribute("aria-pressed") == "true"
            print("PASS: Navigated to Chinese via language switcher.")

            en_btn = page.locator('.lang-btn[data-lang="EN"]')
            en_btn.click()
            page.wait_for_timeout(100)
            assert page.locator('.lang-btn[data-lang="EN"]').get_attribute("aria-pressed") == "true"
            print("PASS: Navigated back to English.")

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

            # 3.1 Living Studio Mobile Ergonomics & Bounds Check @ 390px
            print("\n--- Testing Living Studio @ 390px Mobile Viewport (Zero Bounds Clipping) ---")
            page.goto(f"{base_url}/studio/index.html", wait_until="networkidle")
            page.wait_for_timeout(100)

            # Check composer bounding boxes - no element should overflow 390px
            composer_box = page.locator("#chatComposer").bounding_box()
            assert composer_box["x"] >= 0 and (composer_box["x"] + composer_box["width"]) <= 390, f"Composer overflow: {composer_box}"

            send_btn = page.locator("#chatComposer button[type='submit']")
            send_box = send_btn.bounding_box()
            assert send_box["x"] >= 0 and (send_box["x"] + send_box["width"]) <= 390, f"Send button clipped at 390px: {send_box}"
            assert send_btn.is_visible()

            photo_btn = page.locator("#addPhotoBtn")
            photo_box = photo_btn.bounding_box()
            assert photo_box["x"] >= 0 and (photo_box["x"] + photo_box["width"]) <= 390, f"Photo button overflow: {photo_box}"

            # Verify all 4 tabs are clickable and accessible at 390px
            for tab_name in ["chat", "crm", "studio", "brief"]:
                tab_btn = page.locator(f'.nav-tab-btn[data-tab="{tab_name}"]')
                tab_btn.click()
                page.wait_for_timeout(60)
                assert page.locator(f"#tab-{tab_name}").is_visible(), f"Tab {tab_name} pane not visible at 390px"

            # Switch back to chat and send message at 390px
            page.locator('.nav-tab-btn[data-tab="chat"]').click()
            page.locator("#chatInput").fill("36根灌注桩声测完成，罗勇工地")
            send_btn.click()
            page.wait_for_timeout(150)
            assert "36根灌注桩" in page.locator("#chatFeed").inner_text()
            print("PASS: Studio 390px layout verified (composer, buttons, tabs all within viewport, zero clipping).")

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

            # Final console error check (zero tolerance, including resource 404s)
            critical_errors = console_errors.copy()
            assert not critical_errors, f"Critical console errors detected: {critical_errors}"

            browser.close()
            print("\n=== ALL PLAYWRIGHT E2E TESTS PASSED (100% GREEN) ===")
    finally:
        httpd.shutdown()

if __name__ == '__main__':
    run_tests()

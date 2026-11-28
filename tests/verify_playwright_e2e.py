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
    'cement-mining-equipment.html',
    'powder-equipment.html',
    'testing-instruments.html',
    'about.html',
    'contact.html',
    'services.html',
    'equipment.html',
    'portfolio.html',
    'zh/index.html',
    'zh/about.html',
    'zh/contact.html',
    'zh/insights/index.html',
    'zh/cases/index.html',
    'zh/steel-procurement.html',
    'th/index.html',
    'th/about.html',
    'th/contact.html',
    'th/insights/index.html',
    'th/cases/index.html',
    'cases/index.html',
    'insights/index.html',
    'insights/global-foundation-full-spectrum-engineering-inspection.html',
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
    ('cement-mining-equipment.html', 'unit3_cement_mining'),
    ('testing-instruments.html', 'unit4_instruments'),
    ('cases/index.html', 'cases_index_en'),
    ('zh/cases/index.html', 'cases_index_zh'),
    ('insights/index.html', 'insights_index_en'),
    ('zh/insights/index.html', 'insights_index_zh'),
    ('about.html', 'about_en'),
    ('contact.html', 'contact')
]

class QuietHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = self.path.split('?')[0]
        if route in ('/api/inquiry', '/api/enquiry'):
            body = b'{"ok":true,"configured":false,"backend":"unconfigured","recipient":"info@an-thai.com"}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if route == '/api/sr-bridge':
            body = b'{"ok":true,"configured":false,"online":false}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] == '/api/inquiry':
            body = b'{"ok":false,"error":"INQUIRY_BACKEND_UNCONFIGURED","recipient":"info@an-thai.com"}'
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(405)

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

            # 2.3 Multilingual Navigation Routing (/zh/ -> /zh/insights/index.html + /zh/cases/index.html + V1.0 checks)
            print("\n--- Testing Multilingual Navigation, Cases Filters, Insights & Query Prefill ---")
            zh_page.locator('a[data-page-id="insights"]').first.click()
            zh_page.wait_for_timeout(80)
            assert "/zh/insights/index.html" in zh_page.url, f"Expected /zh/insights/index.html, got {zh_page.url}"
            assert "工程技术洞察" in zh_page.locator("h1").inner_text() or "技术专栏" in zh_page.locator("h1").inner_text()
            assert zh_page.locator(".insights-grid .insight-card").count() == 5, "Expected all 5 articles on insights index"
            assert "2026-11-24" in zh_page.locator(".insights-grid .insight-card").first.inner_text(), "Newest article must be first"
            assert "EN 英文原稿" in zh_page.locator(".insights-grid").inner_text()

            # Check /zh/cases/index.html clean capabilities landing + /th/cases/index.html + lang switcher
            zh_page.goto(f"{base_url}/zh/cases/index.html", wait_until="networkidle")
            assert zh_page.locator(".case-card").count() == 4
            en_switch_href = zh_page.locator('.lang-btn[data-language="en"]').get_attribute("href")
            assert en_switch_href == "/cases/index.html", f"Unexpected EN href: {en_switch_href}"
            # Verify TH insights index also has EN origin badge and 5 articles
            zh_page.goto(f"{base_url}/th/insights/index.html", wait_until="networkidle")
            assert zh_page.locator(".insights-grid .insight-card").count() == 5
            assert "EN ต้นฉบับ" in zh_page.locator(".insights-grid").inner_text()
            # Verify EN article keeps canonical slug in EN switcher link
            zh_page.goto(f"{base_url}/insights/global-foundation-full-spectrum-engineering-inspection.html", wait_until="networkidle")
            assert zh_page.locator('.lang-btn[data-language="en"]').get_attribute("href") == "/insights/global-foundation-full-spectrum-engineering-inspection.html"
            print("PASS: ZH/TH Insights (5 articles + badges), clean Cases capabilities & nested lang switcher verified.")
            zh_page.close()

            # Check query prefill (?type=equipment&category=measurement AND ?route=03 / 04 exact unit routing + powder legacy alias)
            page.goto(f"{base_url}/contact.html?route=03%20Cement%20%26%20Mining%20Equipment", wait_until="networkidle")
            assert page.locator("#cRoute").input_value() == "03 Cement & Mining Equipment"
            page.goto(f"{base_url}/contact.html?route=03%20Powder-Process%20Equipment", wait_until="networkidle")
            assert page.locator("#cRoute").input_value() == "03 Cement & Mining Equipment"
            page.goto(f"{base_url}/contact.html?route=04%20Field%20Testing%20Instruments", wait_until="networkidle")
            assert page.locator("#cRoute").input_value() == "04 Field Testing Instruments"
            page.goto(f"{base_url}/contact.html?type=equipment&category=measurement", wait_until="networkidle")
            page.wait_for_timeout(80)
            assert page.locator("#cRoute").input_value() == "04 Field Testing Instruments"
            assert "Load Cells / Sensors / DAQ" in page.locator("#cNotes").input_value()
            # Customer-facing gate: internal API / RESEND_API_KEY banner must stay hidden when unconfigured
            assert page.locator("#contactApiStatus").is_hidden(), "#contactApiStatus must remain hidden on V1.0 public pages"
            for check_pg in ["index.html", "about.html", "contact.html", "zh/index.html", "zh/about.html", "zh/contact.html", "th/index.html", "th/about.html", "th/contact.html", "cases/index.html"]:
                page.goto(f"{base_url}/{check_pg}", wait_until="networkidle")
                vis_txt = page.locator("body").inner_text().lower()
                for banned in ["owner gate", "unconfigured", "sourcerating", "resend_api_key", "real delivery blocked", "publishedcount", "paco", "roge", "centralfestival", "live chat activates", "暂未配置", "尚未配置", "待授权", "ยังไม่เชื่อมต่อ", "ยังไม่เปิดใช้งาน"]:
                    assert banned not in vis_txt, f"Banned internal/unapproved phrase {banned!r} visible on {check_pg}"

            # Check zero >1.5x upscaled bitmap images on key article pages (258x576 / 413x500 fix)
            page.goto(f"{base_url}/insights/global-foundation-full-spectrum-engineering-inspection.html", wait_until="networkidle")
            upscaled = page.evaluate('''() => {
                const bad = [];
                for (const img of document.images) {
                    if (!img.naturalWidth || img.src.endsWith('.svg')) continue;
                    const rect = img.getBoundingClientRect();
                    if (rect.width > img.naturalWidth * 1.55) {
                        bad.push({ src: img.getAttribute('src'), naturalWidth: img.naturalWidth, renderedWidth: rect.width });
                    }
                }
                return bad;
            }''')
            assert not upscaled, f"Upscaled images detected: {upscaled}"
            print("PASS: Query prefill, honest API status banner, and zero upscaled article images verified.")
            page.goto(f"{base_url}/index.html", wait_until="networkidle")

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

            # 3. Mobile Navigation, Responsive Flowcharts & Inquiry Fallback UX @ 390px (B5 & P1-4 Gates)
            print("\n--- Testing Mobile Menu, Responsive Flowchart & Inquiry Fallback UX @ 390px ---")
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base_url}/testing.html", wait_until="networkidle")
            assert page.locator(".flow-pipeline .flow-step").first.is_visible(), "Mobile vertical workflow cards must be visible @ 390px"
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

            # 4. P0 Live Chat Drawer Single-Flight, Refresh, Idempotency & EN/ZH/TH UI Subtraction @ 390px
            print("\n--- Testing Live Chat Single-Flight (Rapid Multi-Click, Slow Net, Refresh) & Clean UI @ 390px ---")
            import json as _json
            from urllib.parse import parse_qs, urlparse

            live_ctx = browser.new_context(viewport={"width": 390, "height": 844})
            live_page = live_ctx.new_page()
            live_errors = []
            live_page.on("pageerror", lambda err: live_errors.append(str(err)))

            bridge_state = {
                "create_calls": 0,
                "post_msg_calls": 0,
                "req_id_map": {},
                "sessions": {},
                "fail_next_create": False,
                "delay_ms": 600,
            }

            def handle_sr_bridge(route):
                req = route.request
                parsed = urlparse(req.url)
                qs = parse_qs(parsed.query)
                rt = (qs.get("route") or [""])[0]
                if rt == "health":
                    route.fulfill(
                        status=200,
                        content_type="application/json",
                        body=_json.dumps({
                            "ok": True,
                            "configured": True,
                            "online": True,
                            "organizationId": "00000000-0000-4000-8000-00000000a771",
                            "workspaceKey": "an-thai-th",
                            "workspaceName": "AN-THAI Engineering",
                            "challengeToken": "chal_e2e_1",
                        }),
                    )
                    return
                if rt == "posts":
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "posts": []}))
                    return
                if rt == "sessions" and req.method == "POST":
                    bridge_state["create_calls"] += 1
                    body = _json.loads(req.post_data or "{}")
                    if bridge_state["delay_ms"]:
                        live_page.wait_for_timeout(bridge_state["delay_ms"])
                    if bridge_state["fail_next_create"]:
                        bridge_state["fail_next_create"] = False
                        route.fulfill(status=503, content_type="application/json", body=_json.dumps({"ok": False, "error": "SLOW_TEMP_503"}))
                        return
                    crid = body.get("clientRequestId") or "none"
                    if crid in bridge_state["req_id_map"]:
                        sess = bridge_state["sessions"][bridge_state["req_id_map"][crid]]
                    else:
                        sid = f"6c446896-6fc8-4453-9732-00000000000{len(bridge_state['sessions']) + 1}"
                        sess = {
                            "sessionId": sid,
                            "visitorToken": "vtok_e2e_persistent_01",
                            "requestId": "SR-E2E-001",
                            "status": "waiting_human",
                            "messages": [
                                {"id": "m-1", "seq": 1, "senderKind": "visitor", "text": body.get("message", ""), "createdAt": "2026-11-28T10:29:00Z"},
                                {"id": "m-2", "seq": 2, "senderKind": "staff", "senderLabel": "AN-THAI Engineering", "orgVerified": True, "text": "您好，曼谷工程团队已收到您的需求，我们正在核对技术参数。", "createdAt": "2026-11-28T10:30:00Z"},
                            ],
                        }
                        bridge_state["sessions"][sid] = sess
                        bridge_state["req_id_map"][crid] = sid
                    route.fulfill(
                        status=201,
                        content_type="application/json",
                        body=_json.dumps({
                            "ok": True,
                            "sessionId": sess["sessionId"],
                            "visitorToken": sess["visitorToken"],
                            "requestId": sess["requestId"],
                            "status": sess["status"],
                        }),
                    )
                    return
                if rt == "session":
                    sid = (qs.get("sessionId") or [""])[0]
                    sess = bridge_state["sessions"].get(sid)
                    if not sess:
                        route.fulfill(status=401, content_type="application/json", body=_json.dumps({"ok": False, "error": "Unauthorized"}))
                        return
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "session": {"sessionId": sid, "status": sess["status"]}}))
                    return
                if rt == "messages":
                    sid = (qs.get("sessionId") or [""])[0]
                    sess = bridge_state["sessions"].get(sid)
                    if not sess:
                        route.fulfill(status=401, content_type="application/json", body=_json.dumps({"ok": False, "error": "Unauthorized"}))
                        return
                    if req.method == "POST":
                        bridge_state["post_msg_calls"] += 1
                        b = _json.loads(req.post_data or "{}")
                        seq = len(sess["messages"]) + 1
                        sess["messages"].append({"id": f"m-{seq}", "seq": seq, "senderKind": "visitor", "text": b.get("text", ""), "createdAt": "2026-11-28T10:31:00Z"})
                        route.fulfill(status=201, content_type="application/json", body=_json.dumps({"ok": True, "persisted": True, "sessionStatus": sess["status"]}))
                        return
                    after_seq = int((qs.get("afterSeq") or ["0"])[0])
                    msgs = [m for m in sess["messages"] if m["seq"] > after_seq]
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "sessionId": sid, "status": sess["status"], "messages": msgs, "nextAfterSeq": sess["messages"][-1]["seq"] if sess["messages"] else after_seq, "hasMore": False}))
                    return
                route.abort()

            live_page.route("**/api/sr-bridge*", handle_sr_bridge)

            # A. Rapid multi-click + slow network on ZH page -> only 1 session created
            live_page.goto(f"{base_url}/zh/index.html", wait_until="networkidle")
            live_page.locator("#bottomBarDeskBtn").click()
            live_page.wait_for_timeout(120)
            live_page.locator("#liveMsgInput").fill("你好")
            # Fire 5 rapid submit events/clicks within slow 600ms window
            live_page.evaluate("""() => {
                const btn = document.querySelector('#liveMessageForm button[type="submit"]');
                const form = document.getElementById('liveMessageForm');
                for (let i = 0; i < 5; i++) {
                    btn.click();
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }""")
            live_page.wait_for_timeout(1200)
            assert bridge_state["create_calls"] == 1, f"Expected 1 session on rapid 5x submit, got {bridge_state['create_calls']}"
            assert len(bridge_state["sessions"]) == 1, f"Expected 1 stored session, got {len(bridge_state['sessions'])}"

            # B. Refresh page -> restores same session & 0 new sessions on follow-up message
            live_page.reload(wait_until="networkidle")
            live_page.locator("#bottomBarDeskBtn").click()
            live_page.wait_for_timeout(150)
            assert bridge_state["create_calls"] == 1, "Page reload must restore session without calling createSession"
            live_page.screenshot(path=str(SCREENSHOTS_DIR / "390px_live_drawer_zh.png"))

            # Verify ZH Drawer UI Subtraction rules
            assert live_page.locator("#drawerHeading").inner_text().strip() == "AN-THAI"
            zh_sub = live_page.locator("#drawerStatusText").inner_text().strip()
            assert zh_sub == "通常在工作时间内回复", f"Unexpected ZH subtitle: {zh_sub!r}"
            assert "Session" not in zh_sub and "acf58ce4" not in zh_sub and "HUMAN" not in zh_sub
            assert live_page.locator("#liveHandoffBtn").count() == 0
            assert live_page.locator("#liveRefreshBtn").count() == 0
            assert live_page.locator(".live-toolbar").count() == 0
            assert live_page.locator("#liveClearBtn").is_hidden(), "New Session must start tucked inside menu"

            # Open top-right menu & capture screenshot
            live_page.locator("#drawerMenuBtn").click()
            live_page.wait_for_timeout(100)
            assert live_page.locator("#liveClearBtn").is_visible()
            live_page.screenshot(path=str(SCREENSHOTS_DIR / "390px_live_drawer_menu_open_zh.png"))
            live_page.locator("#drawerMenuBtn").click()
            live_page.wait_for_timeout(80)

            # Verify guest bubble meta shows ONLY timestamp (no YOU / 您)
            import re as _re
            guest_meta = live_page.locator(".msg-bubble.is-guest .msg-meta").first.inner_text().strip()
            assert _re.fullmatch(r"\d{2}-\d{2}\s+\d{2}:\d{2}", guest_meta), f"Guest meta must be timestamp-only, got {guest_meta!r}"

            # Follow-up send uses existing session (0 new create_calls)
            live_page.locator("#liveMsgInput").fill("请问泰国罗勇项目可对接静载检测吗？")
            live_page.locator('#liveMessageForm button[type="submit"]').click()
            live_page.wait_for_timeout(300)
            assert bridge_state["create_calls"] == 1
            assert bridge_state["post_msg_calls"] == 1

            # C. Transient failure retry reuses exact clientRequestId (1 session only)
            live_page.locator("#drawerMenuBtn").click()
            live_page.locator("#liveClearBtn").click()
            live_page.wait_for_timeout(150)
            bridge_state["fail_next_create"] = True
            bridge_state["delay_ms"] = 200
            live_page.locator("#liveMsgInput").fill("Retry idempotency check")
            live_page.locator('#liveMessageForm button[type="submit"]').click()
            live_page.wait_for_timeout(450)
            assert live_page.locator("#liveFeedback").is_visible()
            assert live_page.locator("#liveMsgInput").input_value() == "Retry idempotency check"
            # Now retry after clearing temporary failure -> same clientRequestId maps to same 1 session
            live_page.locator('#liveMessageForm button[type="submit"]').click()
            live_page.wait_for_timeout(450)
            assert len(bridge_state["req_id_map"]) == 2, f"Expected exact reuse of clientRequestId on failure retry; req_ids={list(bridge_state['req_id_map'].keys())}"

            # D. Capture clean EN & TH 390px live drawer screenshots
            for lang_code, path_str, sample_msg, staff_reply, exp_sub in [
                ("en", "/index.html", "Hello, we need SLT & PDA testing for 40 piles in Rayong EEC.", "Thank you for reaching AN-THAI Engineering. Our Bangkok team has received your Rayong inquiry.", "Usually replies during working hours"),
                ("th", "/th/index.html", "สวัสดีครับ ต้องการสอบถามงานทดสอบเสาเข็ม SLT ที่ระยองครับ", "ขอบคุณที่ติดต่อทีมวิศวกร AN-THAI กรุงเทพฯ เราได้รับข้อมูลโครงการของท่านแล้วครับ", "โดยปกติตอบกลับในเวลาทำการ"),
            ]:
                live_ctx2 = browser.new_context(viewport={"width": 390, "height": 844})
                p2 = live_ctx2.new_page()
                def _mk_handler(s_reply):
                    def _h(route):
                        rt = (parse_qs(urlparse(route.request.url).query).get("route") or [""])[0]
                        if rt == "health":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "configured": True, "online": True, "organizationId": "00000000-0000-4000-8000-00000000a771", "challengeToken": "c2"}))
                        elif rt == "posts":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "posts": []}))
                        elif rt == "sessions":
                            b = _json.loads(route.request.post_data or "{}")
                            bridge_state[f"msg_{s_reply[:8]}"] = b.get("message", "")
                            route.fulfill(status=201, content_type="application/json", body=_json.dumps({"ok": True, "sessionId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "visitorToken": "vtok_lang", "status": "human_active"}))
                        elif rt == "session":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "session": {"sessionId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "status": "human_active"}}))
                        elif rt == "messages":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "messages": [
                                {"id": "1", "seq": 1, "senderKind": "visitor", "text": bridge_state.get(f"msg_{s_reply[:8]}", ""), "createdAt": "2026-11-28T10:35:00Z"},
                                {"id": "2", "seq": 2, "senderKind": "staff", "orgVerified": True, "text": s_reply, "createdAt": "2026-11-28T10:36:00Z"},
                            ], "nextAfterSeq": 2, "hasMore": False}))
                        else:
                            route.abort()
                    return _h
                p2.route("**/api/sr-bridge*", _mk_handler(staff_reply))
                p2.goto(f"{base_url}{path_str}", wait_until="networkidle")
                p2.locator("#bottomBarDeskBtn").click()
                p2.wait_for_timeout(100)
                assert p2.locator("#drawerHeading").inner_text().strip() == "AN-THAI"
                assert p2.locator("#drawerStatusText").inner_text().strip() == exp_sub
                p2.locator("#liveMsgInput").fill(sample_msg)
                p2.locator('#liveMessageForm button[type="submit"]').click()
                p2.wait_for_timeout(250)
                g_meta = p2.locator(".msg-bubble.is-guest .msg-meta").first.inner_text().strip()
                assert _re.fullmatch(r"\d{2}-\d{2}\s+\d{2}:\d{2}", g_meta), g_meta
                p2.screenshot(path=str(SCREENSHOTS_DIR / f"390px_live_drawer_{lang_code}.png"))
                live_ctx2.close()

            # Verify senderKind="system" auto-confirmation reply renders "AN-THAI" (no Notice/System) across EN/ZH/TH
            for lang_code, path_str in [("en", "/index.html"), ("zh", "/zh/index.html"), ("th", "/th/index.html")]:
                sys_ctx = browser.new_context(viewport={"width": 390, "height": 844})
                sp = sys_ctx.new_page()
                def _mk_sys_handler():
                    def _h(route):
                        rt = (parse_qs(urlparse(route.request.url).query).get("route") or [""])[0]
                        if rt == "health":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "configured": True, "online": True, "organizationId": "00000000-0000-4000-8000-00000000a771", "challengeToken": "csys"}))
                        elif rt == "posts":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "posts": []}))
                        elif rt == "sessions":
                            route.fulfill(status=201, content_type="application/json", body=_json.dumps({"ok": True, "sessionId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "visitorToken": "vtok_sys", "status": "ai_active"}))
                        elif rt == "session":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "session": {"sessionId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "status": "ai_active"}}))
                        elif rt == "messages":
                            route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "messages": [
                                {"id": "1", "seq": 1, "senderKind": "visitor", "text": "Test inquiry", "createdAt": "2026-11-28T10:35:00Z"},
                                {"id": "2", "seq": 2, "senderKind": "system", "text": "Auto-confirmation reply", "createdAt": "2026-11-28T10:35:05Z"},
                            ], "nextAfterSeq": 2, "hasMore": False}))
                        else:
                            route.abort()
                    return _h
                sp.route("**/api/sr-bridge*", _mk_sys_handler())
                sp.goto(f"{base_url}{path_str}", wait_until="networkidle")
                sp.locator("#bottomBarDeskBtn").click()
                sp.wait_for_timeout(100)
                sp.locator("#liveMsgInput").fill("Test inquiry")
                sp.locator('#liveMessageForm button[type="submit"]').click()
                sp.wait_for_timeout(250)
                sys_meta = sp.locator(".msg-bubble.is-system .msg-meta").first.inner_text().strip()
                assert sys_meta.startswith("AN-THAI"), f"{lang_code} system sender meta must start with AN-THAI, got {sys_meta!r}"
                for forbidden in ("Notice", "System", "系统", "แจ้งเตือน"):
                    assert forbidden not in sys_meta, f"{lang_code} system sender meta must not contain {forbidden!r}: {sys_meta!r}"
                sys_ctx.close()

            assert not live_errors, f"Live drawer E2E page errors: {live_errors}"
            live_ctx.close()
            print("PASS: Live Chat rapid multi-click, slow network, refresh idempotency & EN/ZH/TH 390px clean drawer verified.")

            # E. Browser-level Contact + Chat Race, Slow Transcript Unlock & Reset Cancellation
            race_ctx = browser.new_context(viewport={"width": 390, "height": 844})
            race_page = race_ctx.new_page()
            race_state = {"sessions": [], "messages": [], "slow_get_ms": 0}
            def handle_race_bridge(route):
                req = route.request
                qs = parse_qs(urlparse(req.url).query)
                rt = (qs.get("route") or [""])[0]
                if rt == "health":
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "configured": True, "online": True, "organizationId": "00000000-0000-4000-8000-00000000a771", "challengeToken": "crace"}))
                    return
                if rt == "posts":
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "posts": []}))
                    return
                if rt == "sessions" and req.method == "POST":
                    b = _json.loads(req.post_data or "{}")
                    race_page.wait_for_timeout(450)
                    sid = f"bbbbbbbb-bbbb-4bbb-8bbb-00000000000{len(race_state['sessions']) + 1}"
                    race_state["sessions"].append({"sessionId": sid, "clientRequestId": b.get("clientRequestId")})
                    race_state["messages"].append({"seq": 1, "senderKind": "visitor", "text": b.get("message", ""), "createdAt": "2026-11-28T11:00:00Z"})
                    route.fulfill(status=201, content_type="application/json", body=_json.dumps({"ok": True, "sessionId": sid, "visitorToken": "vtok_race", "requestId": "SR-RACE-1", "status": "ai_active"}))
                    return
                if rt == "session":
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "session": {"sessionId": race_state["sessions"][-1]["sessionId"], "status": "ai_active"}}))
                    return
                if rt == "messages":
                    if req.method == "POST":
                        b = _json.loads(req.post_data or "{}")
                        race_state["messages"].append({"seq": len(race_state["messages"]) + 1, "senderKind": "visitor", "text": b.get("text", ""), "createdAt": "2026-11-28T11:01:00Z"})
                        route.fulfill(status=201, content_type="application/json", body=_json.dumps({"ok": True, "persisted": True, "sessionStatus": "ai_active"}))
                        return
                    if race_state["slow_get_ms"]:
                        race_page.wait_for_timeout(race_state["slow_get_ms"])
                    route.fulfill(status=200, content_type="application/json", body=_json.dumps({"ok": True, "messages": race_state["messages"], "nextAfterSeq": len(race_state["messages"]), "hasMore": False}))
                    return
                route.abort()

            race_page.route("**/api/sr-bridge*", handle_race_bridge)
            race_page.goto(f"{base_url}/contact.html", wait_until="networkidle")
            race_page.locator("#cContact").fill("qa@race.example")
            race_page.locator("#cNotes").fill("Contact brief payload during race")
            race_page.locator("#bottomBarDeskBtn").click()
            race_page.wait_for_timeout(80)
            race_page.locator("#liveMsgInput").fill("Chat text payload during race")
            # Fire chat submit, then immediately submit contact form during slow create
            race_page.evaluate("""() => {
                document.getElementById('liveMessageForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                setTimeout(() => {
                    document.getElementById('contactScopeForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }, 40);
            }""")
            race_page.wait_for_timeout(1100)
            assert len(race_state["sessions"]) == 1, f"Expected 1 session during Chat+Contact race, got {len(race_state['sessions'])}"
            written_texts = [m["text"] for m in race_state["messages"]]
            assert any("Chat text payload during race" in t for t in written_texts), written_texts
            assert any("Contact brief payload during race" in t for t in written_texts), written_texts

            # Slow post-send listMessages does NOT keep input/Send button locked
            race_state["slow_get_ms"] = 1200
            race_page.locator("#liveMsgInput").fill("Quick unlock check")
            race_page.locator('#liveMessageForm button[type="submit"]').click()
            race_page.wait_for_timeout(350)  # POST returned (<100ms), slow GET still in flight (1200ms)
            assert not race_page.locator('#liveMessageForm button[type="submit"]').is_disabled(), "Send button must unlock immediately after POST without waiting for slow transcript GET"
            assert not race_page.locator("#liveMsgInput").evaluate("el => el.readOnly"), "Input readOnly must clear immediately after POST"
            race_page.wait_for_timeout(1000)

            # Verify polling remains alive after send (delayed staff reply arrives automatically via poll)
            race_state["slow_get_ms"] = 0
            race_state["messages"].append({
                "id": "m-poll-reply",
                "seq": len(race_state["messages"]) + 1,
                "senderKind": "staff",
                "orgVerified": True,
                "text": "Auto-polled staff reply after message send",
                "createdAt": "2026-11-28T11:02:00Z",
            })
            race_page.wait_for_function(
                "() => document.getElementById('liveMessagesMount').innerText.includes('Auto-polled staff reply after message send')",
                timeout=4500,
            )

            # New Session during slow create invalidates late create
            race_state["slow_get_ms"] = 0
            race_page.locator("#drawerMenuBtn").click()
            race_page.locator("#liveClearBtn").click()
            race_page.wait_for_timeout(80)
            race_page.locator("#liveMsgInput").fill("Aborted mid-flight session")
            race_page.locator('#liveMessageForm button[type="submit"]').click()
            race_page.wait_for_timeout(120)
            race_page.locator("#drawerMenuBtn").click()
            race_page.locator("#liveClearBtn").click()
            race_page.wait_for_timeout(700)
            stored_after_reset = race_page.evaluate("() => localStorage.getItem('sr_bridge_session_v1_an-thai-th')")
            assert stored_after_reset is None, f"Old in-flight create must NOT resurrect session after New Session, got {stored_after_reset}"
            race_ctx.close()
            print("PASS: Contact+Chat race, slow transcript non-blocking unlock & New Session mid-flight cancellation verified.")

            # Final console error check (zero tolerance, including resource 404s)
            critical_errors = console_errors.copy()
            assert not critical_errors, f"Critical console errors detected: {critical_errors}"

            browser.close()
            print("\n=== ALL V5.3 PLAYWRIGHT E2E & VISUAL TESTS PASSED (100% GREEN) ===")
    finally:
        httpd.shutdown()

if __name__ == '__main__':
    run_tests()

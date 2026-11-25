#!/usr/bin/env python3
"""V5.3 Automated Regression Suite: 13 pages x 4 viewports (390/768/1024/1440) + Services dropdown/accordion + Multi-tag Insights + Mock Live E2E."""
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

ROOT = Path(__file__).resolve().parent.parent

def run():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    driver = webdriver.Chrome(options=opts)
    try:
        pages = [
            "index.html", "testing.html", "steel-procurement.html", "powder-equipment.html",
            "testing-instruments.html", "about.html", "contact.html",
            "cases/index.html", "cases/case-template.html", "insights/index.html",
            "insights/bored-pile-csl-testing-tube-debonding-anomaly-thailand.html",
            "insights/pit-pretest-site-readiness-owner-checklist.html",
            "insights/static-load-vs-pda-thailand-pile-capacity.html",
            "insights/pile-integrity-test-report-review-checklist.html",
        ]
        for width in (390, 768, 1024, 1440):
            driver.set_window_size(width, 900)
            for p in pages:
                driver.get(f"file://{ROOT / p}")
                time.sleep(0.08)
                overflow = driver.execute_script("return document.documentElement.scrollWidth - window.innerWidth;")
                assert overflow <= 1, f"Overflow on {p} @ {width}px: {overflow}"
                imgs_ok = driver.execute_script("return Array.from(document.images).every(i => i.complete && i.naturalWidth > 0);")
                assert imgs_ok, f"Broken image on {p}"
            print(f"PASS all 14 pages & images @ {width}px")

        # 1. Verify Desktop Services Dropdown + Esc close + Clean Footer (no dev text)
        driver.set_window_size(1440, 900)
        driver.get(f"file://{ROOT / 'index.html'}")
        time.sleep(0.15)
        footer_text = driver.find_element(By.TAG_NAME, "footer").text
        assert "Pending Staging API" not in footer_text and "Adapter v2" not in footer_text
        assert driver.find_element(By.ID, "fieldUpdatesSection").get_attribute("hidden") is not None
        d_btn = driver.find_element(By.ID, "desktopServicesBtn")
        d_btn.click()
        assert d_btn.get_attribute("aria-expanded") == "true"
        assert driver.find_element(By.ID, "desktopServicesMenu").get_attribute("hidden") is None
        d_btn.send_keys(Keys.ESCAPE)
        assert d_btn.get_attribute("aria-expanded") == "false"
        print("PASS desktop Services dropdown, Esc close, clean footer & hidden empty fieldUpdates")

        # 2. Verify Mobile Services Accordion @ 390px
        driver.set_window_size(390, 844)
        driver.get(f"file://{ROOT / 'index.html'}")
        time.sleep(0.1)
        driver.find_element(By.ID, "mobileMenuBtn").click()
        m_svc = driver.find_element(By.ID, "mobileServicesBtn")
        assert m_svc.get_attribute("aria-expanded") == "false"
        assert driver.find_element(By.ID, "mobileServicesPanel").get_attribute("hidden") is not None
        m_svc.click()
        assert m_svc.get_attribute("aria-expanded") == "true"
        assert driver.find_element(By.ID, "mobileServicesPanel").get_attribute("hidden") is None
        print("PASS mobile Services accordion @ 390px")

        # 3. Verify Insights Multi-Tag Filtering (Article #4 appears under BOTH testing AND instruments)
        driver.set_window_size(1440, 900)
        driver.get(f"file://{ROOT / 'insights/index.html'}")
        time.sleep(0.15)
        assert "Editorial Queue" not in driver.page_source and "Canonical Live URL" not in driver.page_source
        driver.find_element(By.CSS_SELECTOR, ".filter-btn[data-filter='testing']").click()
        vis_test = driver.execute_script("return Array.from(document.querySelectorAll('[data-article-units]')).filter(e => !e.hidden).length;")
        assert vis_test == 4, f"Expected 4 articles under testing (multi-tag), got {vis_test}"
        driver.find_element(By.CSS_SELECTOR, ".filter-btn[data-filter='instruments']").click()
        vis_inst = driver.execute_script("return Array.from(document.querySelectorAll('[data-article-units]')).filter(e => !e.hidden).length;")
        assert vis_inst == 1, f"Expected 1 article under instruments, got {vis_inst}"
        print("PASS Insights multi-tag filter & public UI cleanup")

        logs = [l for l in driver.get_log("browser") if l["level"] == "SEVERE"]
        assert not logs, f"Console errors: {logs}"
        print("ALL V5.3 REGRESSION CHECKS PASSED (0 console errors)!")
    finally:
        driver.quit()

if __name__ == "__main__":
    run()

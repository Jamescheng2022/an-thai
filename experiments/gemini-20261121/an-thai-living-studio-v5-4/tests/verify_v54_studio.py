#!/usr/bin/env python3
"""Automated Chromium verification for AN-THAI V5.4 Employee Chat + Lite CRM + AI Content Studio."""
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

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
        app_url = f"file://{ROOT / 'app/index.html'}"
        for w in (390, 768, 1024, 1440):
            driver.set_window_size(w, 860)
            driver.get(app_url)
            time.sleep(0.12)
            ov = driver.execute_script("return document.documentElement.scrollWidth - window.innerWidth;")
            assert ov <= 1, f"Overflow @ {w}px: {ov}"
        print("PASS V5.4 viewports @ 390/768/1024/1440px")

        driver.set_window_size(1280, 900)
        driver.get(app_url)
        time.sleep(0.15)

        # 1. Employee submits field update with 3 photos
        driver.find_element(By.CSS_SELECTOR, ".chip[data-sample]").click()
        driver.find_element(By.CSS_SELECTOR, "#chatComposer button[type='submit']").click()
        time.sleep(0.15)
        feed_txt = driver.find_element(By.ID, "chatFeed").text
        assert "lite crm candidate" in feed_txt.lower() and "ai content studio draft" in feed_txt.lower()

        # 2. Confirm CRM candidate
        driver.find_element(By.CSS_SELECTOR, "[data-confirm-crm]").click()
        time.sleep(0.1)
        assert driver.find_element(By.ID, "crmCount").text == "2"

        # 3. Open Content Studio: Contributor MUST be blocked from self-publishing
        driver.find_element(By.CSS_SELECTOR, "[data-open-draft]").click()
        time.sleep(0.1)
        driver.find_element(By.CSS_SELECTOR, "[data-draft-act='publish']").click()
        time.sleep(0.1)
        assert "PERMISSION_DENIED" in driver.find_element(By.ID, "studioFeedback").text

        # 4. Switch to Publisher, verify disclosure gate, then approve & publish, then retract
        Select(driver.find_element(By.ID, "roleSelect")).select_by_value("publisher")
        driver.find_element(By.CSS_SELECTOR, "[data-draft-act='publish']").click()
        time.sleep(0.1)
        assert "DISCLOSURE_BLOCKED" in driver.find_element(By.ID, "studioFeedback").text
        Select(driver.find_element(By.CSS_SELECTOR, "[data-rights-sel]")).select_by_value("client_approved_public")
        driver.find_element(By.CSS_SELECTOR, "[data-draft-act='publish']").click()
        time.sleep(0.1)
        assert "published" in driver.find_element(By.ID, "studioFeedback").text
        driver.find_element(By.CSS_SELECTOR, "[data-draft-act='retract']").click()
        time.sleep(0.1)
        assert "retracted" in driver.find_element(By.ID, "studioFeedback").text

        # 5. Check Daily Brief (zero fabrication)
        driver.find_element(By.CSS_SELECTOR, ".nav-tab[data-tab='brief']").click()
        time.sleep(0.1)
        assert "Not tracked (zero fabrication)" in driver.find_element(By.ID, "briefMount").text

        logs = [l for l in driver.get_log("browser") if l["level"] == "SEVERE"]
        assert not logs, f"Console errors: {logs}"
        print("PASS V5.4 E2E (Chat -> Lite CRM -> Role-Gated Publish -> Retract -> Daily Brief, 0 errors)!")
    finally:
        driver.quit()

if __name__ == "__main__":
    run()

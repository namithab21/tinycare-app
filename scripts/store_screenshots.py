"""
Generates App Store / Play Store screenshots from the web build of the app (demo data, no real records).

  npx expo export --platform web --output-dir dist
  (cd dist && python3 -m http.server 8099 &)
  pip install playwright && python3 scripts/store_screenshots.py

Output: store/screenshots/<device>/NN-name.png
Review them before uploading - stores require screenshots that reflect the real app.
"""
import datetime, os
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8099/'
DEVICES = {
    'iphone-6.9in-1320x2868': (440, 956, 3),
    'ipad-13in-2064x2752': (1032, 1376, 2),
    'android-phone-1080x1920': (360, 640, 3),
}
today = datetime.date.today()
dob = (today - datetime.timedelta(days=75)).isoformat()

def seed(pg):
    pg.goto(URL); pg.wait_for_timeout(1800)
    ins = pg.locator('input')
    for i, v in enumerate(['Asha Rao', '9876543210', 'SecurePass123', 'SecurePass123']): ins.nth(i).fill(v)
    pg.get_by_text('Create account', exact=True).last.click(); pg.wait_for_timeout(1200)
    pg.get_by_text('South India', exact=True).first.click()
    pg.get_by_text('I am a new mother').first.click(); pg.locator('input').nth(0).fill(dob)
    pg.get_by_text('Next', exact=True).first.click(); pg.wait_for_timeout(500)
    ins = pg.locator('input'); ins.nth(0).fill('Aarav'); ins.nth(1).fill(dob)
    pg.get_by_text('Boy', exact=True).click(); pg.locator('input').nth(2).fill('3.1')
    pg.get_by_text('Done', exact=True).first.click(); pg.wait_for_timeout(1200)
    # Mark the birth + 6-week doses as given so the demo home screen is not a wall of overdue alerts.
    pg.get_by_text('Children', exact=True).last.click(); pg.wait_for_timeout(700)
    pg.get_by_text('Aarav', exact=True).first.click(); pg.wait_for_timeout(900)
    pg.get_by_text('Vaccines', exact=True).last.click(); pg.wait_for_timeout(500)
    for _ in range(11):
        if pg.get_by_text('Mark as given').count(): pg.get_by_text('Mark as given').first.click(); pg.wait_for_timeout(250)
    pg.go_back(); pg.wait_for_timeout(600)

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, (w, h, dsf) in DEVICES.items():
        out = os.path.join('store', 'screenshots', name); os.makedirs(out, exist_ok=True)
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dsf)
        pg = ctx.new_page(); seed(pg)
        def shot(n):
            pg.wait_for_timeout(700); pg.screenshot(path=f'{out}/{n}.png')
        pg.get_by_text('Home', exact=True).last.click(); shot('01-home')
        pg.get_by_text('Mother', exact=True).last.click(); shot('02-mother-recovery')
        pg.get_by_text('Children', exact=True).last.click(); shot('03-children')
        pg.get_by_text('Nutrition', exact=True).last.click(); pg.get_by_text('For mother', exact=True).first.click(); shot('04-nutrition')
        pg.get_by_text('Settings', exact=True).last.click(); shot('05-settings')
        ctx.close()
    b.close()

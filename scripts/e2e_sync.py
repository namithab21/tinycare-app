"""
End-to-end check of cloud sync against a running TinyCare server serving the web build.
  EXPO_PUBLIC_API_URL=same-origin npm run build:web
  TINYCARE_DATA_DIR=/tmp/tc-e2e PORT=8081 npm run server &
  python3 scripts/e2e_sync.py http://localhost:8081 /tmp/tc-e2e
"""
import sqlite3, sys, datetime
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8081'
DATA = sys.argv[2] if len(sys.argv) > 2 else '/tmp/tc-e2e'
dob = (datetime.date.today() - datetime.timedelta(days=75)).isoformat()
PHONE, PW = '9876543210', 'SecurePass123'
fails = []
def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{extra}]' if extra and not cond else ''))
    if not cond: fails.append(name)
def db(sql):
    c = sqlite3.connect(f'{DATA}/tinycare.db'); r = c.execute(sql).fetchall(); c.close(); return r

with sync_playwright() as p:
    b = p.chromium.launch()
    def device():
        ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
        pg.on('dialog', lambda d: d.accept()); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.errs = errs
        return ctx, pg
    def tab(pg, name): pg.get_by_text(name, exact=True).last.click(); pg.wait_for_timeout(700)
    def txt(pg): return pg.locator('body').inner_text()

    # ---- Device A: sign up + onboarding
    ctxA, A = device(); A.goto(URL); A.wait_for_timeout(2000)
    i = A.locator('input')
    for n, v in enumerate(['Asha Rao', PHONE, PW, PW]): i.nth(n).fill(v)
    A.get_by_text('Create account', exact=True).last.click(); A.wait_for_timeout(2500)
    check('A: account created on server', db("select count(*) from users")[0][0] == 1)
    A.get_by_text('I am a new mother').first.click(); A.locator('input').nth(0).fill(dob)
    A.get_by_text('Next', exact=True).first.click(); A.wait_for_timeout(500)
    i = A.locator('input'); i.nth(0).fill('Aarav'); i.nth(1).fill(dob); A.get_by_text('Boy', exact=True).click()
    A.get_by_text('Done', exact=True).first.click(); A.wait_for_timeout(6000)   # 3s debounce + upload
    rec = db("select version, length(blob) from records")
    check('A: data uploaded (version>=1)', bool(rec) and rec[0][0] >= 1, str(rec))
    raw = open(f'{DATA}/tinycare.db', 'rb').read() + (open(f'{DATA}/tinycare.db-wal', 'rb').read() if __import__('os').path.exists(f'{DATA}/tinycare.db-wal') else b'')
    check('server stores no plaintext child name', b'Aarav' not in raw)
    tab(A, 'Settings'); check('A: settings shows sync status Synced', 'Synced' in txt(A))

    # ---- Device B: brand-new browser profile signs in -> data arrives
    ctxB, B = device(); B.goto(URL); B.wait_for_timeout(2000)
    B.get_by_text('Already have an account? Sign in').click(); B.wait_for_timeout(400)
    i = B.locator('input'); i.nth(0).fill(PHONE); i.nth(1).fill(PW)
    B.get_by_text('Sign in', exact=True).last.click(); B.wait_for_timeout(3500)
    check('B: signed in (onboarding skipped, home visible)', 'Hello, Asha' in txt(B) or 'Home' in txt(B), txt(B)[:120])
    tab(B, 'Children'); check('B: sees child Aarav synced from A', 'Aarav' in txt(B), txt(B)[:200])
    B.get_by_text('Aarav', exact=True).first.click(); B.wait_for_timeout(900)
    B.get_by_text('Growth', exact=True).first.click(); B.wait_for_timeout(500)
    i = B.locator('input:visible'); i.nth(0).fill('5.4'); i.nth(1).fill('59'); B.get_by_text('Add', exact=True).last.click()
    B.wait_for_timeout(6000)
    check('server version advanced after B edit', db("select version from records")[0][0] >= 2, str(db("select version from records")))

    # ---- Device A reloads -> pulls B's measurement
    A.reload(); A.wait_for_timeout(4500)
    tab(A, 'Children'); A.get_by_text('Aarav', exact=True).first.click(); A.wait_for_wait = A.wait_for_timeout(900)
    A.get_by_text('Growth', exact=True).first.click(); A.wait_for_timeout(600)
    check("A: sees B's 5.4 kg measurement after reload", '5.4' in txt(A), txt(A)[-300:])

    # ---- Wrong password on a third fresh device is rejected
    ctxC, C = device(); C.goto(URL); C.wait_for_timeout(1800)
    C.get_by_text('Already have an account? Sign in').click(); C.wait_for_timeout(300)
    i = C.locator('input'); i.nth(0).fill(PHONE); i.nth(1).fill('WrongPass999')
    C.get_by_text('Sign in', exact=True).last.click(); C.wait_for_timeout(1800)
    check('C: wrong password rejected', 'Hello, Asha' not in txt(C))

    # ---- Delete account from B -> everything gone on the server
    if not B.get_by_text('Settings', exact=True).last.is_visible():  # tab bar is hidden on the child screen
        B.go_back(); B.wait_for_timeout(700)
    tab(B, 'Settings')
    B.get_by_text('Delete account and data').last.click(); B.wait_for_timeout(3000)
    check('delete: server has no users', db("select count(*) from users")[0][0] == 0)
    check('delete: server has no records', db("select count(*) from records")[0][0] == 0)
    check('delete: B returned to sign-in', 'Create account' in txt(B) or 'Sign in' in txt(B))
    ls = B.evaluate("Object.keys(localStorage)"); check('delete: B local storage wiped (no token/credential)', not any('tc_' in k for k in ls), str(ls))
    for n, pg in [('A', A), ('B', B), ('C', C)]: check(f'{n}: no uncaught JS errors', not pg.errs, str(pg.errs[:2]))
    b.close()
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED: {fails}'); sys.exit(1 if fails else 0)

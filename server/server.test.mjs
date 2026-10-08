import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { createApp } from './index.mjs';

let server, base, dir, web;
const keys = { secret: randomBytes(32).toString('hex'), dataKey: randomBytes(32) };
const call = (path, { method = 'GET', body, token } = {}) =>
  fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tc-'));
  web = join(dir, 'web'); mkdirSync(web); writeFileSync(join(web, 'index.html'), '<html>app</html>');
  writeFileSync(join(dir, 'secret.txt'), 'TOP SECRET');
  server = createApp({ dataDir: dir, webDir: web, keys, production: false, authLimit: 5 });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

test('health + rejects unauthenticated sync', async () => {
  assert.equal((await call('/api/health')).status, 200);
  assert.equal((await call('/api/sync')).status, 401);
  assert.equal((await call('/api/sync', { token: 'garbage.token' })).status, 401);
});

test('signup validates input, rejects duplicates, login works', async () => {
  assert.equal((await call('/api/auth/signup', { method: 'POST', body: { name: 'A', phone: '123', password: 'longenough1' } })).status, 400);
  assert.equal((await call('/api/auth/signup', { method: 'POST', body: { name: 'A', phone: '9876543210', password: 'short' } })).status, 400);
  const ok = await call('/api/auth/signup', { method: 'POST', body: { name: 'Asha', phone: '+91 98765-43210', password: 'SecurePass123' } });
  assert.equal(ok.status, 201); const { token, user } = await ok.json(); assert.ok(token); assert.equal(user.phone, '9876543210');
  assert.equal((await call('/api/auth/signup', { method: 'POST', body: { name: 'X', phone: '9876543210', password: 'SecurePass123' } })).status, 409);
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { phone: '9876543210', password: 'wrongpass' } })).status, 401);
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { phone: '9000000000', password: 'SecurePass123' } })).status, 401);
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { phone: '9876543210', password: 'SecurePass123' } })).status, 200);
});

test('sync: versioning, conflict, force, encrypted at rest, per-user isolation', async () => {
  const a = await (await call('/api/auth/login', { method: 'POST', body: { phone: '9876543210', password: 'SecurePass123' } })).json();
  const b = await (await call('/api/auth/signup', { method: 'POST', body: { name: 'Bob', phone: '9111111111', password: 'AnotherPass1' } })).json();
  assert.deepEqual(await (await call('/api/sync', { token: a.token })).json(), { version: 0, state: null, updatedAt: null });

  const state = { children: [{ id: 'c1', name: 'Aarav-UNIQUE-MARKER' }], settings: { language: 'hi' } };
  const put1 = await call('/api/sync', { method: 'PUT', token: a.token, body: { state, baseVersion: 0 } });
  assert.equal(put1.status, 200); assert.equal((await put1.json()).version, 1);
  const got = await (await call('/api/sync', { token: a.token })).json();
  assert.equal(got.version, 1); assert.deepEqual(got.state, state);

  const stale = await call('/api/sync', { method: 'PUT', token: a.token, body: { state: { x: 1 }, baseVersion: 0 } });
  assert.equal(stale.status, 409); const c = await stale.json(); assert.equal(c.version, 1); assert.deepEqual(c.state, state);
  const forced = await call('/api/sync', { method: 'PUT', token: a.token, body: { state: { x: 1 }, baseVersion: 0, force: true } });
  assert.equal((await forced.json()).version, 2);

  assert.equal((await call('/api/sync', { method: 'PUT', token: a.token, body: { state: 'nope', baseVersion: 2 } })).status, 400);
  assert.deepEqual((await (await call('/api/sync', { token: b.token })).json()).state, null, 'other user sees nothing');

  const raw = readFileSync(join(dir, 'tinycare.db')); // WAL may hold recent pages; check both
  let walRaw = Buffer.alloc(0); try { walRaw = readFileSync(join(dir, 'tinycare.db-wal')); } catch { /* none */ }
  assert.ok(!raw.includes('Aarav-UNIQUE-MARKER') && !walRaw.includes('Aarav-UNIQUE-MARKER'), 'plaintext health data must not be on disk');
  const row = new DatabaseSync(join(dir, 'tinycare.db'), { readOnly: true }).prepare('SELECT hash FROM users WHERE phone=?').get('9876543210');
  assert.ok(row.hash.length === 128 && !row.hash.includes('SecurePass123'), 'password stored as scrypt hash');
});

test('tampered token is rejected; account deletion removes everything', async () => {
  const s = await (await call('/api/auth/login', { method: 'POST', body: { phone: '9111111111', password: 'AnotherPass1' } })).json();
  const sig = s.token.split('.')[1]; const forged = Buffer.from(JSON.stringify({ sub: 'x', exp: Date.now() + 1e9 })).toString('base64url');
  assert.equal((await call('/api/sync', { token: `${forged}.${sig}` })).status, 401);
  await call('/api/sync', { method: 'PUT', token: s.token, body: { state: { a: 1 }, baseVersion: 0 } });
  assert.equal((await call('/api/account', { method: 'DELETE', token: s.token })).status, 200);
  assert.equal((await call('/api/sync', { token: s.token })).status, 401, 'token dead after deletion');
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { phone: '9111111111', password: 'AnotherPass1' } })).status, 401);
  const db = new DatabaseSync(join(dir, 'tinycare.db'), { readOnly: true });
  assert.equal(db.prepare('SELECT count(*) n FROM records WHERE user_id NOT IN (SELECT id FROM users)').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM users WHERE phone=?').get('9111111111').n, 0);
});

test('login is rate limited', async () => {
  let last;
  for (let i = 0; i < 8; i++) last = await call('/api/auth/login', { method: 'POST', body: { phone: '9222222222', password: 'nope-nope' } });
  assert.equal(last.status, 429);
});

test('static: serves app, SPA fallback, blocks path traversal, security headers', async () => {
  const r = await fetch(base + '/'); assert.equal(r.status, 200); assert.match(await r.text(), /app/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  const spa = await fetch(base + '/children/123'); assert.match(await spa.text(), /app/);
  for (const evil of ['/..%2Fsecret.txt', '/%2e%2e/secret.txt', '/..%2f..%2fetc%2fpasswd']) {
    const t = await (await fetch(base + evil)).text(); assert.ok(!t.includes('TOP SECRET') && !t.includes('root:'), evil);
  }
});

test('production refuses to start without keys', () => {
  assert.throws(() => createApp({ dataDir: dir, production: true, dbPath: ':memory:' }), /TINYCARE_SECRET/);
});

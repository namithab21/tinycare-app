// TinyCare server: accounts + encrypted cloud sync + static hosting of the web build.
// Zero npm dependencies. Requires Node >= 22.13 (built-in node:sqlite).
//
//   npm run server                 # dev: http://localhost:8080
//   NODE_ENV=production ...        # requires TINYCARE_SECRET and TINYCARE_DATA_KEY (see docs/DEPLOY.md)
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHmac, createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const MAX_BODY = 2 * 1024 * 1024;
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.map': 'application/json', '.txt': 'text/plain; charset=utf-8',
};

function loadKeys(production, dataDir) {
  const secret = process.env.TINYCARE_SECRET;
  const dataKeyHex = process.env.TINYCARE_DATA_KEY;
  if (secret && dataKeyHex) {
    if (secret.length < 32) throw new Error('TINYCARE_SECRET must be at least 32 characters');
    if (!/^[0-9a-f]{64}$/i.test(dataKeyHex)) throw new Error('TINYCARE_DATA_KEY must be 64 hex characters (32 bytes)');
    return { secret, dataKey: Buffer.from(dataKeyHex, 'hex') };
  }
  if (production) throw new Error('Set TINYCARE_SECRET and TINYCARE_DATA_KEY in production (see docs/DEPLOY.md).');
  // Development only: generate and persist throwaway keys.
  const file = join(dataDir, '.dev-keys.json');
  if (existsSync(file)) {
    const k = JSON.parse(readFileSync(file, 'utf8'));
    return { secret: k.secret, dataKey: Buffer.from(k.dataKey, 'hex') };
  }
  const k = { secret: randomBytes(32).toString('hex'), dataKey: randomBytes(32).toString('hex') };
  writeFileSync(file, JSON.stringify(k), { mode: 0o600 });
  console.warn('[tinycare] DEV keys generated in', file, '- never use these in production.');
  return { secret: k.secret, dataKey: Buffer.from(k.dataKey, 'hex') };
}

export function createApp(opts = {}) {
  const production = opts.production ?? process.env.NODE_ENV === 'production';
  const dataDir = resolve(opts.dataDir ?? process.env.TINYCARE_DATA_DIR ?? join(HERE, 'data'));
  const webDir = resolve(opts.webDir ?? process.env.TINYCARE_WEB_DIR ?? join(HERE, '..', 'dist'));
  const allowedOrigins = (opts.allowedOrigins ?? process.env.TINYCARE_ALLOWED_ORIGINS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const authLimit = opts.authLimit ?? 10; // attempts per window per ip+phone
  const authWindowMs = opts.authWindowMs ?? 15 * 60 * 1000;

  mkdirSync(dataDir, { recursive: true });
  const { secret, dataKey } = opts.keys ?? loadKeys(production, dataDir);
  const db = new DatabaseSync(opts.dbPath ?? join(dataDir, 'tinycare.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, phone TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      salt TEXT NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS records (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      version INTEGER NOT NULL, blob BLOB NOT NULL, updated_at TEXT NOT NULL);
  `);
  db.exec('PRAGMA foreign_keys = ON');

  const q = {
    userByPhone: db.prepare('SELECT * FROM users WHERE phone = ?'),
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertUser: db.prepare('INSERT INTO users (id, phone, name, salt, hash, created_at) VALUES (?,?,?,?,?,?)'),
    getRecord: db.prepare('SELECT version, blob, updated_at FROM records WHERE user_id = ?'),
    upsertRecord: db.prepare(`INSERT INTO records (user_id, version, blob, updated_at) VALUES (?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET version = excluded.version, blob = excluded.blob, updated_at = excluded.updated_at`),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
    deleteRecord: db.prepare('DELETE FROM records WHERE user_id = ?'),
  };

  // ---- crypto helpers
  const hashPassword = (password, salt) => scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
  const b64u = (b) => Buffer.from(b).toString('base64url');
  const sign = (payload) => { const p = b64u(JSON.stringify(payload)); return `${p}.${createHmac('sha256', secret).update(p).digest('base64url')}`; };
  function verify(token) {
    const [p, sig] = String(token || '').split('.');
    if (!p || !sig) return null;
    const good = createHmac('sha256', secret).update(p).digest('base64url');
    if (!safeEq(sig, good)) return null;
    try { const d = JSON.parse(Buffer.from(p, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch { return null; }
  }
  const encrypt = (text) => {
    const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', dataKey, iv);
    const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), ct]);
  };
  const decrypt = (buf) => {
    const b = Buffer.from(buf); const d = createDecipheriv('aes-256-gcm', dataKey, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  };

  // ---- rate limiting (in-memory; fine for a single instance)
  const attempts = new Map();
  function limited(key) {
    const now = Date.now(); const rec = attempts.get(key);
    if (!rec || now - rec.start > authWindowMs) { attempts.set(key, { start: now, n: 1 }); return false; }
    rec.n += 1; return rec.n > authLimit;
  }
  const sweep = setInterval(() => { const now = Date.now(); for (const [k, v] of attempts) if (now - v.start > authWindowMs) attempts.delete(k); }, 60_000);
  sweep.unref();

  // ---- http helpers
  function headers(req, extra = {}) {
    const h = {
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store', ...extra,
    };
    if (production) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      h['Access-Control-Allow-Origin'] = origin; h['Vary'] = 'Origin';
      h['Access-Control-Allow-Headers'] = 'authorization, content-type'; h['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    }
    return h;
  }
  const json = (req, res, status, body) => { res.writeHead(status, headers(req, { 'Content-Type': 'application/json' })); res.end(JSON.stringify(body)); };
  const readBody = (req) => new Promise((resolveBody, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolveBody(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch { reject(Object.assign(new Error('bad json'), { status: 400 })); } });
    req.on('error', reject);
  });
  const ip = (req) => (production && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || '?';
  const auth = (req) => { const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); const d = m && verify(m[1]); return d ? q.userById.get(d.sub) ?? null : null; };
  const issue = (user) => ({ token: sign({ sub: user.id, exp: Date.now() + TOKEN_TTL_MS }), user: { id: user.id, name: user.name, phone: user.phone } });
  const cleanPhone = (p) => String(p ?? '').replace(/\D/g, '').slice(-10);

  async function api(req, res, path) {
    if (req.method === 'OPTIONS') { res.writeHead(204, headers(req)); return res.end(); }
    if (path === '/api/health' && req.method === 'GET') return json(req, res, 200, { ok: true });

    if (path === '/api/auth/signup' && req.method === 'POST') {
      const b = await readBody(req); const phone = cleanPhone(b.phone); const name = String(b.name ?? '').trim().slice(0, 100);
      if (limited(`${ip(req)}|signup`)) return json(req, res, 429, { error: 'rate_limited' });
      if (phone.length !== 10 || !name || typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 200) return json(req, res, 400, { error: 'invalid' });
      if (q.userByPhone.get(phone)) return json(req, res, 409, { error: 'phone_taken' });
      const salt = randomBytes(16).toString('hex'); const user = { id: randomUUID(), phone, name, salt, hash: hashPassword(b.password, salt), created_at: new Date().toISOString() };
      q.insertUser.run(user.id, phone, name, user.salt, user.hash, user.created_at);
      return json(req, res, 201, issue(user));
    }
    if (path === '/api/auth/login' && req.method === 'POST') {
      const b = await readBody(req); const phone = cleanPhone(b.phone);
      if (limited(`${ip(req)}|${phone}`)) return json(req, res, 429, { error: 'rate_limited' });
      const user = q.userByPhone.get(phone);
      // Always run scrypt so timing doesn't reveal whether the phone exists.
      const salt = user?.salt ?? '00'.repeat(16); const got = hashPassword(String(b.password ?? ''), salt);
      if (!user || !safeEq(got, user.hash)) return json(req, res, 401, { error: 'invalid_credentials' });
      return json(req, res, 200, issue(user));
    }

    const user = auth(req);
    if (!user) return json(req, res, 401, { error: 'unauthorized' });

    if (path === '/api/sync' && req.method === 'GET') {
      const r = q.getRecord.get(user.id);
      if (!r) return json(req, res, 200, { version: 0, state: null, updatedAt: null });
      return json(req, res, 200, { version: r.version, state: JSON.parse(decrypt(r.blob)), updatedAt: r.updated_at });
    }
    if (path === '/api/sync' && req.method === 'PUT') {
      const b = await readBody(req);
      if (typeof b.state !== 'object' || b.state === null || Array.isArray(b.state) || !Number.isInteger(b.baseVersion) || b.baseVersion < 0) return json(req, res, 400, { error: 'invalid' });
      const cur = q.getRecord.get(user.id); const curVersion = cur?.version ?? 0;
      // Optimistic concurrency: the client must have seen the latest version (or pass force for last-write-wins).
      if (b.baseVersion !== curVersion && b.force !== true) {
        return json(req, res, 409, { error: 'conflict', version: curVersion, state: cur ? JSON.parse(decrypt(cur.blob)) : null });
      }
      const version = curVersion + 1; const now = new Date().toISOString();
      q.upsertRecord.run(user.id, version, encrypt(JSON.stringify(b.state)), now);
      return json(req, res, 200, { version, updatedAt: now });
    }
    if (path === '/api/account' && req.method === 'DELETE') {
      q.deleteRecord.run(user.id); q.deleteUser.run(user.id);
      return json(req, res, 200, { deleted: true });
    }
    return json(req, res, 404, { error: 'not_found' });
  }

  function serveStatic(req, res, path) {
    if (!existsSync(webDir)) { res.writeHead(404, headers(req, { 'Content-Type': 'text/plain' })); return res.end('Web build not found. Run: npm run build:web'); }
    let rel = normalize(decodeURIComponent(path)).replace(/^([/\\])+/, '');
    let file = resolve(webDir, rel || 'index.html');
    if (file !== webDir && !file.startsWith(webDir + sep)) { res.writeHead(403); return res.end(); }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      // privacy.html / terms.html live in docs/ and are served beside the app; SPA fallback for everything else.
      const doc = resolve(HERE, '..', 'docs', rel);
      if (rel && rel.endsWith('.html') && doc.startsWith(resolve(HERE, '..', 'docs') + sep) && existsSync(doc)) file = doc;
      else file = join(webDir, 'index.html');
    }
    const immutable = file.includes(`${sep}_expo${sep}`) || file.includes(`${sep}assets${sep}`);
    res.writeHead(200, headers(req, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    }));
    createReadStream(file).pipe(res);
  }

  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url ?? '/', 'http://x').pathname;
      if (path.startsWith('/api/')) return await api(req, res, path);
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
      return serveStatic(req, res, path);
    } catch (e) {
      const status = e.status ?? 500;
      if (status === 500) console.error('[tinycare] error:', e);
      if (!res.headersSent) json(req, res, status, { error: status === 500 ? 'server_error' : e.message });
    }
  });
  server.on('close', () => { clearInterval(sweep); try { db.close(); } catch { /* already closed */ } });
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.PORT ?? 8080);
  const server = createApp();
  server.listen(port, () => console.log(`[tinycare] listening on :${port} (${process.env.NODE_ENV === 'production' ? 'production' : 'development'})`));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
}

# Deploying the TinyCare server (web app + API)

One small Node process serves **the web app** (`dist/`), the **legal pages** (`/privacy.html`, `/terms.html`) and the **API** (`/api/*`: accounts + encrypted cloud sync). Phones can use the same server. No database to install — it uses a SQLite file.

Requirements: Node ≥ 22.13 (or Docker). Zero npm packages at runtime.

## 1. Try it locally

```bash
npm install
EXPO_PUBLIC_API_URL=same-origin npm run build:web     # web build that talks to its own server
npm run server                                        # http://localhost:8080  (dev keys are generated automatically)
```

## 2. Production with Docker (any VPS, Render, Fly.io, Railway, Cloud Run, …)

```bash
openssl rand -hex 32     # -> TINYCARE_SECRET   (signs login tokens)
openssl rand -hex 32     # -> TINYCARE_DATA_KEY (encrypts health records at rest)
cat > .env <<EOT
TINYCARE_SECRET=<first value>
TINYCARE_DATA_KEY=<second value>
EOT
docker compose up -d --build
```

- The server **refuses to start in production without both keys**.
- **Back up the data key.** Without it the stored records cannot be decrypted. Back up the `tinycare-data` volume (`tinycare.db`) too.
- Put a TLS reverse proxy in front — the app only talks to `https://` servers. Caddy example (automatic certificates):
  ```
  tinycare.example.com {
      reverse_proxy 127.0.0.1:8080
  }
  ```
  The proxy must set `X-Forwarded-For` (Caddy/nginx do) — it is used for login rate limiting.
- Platforms that give you HTTPS themselves (Render, Fly, Railway): deploy the `Dockerfile`, set the two secrets as environment variables, mount a persistent disk at `/data`.
- **Run one instance only** (SQLite file + in-memory rate limiter). For more scale, move to Postgres and a shared rate limiter first.

> The Dockerfile was written and its runtime layout was tested (production start, API, static files) but the image itself was not built in the authoring environment — run `docker compose up --build` once and check `/api/health`.

## 3. Point the phone apps at the server

Set the public URL at build time (it is baked into the app), then build with EAS:

```bash
EXPO_PUBLIC_API_URL=https://tinycare.example.com eas build -p all --profile production
```

With it set, the app shows **Cloud sync** in Settings and syncs after sign-in; without it, the app stays fully offline. Plain `http://` is refused (except localhost during development).

## 4. What the server stores

| Data | How |
|---|---|
| Name, phone | plain text (needed to sign in) |
| Password | scrypt salted hash, never the password |
| Health records | one JSON document per user, AES-256-GCM encrypted with `TINYCARE_DATA_KEY` |
| Login tokens | HMAC-signed, 30-day expiry, not stored |

Conflict handling: each upload names the version it was based on; a stale upload gets `409` and the app merges (log entries from both devices are kept). Deleting the account in the app deletes the server copy.

## 5. Static-only hosting (GitHub Pages, Netlify)

`npm run build:web` without `EXPO_PUBLIC_API_URL` produces a static site that works in the browser with data kept in that browser only (no sync, no secure storage). Fine for a demo; for real use run the server.

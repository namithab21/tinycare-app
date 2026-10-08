# TinyCare — mother & child health app (iOS + Android)

Mobile companion to the [childcare website](https://github.com/lakshyad310306/childcare). Built with Expo (SDK 57) + Expo Router + TypeScript. **Works on phones, in the browser, and from your own server.** Offline-first: it runs fully on-device, and optional encrypted cloud sync (one small Node server, no dependencies) lets the same account work on several devices and the web.

Features: vaccination schedule (27 NIS-style doses) with local reminders · WHO-style growth tracking · age-safe activities (under 6 months = bonding/sensory only) · postpartum recovery (90-day rest rule, C-section warnings, BP / red-flag alerts) · regional recovery & child nutrition · mood calendar · Health Passport PDF · 5 languages (EN/HI/KN/TE/TA) · dark mode · Face ID / fingerprint lock · in-app account & data deletion.

## Run it (Antigravity, VS Code, any terminal)

```bash
git clone <your-new-repo-url> tinycare-app && cd tinycare-app
npm install
npx expo start          # scan the QR with Expo Go, or press i / a / w
```

Useful: `npm run typecheck` · `npm run lint` · `npm test` · `npm run legal` (rebuilds `docs/*.html` from the in-app policy text).

## Run it as a website + server

```bash
EXPO_PUBLIC_API_URL=same-origin npm run build:web
npm run server            # http://localhost:8080 - web app, API and legal pages
```

Production (Docker, HTTPS, secrets, backups, pointing phone builds at it): **[docs/DEPLOY.md](docs/DEPLOY.md)**.

`npx expo install --fix` aligns package versions to the SDK if you ever upgrade.

## Release

Your pre-launch checklist is tracked in **[docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)** (done vs. what only you can do). Store text and screenshots: **[docs/STORE_LISTING.md](docs/STORE_LISTING.md)** and `store/screenshots/`.

## Layout

```
src/app/        screens (Expo Router)      src/data/      vaccines, activities, nutrition, care guide
src/services/   health rules, secure storage, notifications, crash, passport PDF
src/store/      app state + persistence    src/i18n/      translations     src/legal/  policy text
server/         Node API + static host (accounts, encrypted sync)   tests/  sync tests
scripts/        e2e_sync.py · generate_assets.py · build_legal.mjs · store_screenshots.py
docs/           privacy.html, terms.html (host with GitHub Pages)
```

Medical content is general guidance, not medical advice. Have a clinician review it before public release.

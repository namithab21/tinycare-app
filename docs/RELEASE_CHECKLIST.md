# Release checklist

Legend: ✅ done in this repo · 🟡 placeholder you must replace · ⛔ needs your accounts/credentials (cannot be done from code)

## ⚙️ Assets & configuration
| Item | Status | Notes |
|---|---|---|
| App icons | ✅ | `assets/icon.png` 1024×1024 **RGB, no alpha** (verified). Android adaptive foreground/background/monochrome included. Expo generates all platform sizes at build. Regenerate with `scripts/generate_assets.py`. |
| Splash screen | ✅ | `expo-splash-screen` plugin, `resizeMode: contain` on a solid colour (adapts to any aspect ratio), separate **dark-mode** image + background. |
| Bundle ID / package | 🟡 | `com.tinycare.app` in `app.json` (iOS `bundleIdentifier`, Android `package`). Change to `com.<yourcompany>.tinycare` **before the first upload** — it can never change afterwards. |
| Versioning | ✅ | `version 1.0.0`, iOS `buildNumber "1"`, Android `versionCode 1`. Bump build numbers for every store upload. |

## 🔒 Security & privacy
| Item | Status | Notes |
|---|---|---|
| Privacy Policy + Terms at a public URL | 🟡 | Pages are generated in `docs/`. Create a GitHub repo named `tinycare-app`, then Settings → Pages → deploy from `main` / `/docs`. URLs in `app.json → extra` assume `https://namithab21.github.io/tinycare-app/`. **Replace `support@tinycare.app`** (in `app.json` and `src/legal/*.json`, then `npm run legal`) with an address you own. |
| In-app account deletion | ✅ | Settings → *Delete account and data* (also on the sign-in screen). Cancels reminders, wipes Keychain/Keystore entries and all stored records. |
| HTTPS / network security | ✅ | The app makes **no network requests** (offline-first). Android `usesCleartextTraffic: false`; iOS has no ATS exceptions. If you add an API later, use `https://` only. |
| Secure token storage | ✅ | `expo-secure-store` → iOS Keychain (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) / Android Keystore-backed encrypted storage. Passwords are salted + hashed. Optional Face ID / fingerprint app lock. |

## 🛠️ Production services & analytics
| Item | Status | Notes |
|---|---|---|
| Server (optional) | ✅ | `server/` + `Dockerfile`, see `docs/DEPLOY.md`. If you ship phone builds that sync, set `EXPO_PUBLIC_API_URL` (https) and fill the App Privacy / Data safety forms to say name, phone and health records are collected and stored on your server. |
| Push notifications | 🟡/⛔ | Vaccine reminders use **local** notifications (no APNs/FCM needed). Remote push is *not* used. If you add it: `eas credentials` (APNs key `.p8`), Firebase project + `google-services.json` for FCM. |
| Crash reporting | 🟡 | Sentry integrated and **off until** `EXPO_PUBLIC_SENTRY_DSN` is set (see `.env.example`); no PII is sent. For native symbolication add the `@sentry/react-native/expo` plugin to `app.json` and set `SENTRY_AUTH_TOKEN` as an EAS secret. |
| Store metadata | ✅/🟡 | Draft text in `docs/STORE_LISTING.md`; screenshots for iPhone 6.9", iPad 13" and Android phone in `store/screenshots/` (generated from the real app with demo data — review them). |

## 🚀 Store accounts & deployment (⛔ yours to do)
1. **Apple Developer Program** ($99/yr) and **Google Play Console** ($25 one-time) accounts.
2. `npm i -g eas-cli && eas login && eas init`, then `eas build -p all --profile production`. EAS creates and stores your **Android keystore** and **iOS distribution certificate/provisioning profile** — run `eas credentials` and download a backup of both.
3. iOS: create the app in App Store Connect, put its numeric id in `eas.json → submit.production.ios.ascAppId`, `eas submit -p ios`, then test in **TestFlight**.
4. Android: create the app in Play Console, upload the first `.aab` manually once, then `eas submit -p android` → **Internal testing** track; test on real devices.
5. Fill the Data safety (Play) / App Privacy (Apple) forms: health data stored on-device only, nothing shared, deletion available in-app.

## Before going public
- Have a doctor review the vaccine schedule, growth, recovery and nutrition content.
- iPad is enabled (`supportsTablet: true`); set `false` in `app.json` if you don't want to supply iPad screenshots/QA.

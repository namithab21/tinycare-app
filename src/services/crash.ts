/**
 * Crash reporting (Sentry). Disabled unless EXPO_PUBLIC_SENTRY_DSN is set at build time.
 * No personal data is attached: PII sending is off and user/breadcrumb data is stripped.
 */
import * as Sentry from '@sentry/react-native';

let enabled = false;

export function initCrashReporting(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || enabled) return;
  try {
    Sentry.init({
      dsn,
      sendDefaultPii: false,
      enableNative: true,
      tracesSampleRate: 0,
      beforeSend(event) {
        delete event.user;
        delete event.request;
        return event;
      },
    });
    enabled = true;
  } catch {
    // Never let diagnostics crash the app.
  }
}

export function reportError(error: unknown): void {
  if (!enabled) return;
  try {
    Sentry.captureException(error);
  } catch {
    // ignore
  }
}

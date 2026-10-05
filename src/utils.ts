import type { Lang } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** Local-date ISO string (YYYY-MM-DD) — avoids UTC off-by-one for IST users. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addWeeks(iso: string, weeks: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + Math.round(weeks * 7));
  return toISODate(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / DAY);
}

export function daysSince(iso: string): number {
  return daysBetween(iso, toISODate());
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return toISODate(d) === s;
}

/** Age in whole weeks / months / years for display and filtering. */
export function ageInWeeks(dobIso: string): number {
  return Math.max(0, Math.floor(daysSince(dobIso) / 7));
}

export function ageInMonths(dobIso: string): number {
  const dob = parseISODate(dobIso);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  return Math.max(0, months);
}

export function ageLabel(dobIso: string): string {
  const m = ageInMonths(dobIso);
  if (m < 1) return `${Math.max(0, Math.floor(daysSince(dobIso) / 7))} wk`;
  if (m < 24) return `${m} mo`;
  const y = Math.floor(m / 12);
  const rem = m % 12;
  return rem ? `${y} yr ${rem} mo` : `${y} yr`;
}

const LOCALES: Record<Lang, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
};

export function formatDate(iso: string, lang: Lang): string {
  try {
    return parseISODate(iso.slice(0, 10)).toLocaleDateString(LOCALES[lang], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function num(s: string): number | undefined {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Child-age rule carried over from the Django website: profiles are for ages 0–13. */
export const MAX_CHILD_AGE_YEARS = 13;

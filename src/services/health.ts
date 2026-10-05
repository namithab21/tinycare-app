import { VACCINE_BY_ID } from '@/data/vaccines';
import type { Dict } from '@/i18n/translations';
import type { DataState, MotherProfile, RecoveryMetric } from '@/types';
import { daysSince, isValidISODate, MAX_CHILD_AGE_YEARS, parseISODate, toISODate } from '@/utils';

export function postpartumDay(mother: MotherProfile): number {
  return Math.max(0, daysSince(mother.deliveryDate));
}

export function isBpHigh(systolic?: number, diastolic?: number): boolean {
  if (systolic === undefined || diastolic === undefined) return false;
  return systolic >= 140 || diastolic >= 90;
}

export function latestMetric(metrics: RecoveryMetric[]): RecoveryMetric | undefined {
  return [...metrics].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
}

/** Child profiles are limited to ages 0–13 and cannot have a future date of birth. */
export function validateChildDob(dob: string): boolean {
  if (!isValidISODate(dob)) return false;
  const today = toISODate();
  if (dob > today) return false;
  const limit = parseISODate(today);
  limit.setFullYear(limit.getFullYear() - MAX_CHILD_AGE_YEARS - 1);
  limit.setDate(limit.getDate() + 1);
  return parseISODate(dob).getTime() >= limit.getTime();
}

export function validateDeliveryDate(date: string): 'ok' | 'format' | 'future' {
  if (!isValidISODate(date)) return 'format';
  if (date > toISODate()) return 'future';
  return 'ok';
}

export type Severity = 'danger' | 'warn';
export interface Alert {
  id: string;
  severity: Severity;
  text: string;
  /** Route to open when tapped. */
  href?: '/mother' | '/children' | '/notifications';
}

export function buildAlerts(state: DataState, t: Dict): Alert[] {
  const alerts: Alert[] = [];
  const today = toISODate();

  const metric = latestMetric(state.metrics);
  if (metric && isBpHigh(metric.systolic, metric.diastolic)) {
    alerts.push({ id: 'bp', severity: 'danger', text: t.bpAlert, href: '/mother' });
  }

  for (const v of state.vaccinations) {
    if (v.administeredDate || v.dueDate >= today) continue;
    const child = state.children.find((c) => c.id === v.childId);
    const vaccine = VACCINE_BY_ID[v.vaccineId];
    if (!child || !vaccine) continue;
    alerts.push({
      id: `overdue_${v.id}`,
      severity: 'warn',
      text: t.overdueAlert.replace('{vaccine}', vaccine.name).replace('{child}', child.name),
      href: '/children',
    });
  }
  return alerts.slice(0, 6);
}

/** PHQ-2 style screen: two questions scored 0–3. A total of 3 or more suggests follow-up. */
export function screeningNeedsFollowUp(score: number): boolean {
  return score >= 3;
}

export type VaccineStatus = 'completed' | 'overdue' | 'pending';

export function vaccineStatus(entry: { administeredDate?: string; dueDate: string }): VaccineStatus {
  if (entry.administeredDate) return 'completed';
  return entry.dueDate < toISODate() ? 'overdue' : 'pending';
}

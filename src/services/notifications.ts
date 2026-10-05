import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { VACCINE_BY_ID } from '@/data/vaccines';
import type { Dict } from '@/i18n/translations';
import type { DataState } from '@/types';
import { formatDate, parseISODate, toISODate } from '@/utils';

const CHANNEL_ID = 'vaccine-reminders';
const MAX_SCHEDULED = 50; // iOS keeps at most 64 pending local notifications.
const REMINDER_HOUR = 9;

const supported = Platform.OS !== 'web';

export function setupNotificationHandler(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureChannel(): Promise<void> {
  if (!supported || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Vaccine reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function permissionGranted(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

export async function requestPermission(): Promise<boolean> {
  if (!supported) return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelAllReminders(): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function at9(iso: string, offsetDays: number): Date {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(REMINDER_HOUR, 0, 0, 0);
  return d;
}

/**
 * Re-creates local reminders for the next pending vaccines:
 * one two days before and one on the due date, at 9:00 local time.
 */
export async function rescheduleVaccineReminders(state: DataState, t: Dict): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!state.settings.remindersEnabled || !(await permissionGranted())) return;
  await ensureChannel();

  const now = Date.now();
  const today = toISODate();
  const upcoming = state.vaccinations
    .filter((v) => !v.administeredDate && v.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let count = 0;
  for (const entry of upcoming) {
    const child = state.children.find((c) => c.id === entry.childId);
    const vaccine = VACCINE_BY_ID[entry.vaccineId];
    if (!child || !vaccine) continue;
    for (const offset of [-2, 0]) {
      if (count >= MAX_SCHEDULED) return;
      const when = at9(entry.dueDate, offset);
      if (when.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${t.nextVaccine}: ${child.name}`,
          body: `${vaccine.name} — ${t.dueOn.replace('{date}', formatDate(entry.dueDate, state.settings.language))}`,
          data: { childId: child.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL_ID,
        },
      });
      count++;
    }
  }
}

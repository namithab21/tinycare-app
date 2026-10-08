/**
 * Pure helpers for cloud sync (no React / Expo imports, so they can be unit-tested with plain Node).
 *
 * What syncs: health records, children, vaccinations, mother profile, and the language/region/theme preferences.
 * What never leaves the device: the local account object, the notification inbox (derived data), and
 * device-specific switches (app lock, reminders).
 *
 * Conflict policy: if only one side changed, that side wins. If both changed since the last sync, append-only logs
 * (vitals, moods, screenings, growth, completed activities) are merged by id; everything else keeps the device
 * the person is using right now.
 */
import type { DataState, Settings } from '@/types';

export type SyncPayload = Omit<DataState, 'account' | 'inbox' | 'settings'> & {
  settings: Pick<Settings, 'language' | 'region' | 'theme'>;
};

export function toSyncable(s: DataState): SyncPayload {
  const { account: _account, inbox: _inbox, settings, ...rest } = s;
  return { ...rest, settings: { language: settings.language, region: settings.region, theme: settings.theme } };
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Applies a remote snapshot onto local state, keeping local-only fields. */
export function applyRemote(local: DataState, remote: Partial<SyncPayload>): DataState {
  return {
    ...local,
    mother: remote.mother,
    onboardingDone: remote.onboardingDone ?? local.onboardingDone,
    metrics: arr(remote.metrics),
    moods: arr(remote.moods),
    screenings: arr(remote.screenings),
    children: arr(remote.children),
    growth: arr(remote.growth),
    vaccinations: arr(remote.vaccinations),
    completions: arr(remote.completions),
    settings: {
      ...local.settings,
      language: remote.settings?.language ?? local.settings.language,
      region: remote.settings?.region ?? local.settings.region,
      theme: remote.settings?.theme ?? local.settings.theme,
    },
  };
}

function unionById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const seen = new Set(local.map((x) => x.id));
  return [...local, ...remote.filter((x) => !seen.has(x.id))];
}

/** Both sides changed since the last sync: keep local, but never lose log entries recorded on the other device. */
export function mergeConcurrent(local: DataState, remote: Partial<SyncPayload>): DataState {
  const childIds = new Set(local.children.map((c) => c.id));
  return {
    ...local,
    metrics: unionById(local.metrics, arr(remote.metrics)),
    moods: unionById(local.moods, arr(remote.moods)),
    screenings: unionById(local.screenings, arr(remote.screenings)),
    // Growth and completions belong to a child; only keep those whose child still exists locally.
    growth: unionById(local.growth, arr<DataState['growth'][number]>(remote.growth)).filter((g) => childIds.has(g.childId)),
    completions: unionById(local.completions, arr<DataState['completions'][number]>(remote.completions)).filter((c) => childIds.has(c.childId)),
  };
}

export function signature(s: DataState): string {
  return JSON.stringify(toSyncable(s));
}

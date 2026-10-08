import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { VACCINES } from '@/data/vaccines';
import { translations } from '@/i18n/translations';
import {
  ApiError,
  getToken,
  remoteDeleteAccount,
  remotePull,
  remotePush,
  remoteSignIn,
  remoteSignUp,
  setToken,
  syncAvailable,
} from '@/services/api';
import { reportError } from '@/services/crash';
import { cancelAllReminders, rescheduleVaccineReminders } from '@/services/notifications';
import {
  clearSession,
  createSession,
  hasSession,
  saveCredential,
  verifyCredential,
  wipeSecureData,
} from '@/services/security';
import { applyRemote, mergeConcurrent, signature, toSyncable, type SyncPayload } from '@/services/sync';
import type { Child, DataState, Lang, VaccinationEntry } from '@/types';
import { addWeeks, toISODate, uid } from '@/utils';

const STORAGE_KEY = 'tinycare:state:v1';
const SYNC_KEY = 'tinycare:sync:v1';

interface SyncMeta {
  /** Last server version this device has applied or pushed. */
  version: number;
  /** Local changes not yet pushed. */
  dirty: boolean;
}
export type SyncStatus = 'off' | 'synced' | 'pending' | 'syncing' | 'error';
export interface SyncInfo {
  status: SyncStatus;
  lastSyncedAt?: string;
}

const SUPPORTED: Lang[] = ['en', 'hi', 'kn', 'te', 'ta'];

function deviceLanguage(): Lang {
  try {
    const code = getLocales()[0]?.languageCode ?? 'en';
    return (SUPPORTED as string[]).includes(code) ? (code as Lang) : 'en';
  } catch {
    return 'en';
  }
}

function initialState(): DataState {
  return {
    onboardingDone: false,
    metrics: [],
    moods: [],
    screenings: [],
    children: [],
    growth: [],
    vaccinations: [],
    completions: [],
    inbox: [],
    settings: {
      language: deviceLanguage(),
      region: 'SOUTH',
      appLock: false,
      remindersEnabled: false,
      theme: 'system',
    },
  };
}

export function buildSchedule(child: Child): VaccinationEntry[] {
  return VACCINES.map((v) => ({
    id: uid(),
    childId: child.id,
    vaccineId: v.id,
    dueDate: addWeeks(child.dob, v.ageWeeks),
  }));
}

type SignUpResult = { ok: true } | { ok: false; reason?: 'taken' | 'network' };

interface StoreValue {
  state: DataState;
  /** True once persisted data and session have been read from the device. */
  ready: boolean;
  signedIn: boolean;
  locked: boolean;
  t: (typeof translations)['en'];
  update: (fn: (s: DataState) => DataState) => void;
  signUp: (name: string, phone: string, password: string) => Promise<SignUpResult>;
  signIn: (phone: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Resolves false (and keeps all data) if the cloud copy could not be deleted. */
  deleteAccount: () => Promise<boolean>;
  sync: SyncInfo;
  syncNow: () => Promise<void>;
  setLocked: (locked: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(initialState);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [locked, setLocked] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const signedInRef = useRef(false);
  signedInRef.current = signedIn;

  // ---- optional cloud sync (inactive when no server URL is configured)
  const [sync, setSync] = useState<SyncInfo>({ status: syncAvailable() ? 'pending' : 'off' });
  const metaRef = useRef<SyncMeta>({ version: 0, dirty: false });
  const metaLoaded = useRef(false);
  const lastSig = useRef<string | null>(null);
  const syncing = useRef(false);

  const saveMeta = useCallback((patch: Partial<SyncMeta>) => {
    metaRef.current = { ...metaRef.current, ...patch };
    AsyncStorage.setItem(SYNC_KEY, JSON.stringify(metaRef.current)).catch(reportError);
  }, []);

  const loadMeta = useCallback(async () => {
    if (metaLoaded.current) return;
    try {
      const raw = await AsyncStorage.getItem(SYNC_KEY);
      if (raw) metaRef.current = { ...metaRef.current, ...(JSON.parse(raw) as Partial<SyncMeta>) };
    } catch (e) {
      reportError(e);
    }
    metaLoaded.current = true;
  }, []);

  const syncNow = useCallback(async () => {
    if (!syncAvailable() || syncing.current || !signedInRef.current) return;
    const token = await getToken();
    if (!token) return setSync({ status: 'off' });
    syncing.current = true;
    setSync((x) => ({ ...x, status: 'syncing' }));
    try {
      await loadMeta();
      for (let attempt = 0; attempt < 3; attempt++) {
        const remote = await remotePull<Partial<SyncPayload>>(token);
        const remoteNewer = remote.version > metaRef.current.version && !!remote.state;
        const needsPush = metaRef.current.dirty || remote.version === 0;
        if (!needsPush) {
          if (remoteNewer) {
            const next = applyRemote(stateRef.current, remote.state!);
            lastSig.current = signature(next);
            setState(next);
            saveMeta({ version: remote.version });
          }
          setSync({ status: 'synced', lastSyncedAt: new Date().toISOString() });
          return;
        }
        let toPush = stateRef.current;
        if (remoteNewer) {
          toPush = mergeConcurrent(stateRef.current, remote.state!);
          lastSig.current = signature(toPush);
          setState(toPush);
        }
        try {
          const res = await remotePush(token, toSyncable(toPush), remote.version);
          // If the person edited while we were uploading, stay dirty and go again shortly.
          const changedMeanwhile = signature(stateRef.current) !== signature(toPush);
          saveMeta({ version: res.version, dirty: changedMeanwhile });
          setSync({ status: changedMeanwhile ? 'pending' : 'synced', lastSyncedAt: res.updatedAt });
          if (changedMeanwhile) setTimeout(() => void syncNow(), 1000);
          return;
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) continue; // someone pushed in between: pull again and re-merge
          throw e;
        }
      }
      setSync((x) => ({ ...x, status: 'pending' }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setSync((x) => ({ ...x, status: 'error' }));
      else {
        setSync((x) => ({ ...x, status: 'pending' }));
        if (!(e instanceof ApiError && e.code === 'network')) reportError(e);
      }
    } finally {
      syncing.current = false;
    }
  }, [loadMeta, saveMeta]);

  // Detect local edits to synced data (not inbox / device-only settings) and push after a short pause.
  const sig = useMemo(() => signature(state), [state]);
  useEffect(() => {
    if (!ready) return;
    if (lastSig.current === null) {
      lastSig.current = sig;
      return;
    }
    if (sig === lastSig.current) return; // unchanged, or just applied from the server
    lastSig.current = sig;
    if (!syncAvailable() || !signedIn) return;
    void loadMeta().then(() => saveMeta({ dirty: true }));
    setSync((x) => ({ ...x, status: 'pending' }));
    const handle = setTimeout(() => void syncNow(), 3000);
    return () => clearTimeout(handle);
  }, [sig, ready, signedIn, syncNow, loadMeta, saveMeta]);

  // Sync on launch / sign-in and whenever the app returns to the foreground.
  useEffect(() => {
    if (ready && signedIn) void syncNow();
  }, [ready, signedIn, syncNow]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void syncNow();
    });
    return () => sub.remove();
  }, [syncNow]);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const session = await hasSession();
        if (cancelled) return;
        if (raw) {
          const saved = JSON.parse(raw) as Partial<DataState>;
          const base = initialState();
          const merged: DataState = {
            ...base,
            ...saved,
            settings: { ...base.settings, ...(saved.settings ?? {}) },
          };
          setState(merged);
          const isSignedIn = session && !!merged.account;
          setSignedIn(isSignedIn);
          setLocked(isSignedIn && merged.settings.appLock);
        }
      } catch (e) {
        reportError(e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist (debounced) after the initial load.
  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(reportError);
    }, 200);
    return () => clearTimeout(handle);
  }, [state, ready]);

  // Re-lock the app when it returns from the background (if app lock is on).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' && stateRef.current.settings.appLock && stateRef.current.account) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  // Keep local vaccine reminders and the in-app overdue alerts in sync with the data.
  useEffect(() => {
    if (!ready || !signedIn) return;
    const t = translations[state.settings.language];
    rescheduleVaccineReminders(state, t).catch(reportError);
    // Deliberately narrow deps: only re-sync reminders when these fields change, not on every mood log.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signedIn, state.vaccinations, state.children, state.settings.remindersEnabled, state.settings.language]);

  const update = useCallback((fn: (s: DataState) => DataState) => setState((s) => fn(s)), []);

  const signUp = useCallback(
    async (name: string, phone: string, password: string): Promise<SignUpResult> => {
      try {
        let remote: Awaited<ReturnType<typeof remoteSignUp>> | null = null;
        if (syncAvailable()) {
          try {
            remote = await remoteSignUp(name.trim(), phone, password);
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) return { ok: false, reason: 'taken' };
            if (e instanceof ApiError && (e.code === 'network' || e.status === 0 || e.status === 429)) return { ok: false, reason: 'network' };
            throw e;
          }
          await setToken(remote.token);
        }
        await saveCredential(phone, password);
        await createSession();
        setState((s) => ({
          ...s,
          account: { id: remote?.user.id ?? uid(), name: name.trim(), phone, createdAt: new Date().toISOString() },
        }));
        if (remote) {
          await loadMeta();
          saveMeta({ version: 0, dirty: true });
        }
        setSignedIn(true);
        setLocked(false);
        return { ok: true };
      } catch (e) {
        reportError(e);
        return { ok: false };
      }
    },
    [loadMeta, saveMeta],
  );

  /** Local-only accounts (created before a server was configured) or expired tokens: link to / refresh the server account. */
  const ensureToken = useCallback(
    async (phone: string, password: string) => {
      try {
        if (await getToken()) return;
        let r;
        try {
          r = await remoteSignIn(phone, password);
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 401)) throw e;
          const name = stateRef.current.account?.name ?? 'TinyCare user';
          r = await remoteSignUp(name, phone, password); // 409 here means the number belongs to someone else: stay offline
        }
        await setToken(r.token);
        await loadMeta();
        saveMeta({ dirty: true });
        void syncNow();
      } catch {
        // Offline or not possible: the app keeps working locally.
      }
    },
    [loadMeta, saveMeta, syncNow],
  );

  const signIn = useCallback(
    async (phone: string, password: string): Promise<boolean> => {
      const local = stateRef.current.account;
      if (local?.phone === phone && (await verifyCredential(phone, password))) {
        await createSession();
        setSignedIn(true);
        setLocked(false);
        if (syncAvailable()) void ensureToken(phone, password);
        return true;
      }
      // New device (or a changed password): sign in on the server and bring the data down.
      // One account per device: never replace a different local account.
      if (!syncAvailable() || (local && local.phone !== phone)) return false;
      try {
        const r = await remoteSignIn(phone, password);
        await setToken(r.token);
        await saveCredential(phone, password);
        await createSession();
        const remote = await remotePull<Partial<SyncPayload>>(r.token);
        let next: DataState = {
          ...stateRef.current,
          account: { id: r.user.id, name: r.user.name, phone, createdAt: local?.createdAt ?? new Date().toISOString() },
        };
        if (remote.state) next = applyRemote(next, remote.state);
        await loadMeta();
        lastSig.current = signature(next);
        setState(next);
        saveMeta({ version: remote.version, dirty: false });
        setSignedIn(true);
        setLocked(false);
        return true;
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) reportError(e);
        return false;
      }
    },
    [ensureToken, loadMeta, saveMeta],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setSignedIn(false);
    setLocked(false);
  }, []);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    // The server copy goes first: if it can't be removed, keep everything so the person can retry.
    const token = await getToken();
    if (token) {
      try {
        await remoteDeleteAccount(token);
      } catch {
        return false;
      }
    }
    await cancelAllReminders().catch(reportError);
    await wipeSecureData();
    await AsyncStorage.multiRemove([STORAGE_KEY, SYNC_KEY]);
    metaRef.current = { version: 0, dirty: false };
    const fresh = initialState();
    // Keep the chosen language so the confirmation flow stays readable.
    fresh.settings.language = stateRef.current.settings.language;
    lastSig.current = signature(fresh);
    setState(fresh);
    setSignedIn(false);
    setLocked(false);
    return true;
  }, []);

  // Deterministic in-app alerts for overdue vaccines (deduplicated by id).
  useEffect(() => {
    if (!ready || !signedIn) return;
    const today = toISODate();
    const t = translations[state.settings.language];
    const existing = new Set(state.inbox.map((i) => i.id));
    const additions = state.vaccinations
      .filter((v) => !v.administeredDate && v.dueDate < today && !existing.has(`overdue_${v.id}`))
      .flatMap((v) => {
        const child = state.children.find((c) => c.id === v.childId);
        const vaccine = VACCINES.find((x) => x.id === v.vaccineId);
        if (!child || !vaccine) return [];
        return [
          {
            id: `overdue_${v.id}`,
            title: t.overdue,
            message: t.overdueAlert.replace('{vaccine}', vaccine.name).replace('{child}', child.name),
            urgent: true,
            read: false,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    if (additions.length) {
      setState((s) => ({ ...s, inbox: [...additions, ...s.inbox] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signedIn, state.vaccinations, state.children]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      ready,
      signedIn,
      locked,
      t: translations[state.settings.language],
      update,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      sync,
      syncNow,
      setLocked,
    }),
    [state, ready, signedIn, locked, update, signUp, signIn, signOut, deleteAccount, sync, syncNow],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}

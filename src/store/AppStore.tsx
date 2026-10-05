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
import type { Child, DataState, Lang, VaccinationEntry } from '@/types';
import { addWeeks, toISODate, uid } from '@/utils';

const STORAGE_KEY = 'tinycare:state:v1';

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

type SignUpResult = { ok: true } | { ok: false };

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
  deleteAccount: () => Promise<void>;
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
        await saveCredential(phone, password);
        await createSession();
        setState((s) => ({
          ...s,
          account: { id: uid(), name: name.trim(), phone, createdAt: new Date().toISOString() },
        }));
        setSignedIn(true);
        setLocked(false);
        return { ok: true };
      } catch (e) {
        reportError(e);
        return { ok: false };
      }
    },
    [],
  );

  const signIn = useCallback(async (phone: string, password: string): Promise<boolean> => {
    const ok = await verifyCredential(phone, password);
    if (!ok || stateRef.current.account?.phone !== phone) return false;
    await createSession();
    setSignedIn(true);
    setLocked(false);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSignedIn(false);
    setLocked(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    await cancelAllReminders().catch(reportError);
    await wipeSecureData();
    await AsyncStorage.removeItem(STORAGE_KEY);
    const fresh = initialState();
    // Keep the chosen language so the confirmation flow stays readable.
    fresh.settings.language = stateRef.current.settings.language;
    setState(fresh);
    setSignedIn(false);
    setLocked(false);
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
      setLocked,
    }),
    [state, ready, signedIn, locked, update, signUp, signIn, signOut, deleteAccount],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}

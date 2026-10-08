/**
 * Optional cloud sync client. The app is fully functional offline; sync turns on only when a server URL is configured:
 *   EXPO_PUBLIC_API_URL=https://your-server.example   (mobile builds)
 *   EXPO_PUBLIC_API_URL=same-origin                    (web build served by the TinyCare server)
 * Only https is accepted (plain http only for localhost during development).
 */
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

const TOKEN_KEY = 'tc_token';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public body?: unknown,
  ) {
    super(`${status} ${code}`);
  }
}

export function apiBase(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  if (raw === 'same-origin') return Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : null;
  try {
    const u = new URL(raw);
    const local = ['localhost', '127.0.0.1', '10.0.2.2'].includes(u.hostname);
    if (u.protocol === 'https:' || (u.protocol === 'http:' && local && __DEV__)) return u.origin;
  } catch {
    // fall through
  }
  return null; // invalid or insecure URL: stay offline rather than send health data over http
}

export const syncAvailable = (): boolean => apiBase() !== null;

export const getToken = () => secureStorage.get(TOKEN_KEY);
export const setToken = (t: string) => secureStorage.set(TOKEN_KEY, t);
export const clearToken = () => secureStorage.remove(TOKEN_KEY);

async function request<T>(path: string, init: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const base = apiBase();
  if (!base) throw new ApiError(0, 'not_configured');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError(0, 'network');
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, String(data.error ?? 'error'), data);
  return data as T;
}

interface AuthResult {
  token: string;
  user: { id: string; name: string; phone: string };
}

export const remoteSignUp = (name: string, phone: string, password: string) =>
  request<AuthResult>('/api/auth/signup', { method: 'POST', body: { name, phone, password } });
export const remoteSignIn = (phone: string, password: string) =>
  request<AuthResult>('/api/auth/login', { method: 'POST', body: { phone, password } });

export interface RemoteRecord<S> {
  version: number;
  state: S | null;
  updatedAt: string | null;
}
export const remotePull = <S>(token: string) => request<RemoteRecord<S>>('/api/sync', { token });
export const remotePush = <S>(token: string, state: S, baseVersion: number, force = false) =>
  request<{ version: number; updatedAt: string }>('/api/sync', { method: 'PUT', token, body: { state, baseVersion, force } });
export const remoteDeleteAccount = (token: string) => request<{ deleted: boolean }>('/api/account', { method: 'DELETE', token });

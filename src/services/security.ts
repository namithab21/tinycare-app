import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

const CRED_KEY = 'tc_credential';
const SESSION_KEY = 'tc_session';
const ROUNDS = 1000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(byteLength = 16): string {
  return toHex(Crypto.getRandomBytes(byteLength));
}

/** Salted, iterated SHA-256. The credential only unlocks this device's local data. */
async function derive(password: string, salt: string): Promise<string> {
  let digest = `${salt}:${password}`;
  for (let i = 0; i < ROUNDS; i++) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, digest);
  }
  return digest;
}

interface StoredCredential {
  phone: string;
  salt: string;
  hash: string;
}

export async function saveCredential(phone: string, password: string): Promise<void> {
  const salt = randomHex(16);
  const hash = await derive(password, salt);
  const cred: StoredCredential = { phone, salt, hash };
  await secureStorage.set(CRED_KEY, JSON.stringify(cred));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyCredential(phone: string, password: string): Promise<boolean> {
  const raw = await secureStorage.get(CRED_KEY);
  if (!raw) return false;
  try {
    const cred = JSON.parse(raw) as StoredCredential;
    if (cred.phone !== phone) return false;
    return safeEqual(await derive(password, cred.salt), cred.hash);
  } catch {
    return false;
  }
}

export async function hasCredential(): Promise<boolean> {
  return (await secureStorage.get(CRED_KEY)) !== null;
}

export async function createSession(): Promise<void> {
  await secureStorage.set(SESSION_KEY, randomHex(32));
}

export async function hasSession(): Promise<boolean> {
  return (await secureStorage.get(SESSION_KEY)) !== null;
}

export async function clearSession(): Promise<void> {
  await secureStorage.remove(SESSION_KEY);
}

export async function wipeSecureData(): Promise<void> {
  await secureStorage.remove(CRED_KEY);
  await secureStorage.remove(SESSION_KEY);
  await secureStorage.remove('tc_token'); // cloud-sync token (see services/api.ts)
}

export async function biometricsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hardware && enrolled;
  } catch {
    return false;
  }
}

export async function authenticate(reason: string, cancelLabel: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel,
      // Allow the device passcode as a fallback so users are never locked out.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

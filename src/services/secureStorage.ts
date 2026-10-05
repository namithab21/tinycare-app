/**
 * Secure storage for credentials and session tokens.
 *
 *  - iOS:     Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
 *  - Android: Android Keystore-backed encrypted SharedPreferences (via expo-secure-store)
 *  - Web:     not secure (no OS keystore). Web is a dev convenience only; the app targets iOS/Android.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const isWeb = Platform.OS === 'web';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) return AsyncStorage.getItem(`secure:${key}`);
    return SecureStore.getItemAsync(key, OPTIONS);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) return AsyncStorage.setItem(`secure:${key}`, value);
    await SecureStore.setItemAsync(key, value, OPTIONS);
  },
  async remove(key: string): Promise<void> {
    if (isWeb) return AsyncStorage.removeItem(`secure:${key}`);
    await SecureStore.deleteItemAsync(key, OPTIONS);
  },
};

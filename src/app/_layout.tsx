import { ErrorBoundaryProps, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { initCrashReporting, reportError } from '@/services/crash';
import { setupNotificationHandler } from '@/services/notifications';
import '@/services/webAlert';
import { AppStoreProvider, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
initCrashReporting();
setupNotificationHandler();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error);
  }, [error]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#F3FAF6' }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#16302A' }}>Something went wrong</Text>
      <Text style={{ color: '#5B746B', textAlign: 'center' }}>
        TinyCare ran into a problem. Your data is safe on this device. Please try again.
      </Text>
      <Button title="Try again" onPress={retry} />
    </View>
  );
}

function RootNavigator() {
  const { ready, signedIn, locked, state, t } = useStore();
  const c = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const header = {
    headerStyle: { backgroundColor: c.bg },
    headerTintColor: c.text,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
  };
  const inApp = signedIn && !locked && state.onboardingDone;

  return (
    <>
      <StatusBar style={c.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={header}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && locked}>
          <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && !locked && !state.onboardingDone}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>

        <Stack.Protected guard={inApp}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="child/[id]" options={{ title: '' }} />
          <Stack.Screen name="child/add" options={{ title: t.addChild, presentation: 'modal' }} />
          <Stack.Screen name="mother-edit" options={{ title: t.setupMother, presentation: 'modal' }} />
          <Stack.Screen name="screening" options={{ title: t.screening, presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ title: t.notifications }} />
        </Stack.Protected>

        <Stack.Screen name="privacy" options={{ title: t.privacyPolicy }} />
        <Stack.Screen name="terms" options={{ title: t.terms }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <RootNavigator />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

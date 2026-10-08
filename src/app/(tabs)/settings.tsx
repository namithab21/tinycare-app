import Constants from 'expo-constants';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Switch } from 'react-native';
import { Button, Card, Chip, ChipRow, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { LANGUAGES } from '@/i18n/translations';
import { permissionGranted, requestPermission } from '@/services/notifications';
import { authenticate, biometricsAvailable } from '@/services/security';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';
import type { Lang, ThemePref } from '@/types';

export default function SettingsTab() {
  const { state, t, update, signOut, deleteAccount, sync, syncNow } = useStore();
  const c = useTheme();
  const [msg, setMsg] = useState('');
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => update((st) => ({ ...st, settings: { ...st.settings, ...patch } }));

  const toggleLock = async (on: boolean) => {
    setMsg('');
    if (!on) return set({ appLock: false });
    if (!(await biometricsAvailable())) return setMsg(t.appLockUnavailable);
    // Confirm the user can actually pass the check before turning the lock on.
    if (await authenticate(t.unlockReason, t.cancel)) set({ appLock: true });
  };

  const toggleReminders = async (on: boolean) => {
    setMsg('');
    if (!on) return set({ remindersEnabled: false });
    const granted = (await permissionGranted()) || (await requestPermission());
    if (granted) set({ remindersEnabled: true });
    else setMsg(t.remindersDenied);
  };

  const confirmDelete = () =>
    Alert.alert(t.deleteTitle, t.deleteBody, [
      { text: t.cancel, style: 'cancel' },
      { text: t.deleteConfirmBtn, style: 'destructive', onPress: () => void deleteAccount().then((ok) => { if (!ok) Alert.alert(t.deleteTitle, t.deleteFailed); }) },
    ]);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const supportEmail = (Constants.expoConfig?.extra?.supportEmail as string | undefined) ?? 'support@tinycare.app';

  return (
    <Screen>
      <Card>
        <Txt variant="heading">{state.account?.name}</Txt>
        <Txt variant="muted">{state.account?.phone}</Txt>
      </Card>

      {sync.status !== 'off' ? (
        <>
          <SectionTitle>{t.syncTitle}</SectionTitle>
          <Card>
            <Txt>
              {sync.status === 'synced'
                ? t.syncSynced
                : sync.status === 'syncing'
                  ? t.syncSyncing
                  : sync.status === 'error'
                    ? t.syncError
                    : t.syncPending}
            </Txt>
            {sync.lastSyncedAt ? <Txt variant="muted">{new Date(sync.lastSyncedAt).toLocaleString()}</Txt> : null}
            <Button variant="secondary" title={t.syncNowBtn} onPress={() => void syncNow()} />
          </Card>
        </>
      ) : null}

      <SectionTitle>{t.language}</SectionTitle>
      <ChipRow>
        {LANGUAGES.map((l) => (
          <Chip key={l.code} label={l.label} selected={s.language === l.code} onPress={() => set({ language: l.code as Lang })} />
        ))}
      </ChipRow>

      <SectionTitle>{t.appearance}</SectionTitle>
      <ChipRow>
        {(
          [
            ['system', t.themeSystem],
            ['light', t.themeLight],
            ['dark', t.themeDark],
          ] as [ThemePref, string][]
        ).map(([key, label]) => (
          <Chip key={key} label={label} selected={s.theme === key} onPress={() => set({ theme: key })} />
        ))}
      </ChipRow>

      <SectionTitle>{t.security}</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt style={{ flex: 1 }}>{t.appLock}</Txt>
          <Switch
            accessibilityLabel={t.appLock}
            value={s.appLock}
            onValueChange={toggleLock}
            trackColor={{ true: c.primary, false: c.cardBorder }}
          />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt style={{ flex: 1 }}>{t.reminders}</Txt>
          <Switch
            accessibilityLabel={t.reminders}
            value={s.remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ true: c.primary, false: c.cardBorder }}
          />
        </Row>
        {msg ? <Txt variant="muted">{msg}</Txt> : null}
      </Card>

      <SectionTitle>{t.legal}</SectionTitle>
      <Card>
        <Link href="/privacy" style={{ color: c.primary, fontSize: 16, fontWeight: '700', paddingVertical: 8 }}>
          {t.privacyPolicy}
        </Link>
        <Link href="/terms" style={{ color: c.primary, fontSize: 16, fontWeight: '700', paddingVertical: 8 }}>
          {t.terms}
        </Link>
        <Button variant="ghost" title={t.support} onPress={() => void Linking.openURL(`mailto:${supportEmail}`)} />
      </Card>

      <SectionTitle>{t.account}</SectionTitle>
      <Button variant="secondary" title={t.signOut} onPress={() => void signOut()} />
      <Button variant="danger" title={t.deleteAccount} onPress={confirmDelete} />

      <Txt variant="muted" style={{ textAlign: 'center' }}>
        {t.version.replace('{v}', version)}
      </Txt>
      <Txt variant="muted" style={{ textAlign: 'center' }}>
        {t.disclaimer}
      </Txt>
    </Screen>
  );
}

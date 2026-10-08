import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chip, Field, FullScreen, Row, Txt } from '@/components/ui';
import { LANGUAGES } from '@/i18n/translations';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';

export default function AuthScreen() {
  const { t, state, update, signIn, signUp, deleteAccount } = useStore();
  const c = useTheme();
  const hasAccount = !!state.account;
  const [mode, setMode] = useState<'in' | 'up'>(hasAccount ? 'in' : 'up');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(state.account?.phone ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (mode === 'up') {
      if (!name.trim() || !phone.trim() || !password || !confirm) return setError(t.errRequired);
      if (cleanPhone.length !== 10) return setError(t.errPhone);
      if (password.length < 8) return setError(t.errPasswordShort);
      if (password !== confirm) return setError(t.errPasswordMismatch);
      setBusy(true);
      const res = await signUp(name, cleanPhone, password);
      setBusy(false);
      if (!res.ok) setError(res.reason === 'taken' ? t.errPhoneTaken : res.reason === 'network' ? t.errNetwork : t.errRequired);
    } else {
      if (!phone.trim() || !password) return setError(t.errRequired);
      setBusy(true);
      const ok = await signIn(cleanPhone, password);
      setBusy(false);
      if (!ok) setError(t.errWrongCreds);
    }
  };

  return (
    <FullScreen>
      <View style={{ alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: 44 }}>💚</Text>
        <Txt variant="title">{t.appName}</Txt>
        <Txt variant="muted" style={{ textAlign: 'center' }}>
          {t.tagline}
        </Txt>
      </View>

      <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {LANGUAGES.map((l) => (
          <Chip
            key={l.code}
            label={l.label}
            selected={state.settings.language === l.code}
            onPress={() => update((s) => ({ ...s, settings: { ...s.settings, language: l.code } }))}
          />
        ))}
      </Row>

      <Card>
        <Txt variant="heading">{mode === 'in' ? t.signIn : t.signUp}</Txt>
        {mode === 'up' ? (
          <Field label={t.name} value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        ) : null}
        <Field
          label={t.phone}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={14}
        />
        <Field
          label={t.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          textContentType={mode === 'up' ? 'newPassword' : 'password'}
        />
        {mode === 'up' ? (
          <Field
            label={t.confirmPassword}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 14 }}>
            {error}
          </Text>
        ) : null}
        <Button title={mode === 'in' ? t.signIn : t.signUp} onPress={submit} loading={busy} />
        {/* One account per device: the "create account" toggle only exists before an account is made. */}
        {hasAccount ? (
          <Button
            variant="ghost"
            title={t.deleteAccount}
            onPress={() =>
              Alert.alert(t.deleteTitle, t.deleteBody, [
                { text: t.cancel, style: 'cancel' },
                { text: t.deleteConfirmBtn, style: 'destructive', onPress: () => void deleteAccount().then((ok) => { if (!ok) Alert.alert(t.deleteTitle, t.deleteFailed); }) },
              ])
            }
          />
        ) : (
          <Button
            variant="ghost"
            title={mode === 'in' ? t.noAccount : t.haveAccount}
            onPress={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setError('');
            }}
          />
        )}
      </Card>

      <Txt variant="muted" style={{ textAlign: 'center' }}>
        {t.agreeTo}{' '}
        <Link href="/terms" style={{ color: c.primary, fontWeight: '700' }}>
          {t.terms}
        </Link>{' '}
        {t.and}{' '}
        <Link href="/privacy" style={{ color: c.primary, fontWeight: '700' }}>
          {t.privacyPolicy}
        </Link>
      </Txt>
    </FullScreen>
  );
}

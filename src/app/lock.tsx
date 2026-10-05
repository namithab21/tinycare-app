import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, FullScreen, Txt } from '@/components/ui';
import { authenticate } from '@/services/security';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';

export default function LockScreen() {
  const { t, setLocked, signOut } = useStore();
  const c = useTheme();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const tryUnlock = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    const ok = await authenticate(t.unlockReason, t.cancel);
    setBusy(false);
    if (ok) setLocked(false);
    else setFailed(true);
  }, [t, setLocked]);

  useEffect(() => {
    void tryUnlock();
    // Prompt once when the lock screen appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FullScreen>
      <Text style={{ fontSize: 56, textAlign: 'center' }}>🔒</Text>
      <Txt variant="title" style={{ textAlign: 'center' }}>
        {t.unlockTitle}
      </Txt>
      {failed ? (
        <Text accessibilityRole="alert" style={{ color: c.danger, textAlign: 'center' }}>
          {t.unlockFailed}
        </Text>
      ) : null}
      <Button title={t.unlock} onPress={tryUnlock} loading={busy} />
      <Button variant="ghost" title={t.signOut} onPress={() => void signOut()} />
    </FullScreen>
  );
}

import React from 'react';
import { Pressable } from 'react-native';
import { Button, Card, Pill, Row, Screen, Txt } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { formatDate } from '@/utils';

export default function Notifications() {
  const { state, t, update } = useStore();
  const items = [...state.inbox].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = items.some((i) => !i.read);

  const markRead = (id: string) =>
    update((s) => ({ ...s, inbox: s.inbox.map((i) => (i.id === id ? { ...i, read: true } : i)) }));

  return (
    <Screen>
      {unread ? (
        <Button
          variant="secondary"
          title={t.markAllRead}
          onPress={() => update((s) => ({ ...s, inbox: s.inbox.map((i) => ({ ...i, read: true })) }))}
        />
      ) : null}
      {items.length === 0 ? (
        <Card>
          <Txt variant="muted">{t.noNotifications}</Txt>
        </Card>
      ) : (
        items.map((i) => (
          <Pressable key={i.id} accessibilityRole="button" onPress={() => markRead(i.id)}>
            <Card tone={i.urgent && !i.read ? 'warn' : undefined} style={{ opacity: i.read ? 0.7 : 1 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="heading" style={{ flex: 1 }}>
                  {i.title}
                </Txt>
                {!i.read ? <Pill label="●" tone={i.urgent ? 'danger' : 'ok'} /> : null}
              </Row>
              <Txt>{i.message}</Txt>
              <Txt variant="muted">{formatDate(i.createdAt, state.settings.language)}</Txt>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

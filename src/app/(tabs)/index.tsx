import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Banner, Button, Card, Hero, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { MoodCalendar } from '@/components/MoodCalendar';
import { VACCINE_BY_ID } from '@/data/vaccines';
import { buildAlerts, postpartumDay } from '@/services/health';
import { requestPermission } from '@/services/notifications';
import { useStore } from '@/store/AppStore';
import { formatDate, toISODate } from '@/utils';

export default function Home() {
  const { state, t, update } = useStore();
  const lang = state.settings.language;
  const [reminderMsg, setReminderMsg] = useState('');

  const alerts = useMemo(() => buildAlerts(state, t), [state, t]);

  const nextVaccine = useMemo(() => {
    const today = toISODate();
    return state.vaccinations
      .filter((v) => !v.administeredDate && v.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  }, [state.vaccinations]);
  const nextChild = nextVaccine ? state.children.find((c) => c.id === nextVaccine.childId) : undefined;

  const enableReminders = async () => {
    const granted = await requestPermission();
    if (granted) {
      update((s) => ({ ...s, settings: { ...s.settings, remindersEnabled: true } }));
      setReminderMsg('');
    } else {
      setReminderMsg(t.remindersDenied);
    }
  };

  const firstName = (state.account?.name ?? '').split(' ')[0];
  const today = toISODate();
  const todayMood = state.moods.find((m) => m.date === today);

  return (
    <Screen>
      <Hero>
        <Txt variant="onHero" style={{ fontSize: 22, fontWeight: '800' }}>
          {t.hello.replace('{name}', firstName)}
        </Txt>
        <Txt variant="onHero">{formatDate(today, lang)}</Txt>
        {state.mother ? (
          <Txt variant="onHero" style={{ fontWeight: '700' }}>
            {t.postpartumDay.replace('{n}', String(postpartumDay(state.mother)))}
          </Txt>
        ) : null}
      </Hero>

      <SectionTitle>{t.priorityAlerts}</SectionTitle>
      {alerts.length === 0 ? (
        <Banner tone="ok" body={t.allGood} />
      ) : (
        alerts.map((a) => (
          <Banner
            key={a.id}
            tone={a.severity}
            body={a.text}
            onPress={a.href ? () => router.push(a.href as '/mother') : undefined}
          />
        ))
      )}

      {state.children.length > 0 && !state.settings.remindersEnabled ? (
        <Card>
          <Txt variant="heading">{t.reminders}</Txt>
          {reminderMsg ? <Txt variant="muted">{reminderMsg}</Txt> : null}
          <Button variant="secondary" title={t.reminders} onPress={enableReminders} />
        </Card>
      ) : null}

      <SectionTitle>{t.nextVaccine}</SectionTitle>
      <Card>
        {nextVaccine && nextChild ? (
          <>
            <Txt variant="heading">{VACCINE_BY_ID[nextVaccine.vaccineId]?.name}</Txt>
            <Txt variant="muted">
              {nextChild.name} · {t.dueOn.replace('{date}', formatDate(nextVaccine.dueDate, lang))}
            </Txt>
            <Button
              variant="secondary"
              title={t.vaccines}
              onPress={() => router.push({ pathname: '/child/[id]', params: { id: nextChild.id, tab: 'vaccines' } })}
            />
          </>
        ) : (
          <Txt variant="muted">{t.noVaccine}</Txt>
        )}
      </Card>

      <SectionTitle>{t.motherToday}</SectionTitle>
      <Card>
        {state.mother ? (
          <>
            <Txt variant="body">
              {postpartumDay(state.mother) <= 90 ? t.phase1 : t.phase2}
            </Txt>
            <Txt variant="muted">{todayMood ? t.logSaved : t.todayLog}</Txt>
            <Button variant="secondary" title={t.logMood} onPress={() => router.push('/mother')} />
          </>
        ) : (
          <Button variant="secondary" title={t.setupMother} onPress={() => router.push('/mother-edit')} />
        )}
      </Card>

      <SectionTitle>{t.moodCalendar}</SectionTitle>
      <Card>
        <MoodCalendar moods={state.moods} />
      </Card>

      <SectionTitle>{t.quickActions}</SectionTitle>
      <Row style={{ flexWrap: 'wrap' }}>
        <Button variant="secondary" title={t.addChild} onPress={() => router.push('/child/add')} />
        <Button variant="secondary" title={t.viewNotifications} onPress={() => router.push('/notifications')} />
      </Row>

      <Txt variant="muted" style={{ textAlign: 'center', marginTop: 8 }}>
        {t.disclaimer}
      </Txt>
    </Screen>
  );
}

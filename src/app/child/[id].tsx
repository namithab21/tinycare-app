import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  Hero,
  Pill,
  Row,
  Screen,
  SectionTitle,
  Txt,
} from '@/components/ui';
import { activitiesForAge, MILESTONES } from '@/data/activities';
import { VACCINE_BY_ID } from '@/data/vaccines';
import { vaccineStatus } from '@/services/health';
import { sharePassport } from '@/services/passport';
import { reportError } from '@/services/crash';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';
import { ageInMonths, ageLabel, formatDate, num, toISODate, uid } from '@/utils';

type Tab = 'overview' | 'growth' | 'vaccines' | 'activities' | 'milestones';

export default function ChildDetail() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { state, t, update } = useStore();
  const c = useTheme();
  const lang = state.settings.language;
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? 'overview');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [busy, setBusy] = useState(false);

  const child = state.children.find((x) => x.id === id);
  if (!child) {
    return (
      <Screen>
        <Txt variant="muted">{t.noChildren}</Txt>
      </Screen>
    );
  }

  const growth = state.growth.filter((g) => g.childId === child.id).sort((a, b) => a.date.localeCompare(b.date));
  const vaccines = state.vaccinations
    .filter((v) => v.childId === child.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const months = ageInMonths(child.dob);
  const activities = activitiesForAge(months);
  const completions = state.completions.filter((x) => x.childId === child.id);
  const latest = growth[growth.length - 1];
  const nextDue = vaccines.find((v) => vaccineStatus(v) !== 'completed');

  const addGrowth = () => {
    const w = num(weight);
    const h = num(height);
    if (w === undefined || h === undefined || w <= 0 || h <= 0) return;
    update((s) => ({
      ...s,
      growth: [
        ...s.growth,
        { id: uid(), childId: child.id, date: toISODate(), weightKg: w, heightCm: h, headCm: num(head) },
      ],
    }));
    setWeight('');
    setHeight('');
    setHead('');
  };

  const setGiven = (entryId: string, given: boolean) =>
    update((s) => ({
      ...s,
      vaccinations: s.vaccinations.map((v) =>
        v.id === entryId ? { ...v, administeredDate: given ? toISODate() : undefined } : v,
      ),
      // Clear any overdue alert once the vaccine is marked as given.
      inbox: given ? s.inbox.map((i) => (i.id === `overdue_${entryId}` ? { ...i, read: true } : i)) : s.inbox,
    }));

  const toggleCompletion = (key: string) =>
    update((s) => {
      const has = s.completions.find((x) => x.childId === child.id && x.activityId === key);
      return {
        ...s,
        completions: has
          ? s.completions.filter((x) => x !== has)
          : [...s.completions, { id: uid(), childId: child.id, activityId: key, date: toISODate(), note: '' }],
      };
    });

  const removeChild = () =>
    Alert.alert(t.deleteChild, t.deleteChildConfirm.replace('{name}', child.name), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          router.back();
          update((s) => ({
            ...s,
            children: s.children.filter((x) => x.id !== child.id),
            growth: s.growth.filter((x) => x.childId !== child.id),
            vaccinations: s.vaccinations.filter((x) => x.childId !== child.id),
            completions: s.completions.filter((x) => x.childId !== child.id),
          }));
        },
      },
    ]);

  const exportPassport = async () => {
    setBusy(true);
    try {
      await sharePassport(child, state, t);
    } catch (e) {
      reportError(e);
      Alert.alert(t.passport, t.passportError);
    } finally {
      setBusy(false);
    }
  };

  const tabs: [Tab, string][] = [
    ['overview', t.overview],
    ['growth', t.growth],
    ['vaccines', t.vaccines],
    ['activities', t.activities],
    ['milestones', t.achievements],
  ];

  // Simple bar chart of weight history (last 8 measurements).
  const bars = growth.slice(-8);
  const maxW = Math.max(1, ...bars.map((g) => g.weightKg));

  return (
    <Screen>
      <Stack.Screen options={{ title: child.name }} />
      <Hero>
        <Txt variant="onHero" style={{ fontSize: 22, fontWeight: '800' }}>
          {child.name}
        </Txt>
        <Txt variant="onHero">
          {ageLabel(child.dob)} · {formatDate(child.dob, lang)}
        </Txt>
      </Hero>

      <ChipRow>
        {tabs.map(([key, label]) => (
          <Chip key={key} label={label} selected={tab === key} onPress={() => setTab(key)} />
        ))}
      </ChipRow>

      {tab === 'overview' ? (
        <>
          <Card>
            <Txt variant="heading">{t.growth}</Txt>
            {latest ? (
              <Txt>
                {t.latest}: {latest.weightKg} kg · {latest.heightCm} cm
                {latest.headCm ? ` · ${latest.headCm} cm` : ''}
              </Txt>
            ) : (
              <Txt variant="muted">{t.noGrowth}</Txt>
            )}
          </Card>
          <Card>
            <Txt variant="heading">{t.nextVaccine}</Txt>
            {nextDue ? (
              <Txt>
                {VACCINE_BY_ID[nextDue.vaccineId]?.name} · {t.dueOn.replace('{date}', formatDate(nextDue.dueDate, lang))}
              </Txt>
            ) : (
              <Txt variant="muted">{t.noVaccine}</Txt>
            )}
          </Card>
          <Button variant="secondary" title={t.passport} onPress={exportPassport} loading={busy} />
          <Button variant="ghost" title={t.deleteChild} onPress={removeChild} />
        </>
      ) : null}

      {tab === 'growth' ? (
        <>
          <Card>
            <Txt variant="heading">{t.addMeasurement}</Txt>
            <Field label={t.weightKg} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
            <Field label={t.heightCm} value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
            <Field
              label={`${t.headCm} (${t.optional})`}
              value={head}
              onChangeText={setHead}
              keyboardType="decimal-pad"
            />
            <Button title={t.add} onPress={addGrowth} />
          </Card>
          {bars.length > 0 ? (
            <Card>
              <Txt variant="label">{t.weightKg}</Txt>
              <View
                accessible
                accessibilityLabel={bars.map((g) => `${formatDate(g.date, lang)}: ${g.weightKg} kg`).join(', ')}
                style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110 }}
              >
                {bars.map((g) => (
                  <View key={g.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <Txt variant="muted" style={{ fontSize: 11 }}>
                      {g.weightKg}
                    </Txt>
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(6, (g.weightKg / maxW) * 80),
                        backgroundColor: c.primary,
                        borderRadius: 6,
                      }}
                    />
                  </View>
                ))}
              </View>
            </Card>
          ) : (
            <Card>
              <Txt variant="muted">{t.noGrowth}</Txt>
            </Card>
          )}
          {[...growth].reverse().map((g) => (
            <Card key={g.id}>
              <Txt variant="label">{formatDate(g.date, lang)}</Txt>
              <Txt>
                {g.weightKg} kg · {g.heightCm} cm{g.headCm ? ` · ${g.headCm} cm` : ''}
              </Txt>
            </Card>
          ))}
        </>
      ) : null}

      {tab === 'vaccines' ? (
        <>
          <Txt variant="muted">{t.vaccineNote}</Txt>
          {vaccines.map((v) => {
            const vaccine = VACCINE_BY_ID[v.vaccineId];
            if (!vaccine) return null;
            const status = vaccineStatus(v);
            const open = expanded === v.id;
            return (
              <Card key={v.id} tone={status === 'overdue' ? 'warn' : undefined}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt variant="heading" style={{ flex: 1 }}>
                    {vaccine.name}
                  </Txt>
                  <Pill
                    label={t[status]}
                    tone={status === 'completed' ? 'ok' : status === 'overdue' ? 'danger' : 'muted'}
                  />
                </Row>
                <Txt variant="muted">
                  {v.administeredDate
                    ? t.givenOn.replace('{date}', formatDate(v.administeredDate, lang))
                    : t.dueOn.replace('{date}', formatDate(v.dueDate, lang))}
                </Txt>
                {open ? (
                  <>
                    <Txt variant="muted">{vaccine.dose}</Txt>
                    <Txt variant="label">{t.whyMatters}</Txt>
                    <Txt>{vaccine.why}</Txt>
                    <Txt variant="label">{t.ifMissed}</Txt>
                    <Txt>{vaccine.ifMissed}</Txt>
                  </>
                ) : null}
                <Row style={{ flexWrap: 'wrap' }}>
                  <Button
                    variant={v.administeredDate ? 'ghost' : 'secondary'}
                    title={v.administeredDate ? t.undoGiven : t.markGiven}
                    onPress={() => setGiven(v.id, !v.administeredDate)}
                  />
                  <Button
                    variant="ghost"
                    title={open ? t.close : t.whyMatters}
                    onPress={() => setExpanded(open ? null : v.id)}
                  />
                </Row>
              </Card>
            );
          })}
        </>
      ) : null}

      {tab === 'activities' ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <SectionTitle>{t.ageActivities}</SectionTitle>
            <Pill label={t.doneCount.replace('{n}', String(completions.filter((x) => !x.activityId.startsWith('ms_')).length))} tone="ok" />
          </Row>
          <Banner tone="warn" body={t.safetyNote} />
          {activities.map((a) => {
            const done = completions.some((x) => x.activityId === a.id);
            return (
              <Card key={a.id}>
                <Txt variant="heading">{a.title}</Txt>
                <Txt>{a.description}</Txt>
                <Txt variant="muted">
                  {t.materials}: {a.materials}
                </Txt>
                <Txt variant="muted">
                  {t.benefit}: {a.benefit}
                </Txt>
                <Button
                  variant={done ? 'primary' : 'secondary'}
                  title={done ? `✓ ${t.markDone}` : t.markDone}
                  onPress={() => toggleCompletion(a.id)}
                />
              </Card>
            );
          })}
        </>
      ) : null}

      {tab === 'milestones' ? (
        <>
          <Txt variant="muted">{t.disclaimer}</Txt>
          {MILESTONES.map((m) => {
            const key = `ms_${m.id}`;
            const done = completions.some((x) => x.activityId === key);
            const upcoming = months < m.typicalMonths - 2;
            return (
              <Card key={m.id} style={{ opacity: upcoming && !done ? 0.6 : 1 }}>
                <Txt variant="heading">{m.title}</Txt>
                <Txt variant="muted">{m.note}</Txt>
                <Button
                  variant={done ? 'primary' : 'secondary'}
                  title={done ? `✓ ${t.achievements}` : t.markDone}
                  onPress={() => toggleCompletion(key)}
                />
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}

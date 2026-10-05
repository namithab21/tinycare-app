import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { MoodCalendar } from '@/components/MoodCalendar';
import {
  Banner,
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  Hero,
  Row,
  Screen,
  SectionTitle,
  Stepper,
  Txt,
} from '@/components/ui';
import { AFFIRMATIONS, careWeekFor, SYMPTOM_OPTIONS, URGENT_SYMPTOMS } from '@/data/careGuide';
import { recoveryMealFor } from '@/data/nutrition';
import { isBpHigh, latestMetric, postpartumDay } from '@/services/health';
import { useStore } from '@/store/AppStore';
import type { Mood, RecoveryMetric } from '@/types';
import { formatDate, num, toISODate, uid } from '@/utils';

const MOODS: Mood[] = ['great', 'good', 'tired', 'overwhelmed'];

export default function MotherScreen() {
  const { state, t, update } = useStore();
  const lang = state.settings.language;
  const mother = state.mother;
  const today = toISODate();
  const existing = state.moods.find((m) => m.date === today);

  const [mood, setMood] = useState<Mood>(existing?.mood ?? 'good');
  const [water, setWater] = useState(existing?.hydrationGlasses ?? 0);
  const [sleep, setSleep] = useState(existing?.sleepHours ?? 6);
  const [exercise, setExercise] = useState(existing?.exerciseDone ?? false);
  const [affirm, setAffirm] = useState(existing?.affirmationDone ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const [weight, setWeight] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [vitalsMsg, setVitalsMsg] = useState('');

  useEffect(() => {
    if (!saved) return;
    const h = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(h);
  }, [saved]);

  if (!mother) {
    return (
      <Screen>
        <Card>
          <Txt variant="heading">{t.motherTitle}</Txt>
          <Txt variant="muted">{t.onboardSub}</Txt>
          <Button title={t.setupMother} onPress={() => router.push('/mother-edit')} />
        </Card>
      </Screen>
    );
  }

  const day = postpartumDay(mother);
  const week = careWeekFor(day);
  const affirmation = AFFIRMATIONS[day % AFFIRMATIONS.length];
  const meal = recoveryMealFor(state.settings.region, mother.diet === 'non-veg', day);
  const last = latestMetric(state.metrics);
  const highBp = isBpHigh(last?.systolic, last?.diastolic);
  const urgentSymptom = (last?.symptoms ?? []).some((s) => URGENT_SYMPTOMS.includes(s));

  const allergyWords = mother.allergies
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
  const mealHasAllergen = (text: string) => allergyWords.some((w) => text.toLowerCase().includes(w));

  const saveLog = () => {
    update((s) => {
      const entry = {
        id: existing?.id ?? uid(),
        date: today,
        mood,
        exerciseDone: exercise,
        affirmationDone: affirm,
        hydrationGlasses: water,
        sleepHours: sleep,
        notes: notes.trim(),
      };
      return { ...s, moods: [...s.moods.filter((m) => m.date !== today), entry] };
    });
    setSaved(true);
  };

  const saveVitals = () => {
    const w = num(weight);
    const s1 = num(sys);
    const d1 = num(dia);
    if (w === undefined && s1 === undefined && d1 === undefined && symptoms.length === 0) return;
    const metric: RecoveryMetric = {
      id: uid(),
      recordedAt: new Date().toISOString(),
      weightKg: w,
      systolic: s1 ? Math.round(s1) : undefined,
      diastolic: d1 ? Math.round(d1) : undefined,
      symptoms,
    };
    update((s) => ({ ...s, metrics: [...s.metrics, metric] }));
    setWeight('');
    setSys('');
    setDia('');
    setSymptoms([]);
    setVitalsMsg(t.logSaved);
  };

  const toggleSymptom = (sym: string) =>
    setSymptoms((cur) => (cur.includes(sym) ? cur.filter((x) => x !== sym) : [...cur, sym]));

  const moodLabel: Record<Mood, string> = {
    great: t.moodGreat,
    good: t.moodGood,
    tired: t.moodTired,
    overwhelmed: t.moodOverwhelmed,
  };

  return (
    <Screen>
      <Hero>
        <Txt variant="onHero" style={{ fontSize: 22, fontWeight: '800' }}>
          {t.postpartumDay.replace('{n}', String(day))}
        </Txt>
        <Txt variant="onHero">{day <= 90 ? t.phase1 : t.phase2}</Txt>
      </Hero>
      <Button variant="secondary" title={t.editProfile} onPress={() => router.push('/mother-edit')} />

      {highBp ? <Banner tone="danger" title={t.bpHighTitle} body={t.bpHighBody} /> : null}
      {urgentSymptom ? <Banner tone="danger" title={t.warnSymptomTitle} body={t.warnSymptomBody} /> : null}

      <SectionTitle>{t.todayLog}</SectionTitle>
      <Card>
        <Txt variant="label">{t.howFeeling}</Txt>
        <ChipRow>
          {MOODS.map((m) => (
            <Chip key={m} label={moodLabel[m]} selected={mood === m} onPress={() => setMood(m)} />
          ))}
        </ChipRow>
        <Stepper label={t.hydration} value={water} onChange={setWater} max={20} />
        <Stepper label={t.sleepHours} value={sleep} onChange={setSleep} max={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt style={{ flex: 1 }}>{t.exerciseDone}</Txt>
          <Chip label={exercise ? t.yes : t.no} selected={exercise} onPress={() => setExercise(!exercise)} />
        </Row>
        <Txt variant="muted">“{affirmation}”</Txt>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt style={{ flex: 1 }}>{t.affirmationDone}</Txt>
          <Chip label={affirm ? t.yes : t.no} selected={affirm} onPress={() => setAffirm(!affirm)} />
        </Row>
        <Field label={t.notes} value={notes} onChangeText={setNotes} multiline />
        <Button title={t.save} onPress={saveLog} />
        {saved ? <Txt variant="muted">{t.logSaved}</Txt> : null}
      </Card>

      <SectionTitle>{t.vitals}</SectionTitle>
      <Card>
        <Field label={t.weightKg} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <Row>
          <Field
            label={t.systolic}
            value={sys}
            onChangeText={setSys}
            keyboardType="number-pad"
            maxLength={3}
            style={{ flex: 1 }}
          />
        </Row>
        <Field label={t.diastolic} value={dia} onChangeText={setDia} keyboardType="number-pad" maxLength={3} />
        <Txt variant="label">{t.symptoms}</Txt>
        <ChipRow>
          {SYMPTOM_OPTIONS.map((sym) => (
            <Chip key={sym} label={sym} selected={symptoms.includes(sym)} onPress={() => toggleSymptom(sym)} />
          ))}
        </ChipRow>
        <Button title={t.saveVitals} onPress={saveVitals} />
        {vitalsMsg ? <Txt variant="muted">{vitalsMsg}</Txt> : null}
        {[...state.metrics]
          .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
          .slice(0, 4)
          .map((m) => (
            <Txt key={m.id} variant="muted">
              {formatDate(m.recordedAt, lang)}
              {m.systolic && m.diastolic ? ` · ${m.systolic}/${m.diastolic}` : ''}
              {m.weightKg ? ` · ${m.weightKg} kg` : ''}
            </Txt>
          ))}
      </Card>

      <Banner tone="warn" title={t.warnSymptomTitle} body={t.warnSymptomBody} />

      <SectionTitle>{t.careGuide}</SectionTitle>
      <Card>
        <Txt variant="heading">{week.title}</Txt>
        <Txt>{week.care}</Txt>
        <Txt variant="label">{t.exercise}</Txt>
        <Txt>{mother.deliveryType === 'c-section' ? week.exerciseCSection : week.exercise}</Txt>
        <Txt variant="label">{t.mentalTip}</Txt>
        <Txt>{week.mind}</Txt>
      </Card>

      <SectionTitle>{t.recoveryDiet}</SectionTitle>
      <Card>
        {(
          [
            [t.breakfast, meal.breakfast],
            [t.lunch, meal.lunch],
            [t.snack, meal.snack],
            [t.dinner, meal.dinner],
          ] as const
        ).map(([label, text]) => (
          <Txt key={label}>
            <Txt variant="label">{label}: </Txt>
            {text}
            {mealHasAllergen(text) ? ' ⚠️' : ''}
          </Txt>
        ))}
        {mother.allergies ? (
          <Txt variant="muted">
            {t.allergies}: {mother.allergies}
          </Txt>
        ) : null}
      </Card>

      <SectionTitle>{t.screening}</SectionTitle>
      <Card>
        <Button variant="secondary" title={t.screening} onPress={() => router.push('/screening')} />
      </Card>

      <SectionTitle>{t.moodCalendar}</SectionTitle>
      <Card>
        <MoodCalendar moods={state.moods} />
      </Card>
    </Screen>
  );
}

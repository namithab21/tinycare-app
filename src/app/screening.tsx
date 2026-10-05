import { router } from 'expo-router';
import React, { useState } from 'react';
import { Banner, Button, Card, Chip, ChipRow, Screen, Txt } from '@/components/ui';
import { screeningNeedsFollowUp } from '@/services/health';
import { useStore } from '@/store/AppStore';
import { toISODate, uid } from '@/utils';

export default function Screening() {
  const { t, update } = useStore();
  const [a1, setA1] = useState<number | null>(null);
  const [a2, setA2] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const options = [t.never, t.several, t.half, t.nearly];

  const question = (text: string, value: number | null, set: (n: number) => void) => (
    <Card>
      <Txt variant="body">{text}</Txt>
      <ChipRow>
        {options.map((label, i) => (
          <Chip key={label} label={label} selected={value === i} onPress={() => set(i)} />
        ))}
      </ChipRow>
    </Card>
  );

  const submit = () => {
    if (a1 === null || a2 === null) return;
    const total = a1 + a2;
    setScore(total);
    update((s) => ({ ...s, screenings: [...s.screenings, { id: uid(), date: toISODate(), score: total }] }));
  };

  return (
    <Screen>
      <Txt variant="muted">{t.screeningIntro}</Txt>
      {question(t.phq1, a1, setA1)}
      {question(t.phq2, a2, setA2)}
      {score === null ? (
        <Button title={t.seeResult} onPress={submit} disabled={a1 === null || a2 === null} />
      ) : screeningNeedsFollowUp(score) ? (
        <Banner tone="warn" body={t.screeningHigh} />
      ) : (
        <Banner tone="ok" body={t.screeningLow} />
      )}
      {score !== null ? <Button variant="secondary" title={t.done} onPress={() => router.back()} /> : null}
    </Screen>
  );
}

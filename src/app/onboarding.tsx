import React, { useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChildForm, MotherForm } from '@/components/forms';
import { Button, Chip, ChipRow, Screen, Txt } from '@/components/ui';
import type { Region } from '@/types';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';

const REGIONS: Region[] = ['NORTH', 'SOUTH', 'WEST', 'EAST', 'CENTRAL', 'COASTAL'];

export default function Onboarding() {
  const { t, state, update } = useStore();
  const c = useTheme();
  const [step, setStep] = useState<'choose' | 'mother' | 'child'>('choose');

  const finish = () => update((s) => ({ ...s, onboardingDone: true }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen>
        <Text style={{ fontSize: 40 }}>🌱</Text>
        <Txt variant="title">{t.onboardTitle}</Txt>
        <Txt variant="muted">{t.onboardSub}</Txt>

        <Txt variant="label">{t.regionLabel}</Txt>
        <ChipRow>
          {REGIONS.map((r) => (
            <Chip
              key={r}
              label={t[`region_${r}` as const]}
              selected={state.settings.region === r}
              onPress={() => update((s) => ({ ...s, settings: { ...s.settings, region: r } }))}
            />
          ))}
        </ChipRow>

        {step === 'choose' ? (
          <>
            <Button title={t.iAmMother} onPress={() => setStep('mother')} />
            <Button variant="secondary" title={t.iHaveBaby} onPress={() => setStep('child')} />
            <Button variant="ghost" title={t.skip} onPress={finish} />
          </>
        ) : null}

        {step === 'mother' ? (
          <>
            <MotherForm onSaved={() => setStep('child')} submitLabel={t.next} />
            <Button variant="ghost" title={t.skip} onPress={finish} />
          </>
        ) : null}

        {step === 'child' ? (
          <>
            <ChildForm onSaved={finish} submitLabel={t.done} />
            <Button variant="ghost" title={t.skip} onPress={finish} />
          </>
        ) : null}
      </Screen>
    </SafeAreaView>
  );
}

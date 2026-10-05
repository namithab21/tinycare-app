import React, { useState } from 'react';
import { Button, Card, Chip, ChipRow, Field, Txt } from '@/components/ui';
import { validateChildDob, validateDeliveryDate } from '@/services/health';
import { buildSchedule, useStore } from '@/store/AppStore';
import type { Child, MotherProfile } from '@/types';
import { num, toISODate, uid } from '@/utils';

export function MotherForm({ onSaved, submitLabel }: { onSaved: () => void; submitLabel?: string }) {
  const { t, state, update } = useStore();
  const initial = state.mother;
  const [deliveryDate, setDeliveryDate] = useState(initial?.deliveryDate ?? '');
  const [deliveryType, setDeliveryType] = useState<MotherProfile['deliveryType']>(initial?.deliveryType ?? 'normal');
  const [diet, setDiet] = useState<MotherProfile['diet']>(initial?.diet ?? 'veg');
  const [allergies, setAllergies] = useState(initial?.allergies ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const check = validateDeliveryDate(deliveryDate.trim());
    if (check === 'format') return setError(t.errDate);
    if (check === 'future') return setError(t.errFutureDate);
    update((s) => ({
      ...s,
      mother: { deliveryDate: deliveryDate.trim(), deliveryType, diet, allergies: allergies.trim() },
    }));
    onSaved();
  };

  return (
    <Card>
      <Field
        label={t.deliveryDate}
        value={deliveryDate}
        onChangeText={(v) => {
          setDeliveryDate(v);
          setError('');
        }}
        placeholder={toISODate()}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={error}
      />
      <Txt variant="label">{t.deliveryType}</Txt>
      <ChipRow>
        <Chip label={t.normal} selected={deliveryType === 'normal'} onPress={() => setDeliveryType('normal')} />
        <Chip label={t.csection} selected={deliveryType === 'c-section'} onPress={() => setDeliveryType('c-section')} />
      </ChipRow>
      <Txt variant="label">{t.dietPref}</Txt>
      <ChipRow>
        <Chip label={t.veg} selected={diet === 'veg'} onPress={() => setDiet('veg')} />
        <Chip label={t.nonveg} selected={diet === 'non-veg'} onPress={() => setDiet('non-veg')} />
      </ChipRow>
      <Field label={`${t.allergies} (${t.optional})`} value={allergies} onChangeText={setAllergies} />
      <Button title={submitLabel ?? t.save} onPress={save} />
    </Card>
  );
}

export function ChildForm({ onSaved, submitLabel }: { onSaved: (child: Child) => void; submitLabel?: string }) {
  const { t, update } = useStore();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Child['gender']>('F');
  const [birthWeight, setBirthWeight] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (!name.trim()) return setError(t.errRequired);
    if (!validateChildDob(dob.trim())) return setError(t.errChildAge);
    const child: Child = {
      id: uid(),
      name: name.trim(),
      dob: dob.trim(),
      gender,
      birthWeightKg: num(birthWeight),
      createdAt: new Date().toISOString(),
    };
    update((s) => ({
      ...s,
      children: [...s.children, child],
      vaccinations: [...s.vaccinations, ...buildSchedule(child)],
    }));
    onSaved(child);
  };

  return (
    <Card>
      <Field
        label={t.childName}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError('');
        }}
      />
      <Field
        label={t.dob}
        value={dob}
        onChangeText={(v) => {
          setDob(v);
          setError('');
        }}
        placeholder={toISODate()}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Txt variant="label">{t.gender}</Txt>
      <ChipRow>
        <Chip label={t.female} selected={gender === 'F'} onPress={() => setGender('F')} />
        <Chip label={t.male} selected={gender === 'M'} onPress={() => setGender('M')} />
        <Chip label={t.other} selected={gender === 'O'} onPress={() => setGender('O')} />
      </ChipRow>
      <Field
        label={`${t.birthWeight} (${t.optional})`}
        value={birthWeight}
        onChangeText={setBirthWeight}
        keyboardType="decimal-pad"
      />
      {error ? <Txt variant="muted" style={{ color: '#C62440' }}>{error}</Txt> : null}
      <Button title={submitLabel ?? t.save} onPress={save} />
    </Card>
  );
}

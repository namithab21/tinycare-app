import React, { useState } from 'react';
import { Banner, Card, Chip, ChipRow, Pill, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { foodsForRegion, recoveryMealFor, sevenDayPlan } from '@/data/nutrition';
import { postpartumDay } from '@/services/health';
import { useStore } from '@/store/AppStore';
import type { Region } from '@/types';
import { ageInMonths, ageLabel } from '@/utils';

const REGIONS: Region[] = ['NORTH', 'SOUTH', 'WEST', 'EAST', 'CENTRAL', 'COASTAL'];

export default function NutritionTab() {
  const { state, t, update } = useStore();
  const region = state.settings.region;
  const nonVeg = state.mother?.diet === 'non-veg';
  const [who, setWho] = useState<'child' | 'mother'>(state.children.length ? 'child' : 'mother');
  const [childId, setChildId] = useState(state.children[0]?.id ?? '');
  const [openDay, setOpenDay] = useState<number | null>(1);

  const child = state.children.find((c) => c.id === childId) ?? state.children[0];
  const months = child ? ageInMonths(child.dob) : 0;
  const plan = child ? sevenDayPlan(region, nonVeg, months) : [];
  const foods = foodsForRegion(region, nonVeg, child ? months : 12);

  const mealLabel = { Morning: t.breakfast, Midday: t.lunch, Evening: t.snack, Night: t.dinner } as const;
  const meal = state.mother ? recoveryMealFor(region, nonVeg, postpartumDay(state.mother)) : null;

  return (
    <Screen>
      <Txt variant="label">{t.regionLabel}</Txt>
      <ChipRow>
        {REGIONS.map((r) => (
          <Chip
            key={r}
            label={t[`region_${r}` as const]}
            selected={region === r}
            onPress={() => update((s) => ({ ...s, settings: { ...s.settings, region: r } }))}
          />
        ))}
      </ChipRow>

      <ChipRow>
        <Chip label={t.forChild} selected={who === 'child'} onPress={() => setWho('child')} />
        <Chip label={t.forMother} selected={who === 'mother'} onPress={() => setWho('mother')} />
      </ChipRow>

      {who === 'child' ? (
        <>
          {state.children.length === 0 ? (
            <Card>
              <Txt variant="muted">{t.noChildNutrition}</Txt>
            </Card>
          ) : (
            <>
              {state.children.length > 1 ? (
                <ChipRow>
                  {state.children.map((c) => (
                    <Chip key={c.id} label={c.name} selected={child?.id === c.id} onPress={() => setChildId(c.id)} />
                  ))}
                </ChipRow>
              ) : null}
              {child ? (
                <Txt variant="muted">
                  {t.nutritionFor} {child.name} · {ageLabel(child.dob)}
                </Txt>
              ) : null}
              {months < 6 ? <Banner tone="ok" body={t.breastfeedOnly} /> : null}
              {plan.length > 0 ? <SectionTitle>{t.sevenDay}</SectionTitle> : null}
              {plan.map((d) => (
                <Card key={d.day}>
                  <Chip
                    label={t.dayN.replace('{n}', String(d.day))}
                    selected={openDay === d.day}
                    onPress={() => setOpenDay(openDay === d.day ? null : d.day)}
                  />
                  {openDay === d.day
                    ? d.meals.map((m) => (
                        <Txt key={m.label}>
                          <Txt variant="label">{mealLabel[m.label]}: </Txt>
                          {m.text}
                        </Txt>
                      ))
                    : null}
                </Card>
              ))}
            </>
          )}
        </>
      ) : (
        <>
          {meal ? (
            <>
              <SectionTitle>{t.recoveryDiet}</SectionTitle>
              <Card>
                <Txt>
                  <Txt variant="label">{t.breakfast}: </Txt>
                  {meal.breakfast}
                </Txt>
                <Txt>
                  <Txt variant="label">{t.lunch}: </Txt>
                  {meal.lunch}
                </Txt>
                <Txt>
                  <Txt variant="label">{t.snack}: </Txt>
                  {meal.snack}
                </Txt>
                <Txt>
                  <Txt variant="label">{t.dinner}: </Txt>
                  {meal.dinner}
                </Txt>
              </Card>
            </>
          ) : (
            <Card>
              <Txt variant="muted">{t.setupMother}</Txt>
            </Card>
          )}
        </>
      )}

      <SectionTitle>{t.foodsNearYou}</SectionTitle>
      {foods.map((f) => (
        <Card key={f.id} style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="heading" style={{ flex: 1 }}>
              {f.name}
            </Txt>
            {f.lowCost ? <Pill label={t.lowCost} tone="ok" /> : null}
          </Row>
          <Row style={{ flexWrap: 'wrap' }}>
            {f.tags.map((tag) => (
              <Pill key={tag} label={tag} tone="muted" />
            ))}
          </Row>
        </Card>
      ))}
      <Txt variant="muted">{t.nutritionNote}</Txt>
    </Screen>
  );
}

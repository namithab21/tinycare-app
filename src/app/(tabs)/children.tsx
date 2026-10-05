import { router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { Button, Card, Pill, Row, Screen, Txt } from '@/components/ui';
import { vaccineStatus } from '@/services/health';
import { useStore } from '@/store/AppStore';
import { ageLabel } from '@/utils';

export default function ChildrenTab() {
  const { state, t } = useStore();
  return (
    <Screen>
      <Button title={t.addChild} onPress={() => router.push('/child/add')} />
      {state.children.length === 0 ? (
        <Card>
          <Txt variant="muted">{t.noChildren}</Txt>
        </Card>
      ) : (
        state.children.map((child) => {
          const mine = state.vaccinations.filter((v) => v.childId === child.id);
          const overdue = mine.filter((v) => vaccineStatus(v) === 'overdue').length;
          const done = mine.filter((v) => vaccineStatus(v) === 'completed').length;
          return (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityLabel={child.name}
              onPress={() => router.push({ pathname: '/child/[id]', params: { id: child.id } })}
            >
              <Card>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt variant="heading">{child.name}</Txt>
                  <Txt variant="muted">{ageLabel(child.dob)}</Txt>
                </Row>
                <Row style={{ flexWrap: 'wrap' }}>
                  <Pill label={`${t.completed}: ${done}/${mine.length}`} tone="ok" />
                  {overdue > 0 ? <Pill label={`${t.overdue}: ${overdue}`} tone="danger" /> : null}
                </Row>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

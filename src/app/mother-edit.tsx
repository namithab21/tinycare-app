import { router } from 'expo-router';
import React from 'react';
import { MotherForm } from '@/components/forms';
import { Screen } from '@/components/ui';

export default function MotherEdit() {
  return (
    <Screen>
      <MotherForm onSaved={() => router.back()} />
    </Screen>
  );
}

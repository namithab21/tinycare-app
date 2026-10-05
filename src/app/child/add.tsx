import { router } from 'expo-router';
import React from 'react';
import { ChildForm } from '@/components/forms';
import { Screen } from '@/components/ui';

export default function AddChild() {
  return (
    <Screen>
      <ChildForm onSaved={(child) => router.replace({ pathname: '/child/[id]', params: { id: child.id } })} />
    </Screen>
  );
}

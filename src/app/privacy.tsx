import React from 'react';
import { LegalView } from '@/components/LegalView';
import doc from '@/legal/privacy.json';

export default function PrivacyScreen() {
  return <LegalView doc={doc} />;
}

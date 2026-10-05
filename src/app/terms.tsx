import React from 'react';
import { LegalView } from '@/components/LegalView';
import doc from '@/legal/terms.json';

export default function TermsScreen() {
  return <LegalView doc={doc} />;
}

import React from 'react';
import { Card, Screen, Txt } from '@/components/ui';

export interface LegalDoc {
  title: string;
  updated: string;
  sections: { h: string; p: string[] }[];
}

export function LegalView({ doc }: { doc: LegalDoc }) {
  return (
    <Screen>
      <Txt variant="title">{doc.title}</Txt>
      <Txt variant="muted">Last updated: {doc.updated}</Txt>
      {doc.sections.map((s) => (
        <Card key={s.h}>
          <Txt variant="heading">{s.h}</Txt>
          {s.p.map((para, i) => (
            <Txt key={i} variant="body">
              {para}
            </Txt>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

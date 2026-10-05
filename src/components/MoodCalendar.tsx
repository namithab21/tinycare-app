import React from 'react';
import { View } from 'react-native';
import { Txt } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Mood, MoodLog } from '@/types';
import { toISODate } from '@/utils';

/** Colour-coded month grid: green = great/good, amber = tired, crimson = overwhelmed. */
export function MoodCalendar({ moods }: { moods: MoodLog[] }) {
  const c = useTheme();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const byDate = new Map(moods.map((m) => [m.date, m.mood]));
  const today = toISODate(now);

  const color = (mood?: Mood): string => {
    switch (mood) {
      case 'great':
      case 'good':
        return c.ok;
      case 'tired':
        return c.warn;
      case 'overwhelmed':
        return c.danger;
      default:
        return c.cardBorder;
    }
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View accessible accessibilityLabel="Mood calendar for this month" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <View key={`h${i}`} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 4 }}>
          <Txt variant="muted">{d}</Txt>
        </View>
      ))}
      {cells.map((day, i) => {
        if (day === null) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 36 }} />;
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const mood = byDate.get(iso);
        const isToday = iso === today;
        return (
          <View key={iso} style={{ width: `${100 / 7}%`, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: mood ? color(mood) : 'transparent',
                borderWidth: isToday ? 2 : mood ? 0 : 1,
                borderColor: isToday ? c.primary : c.cardBorder,
              }}
            >
              <Txt variant="muted" style={{ color: mood ? '#FFFFFF' : c.textMuted, fontWeight: '700' }}>
                {day}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

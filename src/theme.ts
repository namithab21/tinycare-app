import { useColorScheme } from 'react-native';
import { useStore } from '@/store/AppStore';

export interface Palette {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  ok: string;
  okSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  input: string;
  gradient: [string, string];
}

export const light: Palette = {
  bg: '#F3FAF6',
  card: '#FFFFFF',
  cardBorder: '#DDEBE3',
  text: '#16302A',
  textMuted: '#5B746B',
  primary: '#2F9E7A',
  primarySoft: '#DDF3EA',
  onPrimary: '#FFFFFF',
  ok: '#2F9E7A',
  okSoft: '#DDF3EA',
  warn: '#C77700',
  warnSoft: '#FFF0D6',
  danger: '#C62440',
  dangerSoft: '#FDE3E8',
  input: '#F6FBF8',
  gradient: ['#3EB892', '#248264'],
};

export const dark: Palette = {
  bg: '#0E1F19',
  card: '#16302A',
  cardBorder: '#24463C',
  text: '#E8F5EF',
  textMuted: '#9DB9AE',
  primary: '#5ED6B0',
  primarySoft: '#1E4A3E',
  onPrimary: '#0E1F19',
  ok: '#5ED6B0',
  okSoft: '#1E4A3E',
  warn: '#FFB84D',
  warnSoft: '#4A3A17',
  danger: '#FF6B84',
  dangerSoft: '#4D1F29',
  input: '#12261F',
  gradient: ['#2F9E7A', '#1B5E48'],
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export function useTheme(): Palette & { isDark: boolean } {
  const system = useColorScheme();
  const { state } = useStore();
  const pref = state.settings.theme;
  const isDark = pref === 'system' ? system === 'dark' : pref === 'dark';
  return { ...(isDark ? dark : light), isDark };
}

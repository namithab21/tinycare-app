import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '@/theme';

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: c.bg, padding: space.lg }, contentStyle]}>{children}</View>;
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[{ padding: space.lg, paddingBottom: space.xxl * 2, gap: space.md }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FullScreen({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: space.xl, flexGrow: 1, justifyContent: 'center', gap: space.md }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  tone,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'ok' | 'warn' | 'danger';
}) {
  const c = useTheme();
  const bg = tone === 'danger' ? c.dangerSoft : tone === 'warn' ? c.warnSoft : tone === 'ok' ? c.okSoft : c.card;
  const border = tone === 'danger' ? c.danger : tone === 'warn' ? c.warn : tone === 'ok' ? c.ok : c.cardBorder;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderRadius: radius.lg,
          padding: space.lg,
          gap: space.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Hero({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <LinearGradient
      colors={c.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.lg, padding: space.xl, gap: space.xs }}
    >
      {children}
    </LinearGradient>
  );
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm }, style]}>{children}</View>;
}

/* ---------- Text ---------- */

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'label' | 'onHero';

export function Txt({
  children,
  variant = 'body',
  style,
  numberOfLines,
  accessibilityRole,
}: {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityRole?: 'header' | 'text' | 'alert';
}) {
  const c = useTheme();
  const base: Record<Variant, TextStyle> = {
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    heading: { fontSize: 18, fontWeight: '700', color: c.text },
    body: { fontSize: 15, lineHeight: 22, color: c.text },
    muted: { fontSize: 13, lineHeight: 19, color: c.textMuted },
    label: { fontSize: 13, fontWeight: '600', color: c.textMuted },
    onHero: { fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  };
  return (
    <Text
      style={[base[variant], style]}
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole ?? (variant === 'title' || variant === 'heading' ? 'header' : undefined)}
    >
      {children}
    </Text>
  );
}

/* ---------- Controls ---------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const bg =
    variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : variant === 'secondary' ? c.primarySoft : 'transparent';
  const fg =
    variant === 'primary' ? c.onPrimary : variant === 'danger' ? '#FFFFFF' : c.isDark ? c.primary : '#1E6B52';
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        {
          minHeight: 48,
          borderRadius: radius.pill,
          paddingHorizontal: space.xl,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textMuted}
        {...props}
        style={[
          {
            minHeight: 48,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? c.danger : c.cardBorder,
            backgroundColor: c.input,
            color: c.text,
            paddingHorizontal: space.lg,
            fontSize: 16,
          },
          props.multiline ? { minHeight: 88, paddingTop: space.md, textAlignVertical: 'top' } : null,
          props.style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 13 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: space.lg,
        borderRadius: radius.pill,
        justifyContent: 'center',
        backgroundColor: selected ? c.primary : c.card,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.cardBorder,
      }}
    >
      <Text style={{ color: selected ? c.onPrimary : c.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>{children}</View>;
}

export function Pill({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'danger' | 'muted' }) {
  const c = useTheme();
  const map = {
    ok: [c.okSoft, c.ok],
    warn: [c.warnSoft, c.warn],
    danger: [c.dangerSoft, c.danger],
    muted: [c.input, c.textMuted],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const c = useTheme();
  const btn = (sign: '−' | '+', delta: number) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${sign === '+' ? 'increase' : 'decrease'}`}
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 22, color: c.isDark ? c.primary : '#1E6B52', fontWeight: '700' }}>{sign}</Text>
    </Pressable>
  );
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt variant="body" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Row>
        {btn('−', -1)}
        <Text style={{ minWidth: 32, textAlign: 'center', fontSize: 18, fontWeight: '700', color: c.text }}>{value}</Text>
        {btn('+', 1)}
      </Row>
    </Row>
  );
}

export function Banner({
  tone,
  title,
  body,
  onPress,
}: {
  tone: 'danger' | 'warn' | 'ok';
  title?: string;
  body: string;
  onPress?: () => void;
}) {
  const c = useTheme();
  const fg = tone === 'danger' ? c.danger : tone === 'warn' ? c.warn : c.ok;
  const inner = (
    <Card tone={tone} style={{ gap: 4 }}>
      {title ? (
        <Text accessibilityRole="header" style={{ color: fg, fontWeight: '800', fontSize: 15 }}>
          {title}
        </Text>
      ) : null}
      <Text style={{ color: c.text, fontSize: 14, lineHeight: 20 }}>{body}</Text>
    </Card>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {inner}
    </Pressable>
  ) : (
    <View accessibilityRole={tone === 'danger' ? 'alert' : undefined}>{inner}</View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Txt variant="heading" style={{ marginTop: space.md }}>
      {children}
    </Txt>
  );
}

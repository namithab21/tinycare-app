import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';

function BellButton() {
  const { state, t } = useStore();
  const c = useTheme();
  const unread = state.inbox.filter((i) => !i.read).length;
  return (
    <Link href="/notifications" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.notifications}${unread ? `, ${unread}` : ''}`}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
      >
        <Ionicons name="notifications-outline" size={24} color={c.text} />
        {unread > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: c.danger,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  const { t } = useStore();
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <BellButton />,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.cardBorder },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mother"
        options={{
          title: t.tabMother,
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: t.tabChildren,
          tabBarIcon: ({ color, size }) => <Ionicons name="happy-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t.tabNutrition,
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

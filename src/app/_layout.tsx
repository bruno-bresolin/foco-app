/**
 * Layout raiz: provedor global de dados + navegação por abas.
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppProvider } from '@/context/app';
import { C } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <AppTabs />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accentLight,
        tabBarInactiveTintColor: C.textFaint,
        tabBarStyle: {
          backgroundColor: C.tabbar,
          borderTopColor: 'rgba(38, 38, 51, 0.9)',
          borderTopWidth: 1,
          paddingTop: 6,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="foco"
        options={{
          title: 'Foco',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initSentry } from '@services/sentry';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '@theme/colors';
import { OnboardingTour } from '@components/ui';
import { useUserHealthCheck } from '@hooks/useUserHealthCheck';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // 24h en caché
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'comandpos-query-cache',
  throttleTime: 1000,
});

function HealthCheckMount() {
  useUserHealthCheck();
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.dark.bg }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24, // 24h
            buster: 'v1',
          }}
        >
          <StatusBar style="dark" />
          <OnboardingTour />
          <HealthCheckMount />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.dark.bg },
              animation: 'slide_from_right',
              animationDuration: 220,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { initSentry } from '@services/sentry';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '@theme/colors';
import { OnboardingTour, ToastHost } from '@components/ui';
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

/** Enruta al detalle correspondiente cuando el usuario toca una push. */
function NotificationRouter() {
  const router = useRouter();
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data as
        | { type?: string; entryId?: number | string }
        | undefined;
      console.log('🔵 [app/6] notificación tocada. data=', JSON.stringify(data));
      if (!data) return;
      if (data.type === 'box_closure' && data.entryId != null) {
        console.log(`🟢 [app/6] deep-link → abriendo detalle del cierre id=${data.entryId}`);
        router.push({
          pathname: '/(tabs)/reports/boxes/[id]',
          params: { id: String(data.entryId) },
        });
      }
    };

    // App abierta desde una notificación (cold start)
    void Notifications.getLastNotificationResponseAsync().then(handle);
    // Tap mientras la app corre / en background
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [router]);
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
          <NotificationRouter />
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
          <ToastHost />
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

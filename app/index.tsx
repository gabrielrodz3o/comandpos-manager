import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { palette } from '@theme/colors';
import { logger } from '@utils/logger';

export default function Index() {
  const { token, apiBaseUrl, user } = useAuthStore();
  const activeBuId = useBusinessStore((s) => s.activeBusinessUnitId);

  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated() && useBusinessStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;

    let authDone = useAuthStore.persist.hasHydrated();
    let bizDone = useBusinessStore.persist.hasHydrated();

    const check = () => {
      if (authDone && bizDone) setHydrated(true);
    };

    const unsubAuth = useAuthStore.persist.onFinishHydration(() => {
      authDone = true;
      logger.info('[index]', 'auth store hydrated');
      check();
    });
    const unsubBiz = useBusinessStore.persist.onFinishHydration(() => {
      bizDone = true;
      logger.info('[index]', 'business store hydrated');
      check();
    });
    // Fallback de seguridad
    const t = setTimeout(() => {
      logger.warn('[index]', 'hydration timeout, forcing ready');
      setHydrated(true);
    }, 1500);

    check();

    return () => {
      unsubAuth?.();
      unsubBiz?.();
      clearTimeout(t);
    };
  }, [hydrated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator color={palette.dark.primary} size="large" />
        <Text style={{ marginTop: 12, color: palette.dark.textMuted, fontSize: 12 }}>Cargando…</Text>
      </View>
    );
  }

  logger.info('[index]', 'routing', {
    hasUrl: !!apiBaseUrl,
    hasToken: !!token,
    hasBu: !!activeBuId,
    bus: user?.business_units_with_access?.length ?? 0,
  });

  if (!apiBaseUrl) return <Redirect href="/(auth)/server-config" />;
  if (!token) return <Redirect href="/(auth)/login" />;

  // Logueado pero sin empresa seleccionada
  if (!activeBuId) {
    const bus = user?.business_units_with_access ?? [];
    if (bus.length > 1) return <Redirect href="/(auth)/select-business" />;
    if (bus.length === 1 && (bus[0].locations?.length ?? 0) > 1) {
      // auto-set la única BU y mandar a select-location
      useBusinessStore.getState().setActiveBusinessUnit(bus[0]);
      return <Redirect href="/(auth)/select-location" />;
    }
    if (bus.length === 1) {
      useBusinessStore.getState().setActiveBusinessUnit(bus[0]);
      return <Redirect href="/(tabs)/today" />;
    }
    // 0 BUs → vuelve a login con error
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/today" />;
}

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { me } from '@services/auth';
import { userCanAccessManager } from '@/types/business';
import { logger } from '@utils/logger';

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Verifica periódicamente que el usuario sigue activo y con permisos.
 * Si pierde acceso (use_sta_id != 1 o profile downgraded), hace logout automático.
 *
 * Se llama una vez desde el root layout cuando el usuario está autenticado.
 */
export const useUserHealthCheck = () => {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const authLogout = useAuthStore((s) => s.logout);
  const businessReset = useBusinessStore((s) => s.reset);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    if (!token) return;

    const check = async () => {
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_INTERVAL_MS / 2) return;
      lastCheckRef.current = now;

      try {
        const fresh = await me();
        const validation = userCanAccessManager(fresh);
        logger.info('[health-check]', 'user status', {
          use_sta_id: fresh.use_sta_id,
          per_level: fresh.per_level,
          can_access: validation.ok,
        });
        if (!validation.ok) {
          Alert.alert(
            'Acceso revocado',
            validation.reason ?? 'Tu acceso ha sido revocado.',
            [
              {
                text: 'OK',
                onPress: () => {
                  authLogout();
                  businessReset();
                  router.replace('/(auth)/login');
                },
              },
            ],
          );
          return;
        }
        // Actualizar user con info fresca
        setUser(fresh);
      } catch (e) {
        logger.warn('[health-check]', 'failed', (e as Error)?.message);
      }
    };

    // Check al montar
    check();

    // Periódico
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, setUser, authLogout, businessReset, router]);
};

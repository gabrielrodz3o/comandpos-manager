import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@utils/logger';
import { api } from './apiClient';

const NOTIF_PREFS_KEY = 'comandpos-notif-prefs';

export interface NotificationPrefs {
  enabled: boolean;
  cajaCierre: boolean;
  ventasUmbral: boolean;
  inactividad: boolean;
  expoPushToken?: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  cajaCierre: true,
  ventasUmbral: true,
  inactividad: true,
};

// Handler global — controla cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const loadNotifPrefs = async (): Promise<NotificationPrefs> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    logger.error('[notif]', 'load failed', e);
    return DEFAULT_PREFS;
  }
};

export const saveNotifPrefs = async (prefs: NotificationPrefs): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    logger.error('[notif]', 'save failed', e);
  }
};

/** Solicita permisos y registra el push token. Devuelve token o null. */
export const registerForPushNotifications = async (): Promise<string | null> => {
  console.log('🔵 [app/1] registerForPushNotifications() llamado');
  if (!Device.isDevice) {
    console.log('🟠 [app/1] Device.isDevice=false → SIMULADOR. No se puede obtener push token aquí. Usa un iPhone físico.');
    logger.warn('[notif]', 'must use a physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ComandPOS Manager',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.warn('[notif]', 'permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    console.log('🟢 [app/1] Expo push token obtenido:', tokenData.data);
    logger.info('[notif]', 'expo push token:', tokenData.data);
    return tokenData.data;
  } catch (e) {
    console.log('🔴 [app/1] getExpoPushTokenAsync falló:', e);
    logger.error('[notif]', 'getExpoPushTokenAsync failed', e);
    return null;
  }
};

/** Dispara una notificación local de prueba — para validar setup. */
export const sendTestNotification = async (): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Notificación de prueba',
      body: 'ComandPOS Manager está configurado correctamente.',
      data: { type: 'test' },
    },
    trigger: null, // inmediata
  });
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/** Envía el token + preferencias al backend para recibir push (cierre de caja, etc.). */
export const syncPushToken = async (token: string, prefs: NotificationPrefs): Promise<void> => {
  console.log('🔵 [app/2] syncPushToken() → enviando token al backend:', token.slice(0, 25) + '...');
  try {
    await api.post('/api/users/push-token', {
      token,
      platform: Platform.OS,
      enabled: prefs.enabled,
      prefs: {
        cajaCierre: prefs.cajaCierre,
        ventasUmbral: prefs.ventasUmbral,
        inactividad: prefs.inactividad,
      },
    });
    console.log('🟢 [app/2] token enviado al backend OK');
  } catch (e) {
    console.log('🔴 [app/2] syncPushToken falló (¿el backend es alcanzable desde el device? ¿URL/env correcta?):', e);
    logger.error('[notif]', 'syncPushToken failed', e);
  }
};

/** Desregistra el token en el backend (logout o desactivar notificaciones). */
export const disablePushToken = async (token?: string): Promise<void> => {
  try {
    await api.delete('/api/users/push-token', { data: token ? { token } : {} });
  } catch (e) {
    logger.error('[notif]', 'disablePushToken failed', e);
  }
};

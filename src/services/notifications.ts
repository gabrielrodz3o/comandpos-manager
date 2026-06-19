import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@utils/logger';
import { api } from './apiClient';

const NOTIF_PREFS_KEY = 'comandpos-notif-prefs';

/**
 * Expo Go (SDK 53+) eliminó las push notifications. Importar `expo-notifications`
 * ahí imprime un error nativo y sus APIs remotas lanzan. Por eso cargamos el
 * módulo de forma DINÁMICA y solo fuera de Expo Go — así no se importa nunca en
 * Expo Go y no aparece el error. En development/production build funciona normal.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let _notifModule: typeof import('expo-notifications') | null = null;
const getNotifications = async (): Promise<typeof import('expo-notifications') | null> => {
  if (isExpoGo) return null;
  if (!_notifModule) {
    _notifModule = await import('expo-notifications');
  }
  return _notifModule;
};

// Handler global — cómo se muestran las notificaciones con la app abierta.
// Se configura una vez, fire-and-forget, solo si el módulo está disponible.
void (async () => {
  const Notifications = await getNotifications();
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
})();

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
  const Notifications = await getNotifications();
  if (!Notifications) {
    logger.warn('[notif]', 'push no disponible en Expo Go — usa un development build');
    return null;
  }

  if (!Device.isDevice) {
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
    logger.info('[notif]', 'expo push token:', tokenData.data);
    return tokenData.data;
  } catch (e) {
    logger.error('[notif]', 'getExpoPushTokenAsync failed', e);
    return null;
  }
};

/** Dispara una notificación local de prueba — para validar setup. */
export const sendTestNotification = async (): Promise<void> => {
  const Notifications = await getNotifications();
  if (!Notifications) {
    logger.warn('[notif]', 'notificaciones no disponibles en Expo Go');
    return;
  }
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
  const Notifications = await getNotifications();
  await Notifications?.cancelAllScheduledNotificationsAsync();
};

/** Envía el token + preferencias al backend para recibir push (cierre de caja, etc.). */
export const syncPushToken = async (token: string, prefs: NotificationPrefs): Promise<void> => {
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
  } catch (e) {
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

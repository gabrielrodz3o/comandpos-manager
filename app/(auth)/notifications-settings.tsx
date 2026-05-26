import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '@components/ui';
import { palette } from '@theme/colors';
import {
  loadNotifPrefs,
  saveNotifPrefs,
  registerForPushNotifications,
  sendTestNotification,
  type NotificationPrefs,
} from '@services/notifications';

interface RowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

const Row: React.FC<RowProps> = ({ label, description, value, onChange, disabled }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: palette.dark.border,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    <View style={{ flex: 1, marginRight: 12 }}>
      <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
        {label}
      </Text>
      <Text style={{ color: palette.dark.textDim, fontSize: 11, marginTop: 2 }}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: palette.dark.border, true: palette.dark.primary }}
      thumbColor="#FFFFFF"
    />
  </View>
);

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [savingMain, setSavingMain] = useState(false);

  useEffect(() => {
    void loadNotifPrefs().then(setPrefs);
  }, []);

  const persist = async (next: NotificationPrefs) => {
    setPrefs(next);
    await saveNotifPrefs(next);
  };

  const onToggleMain = async (v: boolean) => {
    if (!prefs) return;
    setSavingMain(true);
    if (v) {
      const token = await registerForPushNotifications();
      if (!token) {
        Alert.alert(
          'Permisos requeridos',
          'Para recibir notificaciones, habilita los permisos en Ajustes del sistema.',
        );
        setSavingMain(false);
        return;
      }
      await persist({ ...prefs, enabled: true, expoPushToken: token });
    } else {
      await persist({ ...prefs, enabled: false });
    }
    setSavingMain(false);
  };

  const onTest = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Enviada', 'Revisa la barra de notificaciones.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la notificación de prueba.');
    }
  };

  if (!prefs) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }}>
        <View style={{ padding: 24 }}>
          <Text style={{ color: palette.dark.textDim }}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: palette.dark.soft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '600' }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 }}>
            Notificaciones
          </Text>
          <Text style={{ color: palette.dark.textDim, fontSize: 12 }}>
            Alertas en tiempo real de tu negocio
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
        <Card variant="default" padded={false}>
          <View style={{ paddingHorizontal: 18 }}>
            <Row
              label="Activar notificaciones"
              description="Recibe alertas en tu dispositivo aunque la app esté cerrada"
              value={prefs.enabled}
              onChange={onToggleMain}
              disabled={savingMain}
            />
          </View>
        </Card>

        {prefs.enabled ? (
          <>
            <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 8 }}>
              TIPOS DE ALERTA
            </Text>
            <Card variant="default" padded={false}>
              <View style={{ paddingHorizontal: 18 }}>
                <Row
                  label="Cierre de caja"
                  description="Cuando una caja se cierre con diferencia significativa"
                  value={prefs.cajaCierre}
                  onChange={(v) => persist({ ...prefs, cajaCierre: v })}
                />
                <Row
                  label="Umbrales de ventas"
                  description="Cuando las ventas del día superen tu meta o caigan por debajo"
                  value={prefs.ventasUmbral}
                  onChange={(v) => persist({ ...prefs, ventasUmbral: v })}
                />
                <Row
                  label="Inactividad"
                  description="Si una sucursal no tiene actividad por más de 2 horas en horario operativo"
                  value={prefs.inactividad}
                  onChange={(v) => persist({ ...prefs, inactividad: v })}
                />
              </View>
            </Card>

            <Card variant="default">
              <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>
                EXPO PUSH TOKEN
              </Text>
              <Text style={{ color: palette.dark.text, fontSize: 11, fontFamily: 'monospace' }} numberOfLines={2}>
                {prefs.expoPushToken ?? '—'}
              </Text>
              <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 8, lineHeight: 14 }}>
                Tu backend usará este token para enviar push notifications a este dispositivo.
              </Text>
            </Card>

            <Button onPress={onTest} variant="secondary" fullWidth>
              Enviar notificación de prueba
            </Button>
          </>
        ) : (
          <Card variant="default">
            <Text style={{ color: palette.dark.textDim, fontSize: 13, lineHeight: 20 }}>
              Activa las notificaciones para recibir alertas importantes de tu negocio: cierres de caja
              con diferencias, ventas anómalas, e inactividad operativa.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

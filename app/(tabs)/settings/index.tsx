import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { Card } from '@components/ui';
import { palette, shadow } from '@theme/colors';
import { buName } from '@utils/format';

interface RowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
  emoji?: string;
}

const Row: React.FC<RowProps> = ({ label, value, onPress, isLast, destructive, emoji }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed && onPress ? 0.6 : 1 })}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: palette.dark.border,
        gap: 10,
      }}
    >
      {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}
      <Text
        style={{
          color: destructive ? palette.dark.danger : palette.dark.textDim,
          fontSize: 13,
          fontWeight: destructive ? '700' : '500',
          flex: 1,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '50%' }}>
        {value ? (
          <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Text style={{ color: destructive ? palette.dark.danger : palette.dark.textMuted, fontSize: 18 }}>›</Text>
        ) : null}
      </View>
    </View>
  </Pressable>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text
    style={{
      color: palette.dark.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      marginTop: 8,
      marginBottom: 6,
    }}
  >
    {children}
  </Text>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, apiBaseUrl, logout } = useAuthStore();
  const businessReset = useBusinessStore((s) => s.reset);
  const bu = useBusinessStore((s) => s.activeBusinessUnit);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          logout();
          businessReset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 14 }}>
        <Text style={{ color: palette.dark.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 4 }}>
          Ajustes
        </Text>

        {/* Cerrar sesión */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.85 : 1,
            ...shadow.sm,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>🚪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.dark.danger, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}>
              Cerrar sesión
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 2 }}>
              Salir de tu cuenta actual
            </Text>
          </View>
          <Text style={{ color: palette.dark.danger, fontSize: 22 }}>›</Text>
        </Pressable>

        {/* Gestión */}
        <SectionTitle>GESTIÓN</SectionTitle>
        <Card variant="default" padded={false}>
          <View style={{ paddingHorizontal: 18 }}>
            <Row
              emoji="🧑‍🍳"
              label="Meseros"
              onPress={() => router.push('/(tabs)/settings/waiters')}
            />
            <Row
              emoji="🪑"
              label="Mesas y áreas"
              onPress={() => router.push('/(tabs)/settings/tables')}
            />
            <Row
              emoji="🧾"
              label="Facturas"
              onPress={() => router.push('/(tabs)/settings/invoices')}
              isLast
            />
          </View>
        </Card>

        {/* Cuenta */}
        <SectionTitle>CUENTA</SectionTitle>
        <Card variant="default" padded={false}>
          <View style={{ paddingHorizontal: 18 }}>
            <Row label="Usuario" value={user?.use_fullname ?? user?.use_username ?? user?.username ?? '—'} />
            <Row label="Empresa" value={buName(bu)} />
            <Row label="Cambiar empresa" onPress={() => router.push('/(auth)/select-business')} />
            <Row
              label="Cambiar sucursal"
              onPress={() => router.push('/(auth)/select-location')}
              isLast
            />
          </View>
        </Card>

        {/* App */}
        <SectionTitle>APLICACIÓN</SectionTitle>
        <Card variant="default" padded={false}>
          <View style={{ paddingHorizontal: 18 }}>
            <Row
              label="Notificaciones"
              onPress={() => router.push('/(auth)/notifications-settings')}
            />
            <Row
              label="Servidor"
              value={apiBaseUrl?.replace(/^https?:\/\//, '') ?? '—'}
              onPress={() => router.push('/(auth)/server-config')}
            />
            <Row label="Acerca de" onPress={() => router.push('/(auth)/about')} isLast />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

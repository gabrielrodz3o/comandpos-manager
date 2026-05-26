import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AxiosError } from 'axios';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { login } from '@services/auth';
import { normalizeError } from '@services/apiClient';
import { userCanAccessManager, filterActiveLocations } from '@/types/business';
import { palette } from '@theme/colors';
import { logger } from '@utils/logger';

export default function LoginScreen() {
  const router = useRouter();
  const apiBaseUrl = useAuthStore((s) => s.apiBaseUrl);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setActiveBusinessUnit = useBusinessStore((s) => s.setActiveBusinessUnit);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Email y contraseña son requeridos');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const { user, token } = await login({
        username: username.trim(),
        password,
        rememberMe: true,
      });

      // Validar acceso: status + profile
      const validation = userCanAccessManager(user);
      logger.info('[login]', 'access validation', {
        use_sta_id: user.use_sta_id,
        per_description: user.per_description,
        per_level: user.per_level,
        type_access: user.type_access?.map((t) => t.access?.access_profile_description),
        ok: validation.ok,
      });
      if (!validation.ok) {
        setError(validation.reason ?? 'Acceso denegado.');
        return;
      }

      setAuth(token, user);
      const bus = user.business_units_with_access ?? [];
      logger.info('[login]', `Got ${bus.length} BU(s)`);
      if (bus.length === 0) {
        setError('Tu usuario no tiene unidades de negocio asignadas.');
        return;
      }
      if (bus.length === 1) {
        const bu = bus[0];
        const activeLocs = filterActiveLocations(bu.locations ?? []);
        setActiveBusinessUnit(bu);
        if (activeLocs.length === 0) {
          setError('Tu unidad de negocio no tiene sucursales activas.');
          return;
        }
        if (activeLocs.length > 1) {
          router.replace('/(auth)/select-location');
        } else {
          router.replace('/(tabs)/today');
        }
      } else {
        router.replace('/(auth)/select-business');
      }
    } catch (e) {
      const err = e as AxiosError;
      const n = (err as AxiosError & { normalized?: { message: string } }).normalized ?? normalizeError(err);
      setError(n.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* DEBUG marker */}
        <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>
          PANTALLA LOGIN
        </Text>

        {/* Brand */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              backgroundColor: '#0A0A0B',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 26 }}>📊</Text>
          </View>
          <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '700' }}>
            Bienvenido
          </Text>
          <Text style={{ color: palette.dark.textDim, fontSize: 13, marginTop: 4 }}>
            Ingresa para ver tus reportes
          </Text>
        </View>

        {/* Email */}
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
          Email o usuario
        </Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="admin@empresa.com"
          placeholderTextColor={palette.dark.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={{
            height: 52,
            borderWidth: 1,
            borderColor: palette.dark.border,
            borderRadius: 14,
            paddingHorizontal: 16,
            fontSize: 15,
            color: palette.dark.text,
            backgroundColor: '#FFFFFF',
            marginBottom: 16,
          }}
        />

        {/* Password */}
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
          Contraseña
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={palette.dark.textMuted}
          secureTextEntry
          autoCapitalize="none"
          style={{
            height: 52,
            borderWidth: 1,
            borderColor: error ? palette.dark.danger : palette.dark.border,
            borderRadius: 14,
            paddingHorizontal: 16,
            fontSize: 15,
            color: palette.dark.text,
            backgroundColor: '#FFFFFF',
            marginBottom: 8,
          }}
        />

        {/* Error */}
        {error ? (
          <Text style={{ color: palette.dark.danger, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
            {error}
          </Text>
        ) : null}

        {/* BOTÓN INICIAR SESIÓN — verde grande, imposible de no ver */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: '#10B981',
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
            opacity: loading ? 0.6 : pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
            {loading ? 'Iniciando…' : 'Iniciar sesión'}
          </Text>
        </Pressable>

        {/* Link servidor */}
        <Pressable
          onPress={() => router.replace('/(auth)/server-config')}
          style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}
        >
          <Text style={{ color: palette.dark.textMuted, fontSize: 12, fontWeight: '500' }}>
            Servidor:{' '}
            <Text style={{ color: '#10B981', fontWeight: '600' }}>
              {apiBaseUrl?.replace(/^https?:\/\//, '') ?? 'No configurado'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

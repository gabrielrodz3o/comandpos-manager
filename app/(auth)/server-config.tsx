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
import { useAuthStore } from '@store/useAuthStore';
import { ApiClient } from '@services/apiClient';
import { palette } from '@theme/colors';

const normalizeUrl = (raw: string): string => {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
};

export default function ServerConfigScreen() {
  const router = useRouter();
  const setApiBaseUrl = useAuthStore((s) => s.setApiBaseUrl);
  const currentUrl = useAuthStore((s) => s.apiBaseUrl);
  const [url, setUrl] = useState(currentUrl ?? 'https://restaurante.comandpos.com');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setError('');
    if (!url.trim()) {
      setError('Ingresa la URL del servidor');
      return;
    }
    const normalized = normalizeUrl(url);
    try {
      new URL(normalized);
    } catch {
      setError('La URL no es válida');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setApiBaseUrl(normalized);
    ApiClient.reset();
    setTimeout(() => {
      setLoading(false);
      router.replace('/(auth)/login');
    }, 300);
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
          PANTALLA CONFIGURAR SERVIDOR
        </Text>

        {/* Brand */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: '#0A0A0B',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 28 }}>📊</Text>
          </View>
          <Text style={{ color: palette.dark.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.7 }}>
            ComandPOS
          </Text>
          <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700', letterSpacing: 3, marginTop: 3 }}>
            MANAGER
          </Text>
        </View>

        {/* Title */}
        <Text style={{ color: palette.dark.text, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
          Configura tu servidor
        </Text>
        <Text style={{ color: palette.dark.textDim, fontSize: 13, marginBottom: 20, lineHeight: 19 }}>
          Conecta la app con el backend de tu empresa.
        </Text>

        {/* Input label */}
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
          URL del servidor
        </Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://tu-empresa.com"
          placeholderTextColor={palette.dark.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
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

        {/* Hint */}
        <Text style={{ color: palette.dark.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
          Ejemplo: <Text style={{ color: '#10B981', fontWeight: '600' }}>https://restaurante.comandpos.com</Text>
        </Text>

        {/* BOTÓN CONTINUAR — verde grande imposible de no ver */}
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: '#10B981',
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            opacity: loading ? 0.6 : pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
            {loading ? 'Conectando…' : 'Continuar'}
          </Text>
        </Pressable>

        {/* Footer */}
        <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 24 }}>
          ComandPOS Manager · v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

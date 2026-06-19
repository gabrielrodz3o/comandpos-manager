import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '@theme/colors';
import { useSecurityStore } from '@store/useSecurityStore';

const LockIcon: React.FC<{ size?: number; color?: string }> = ({ size = 34, color = palette.dark.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="10.5" width="16" height="10" rx="2.5" stroke={color} strokeWidth={1.8} />
    <Path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const AppLockGate: React.FC = () => {
  const enabled = useSecurityStore((s) => s.appLockEnabled);
  const hydrated = useSecurityStore((s) => s.hydrated);
  const [locked, setLocked] = useState(false);
  const [authing, setAuthing] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const authenticate = useCallback(async () => {
    if (authing) return;
    setAuthing(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea ComandPOS Manager',
        cancelLabel: 'Cancelar',
        // Permite caer al PIN/passcode del dispositivo si la biometría falla.
        disableDeviceFallback: false,
      });
      if (result.success) setLocked(false);
    } finally {
      setAuthing(false);
    }
  }, [authing]);

  // Bloqueo en cold start una vez hidratado el preferencia.
  useEffect(() => {
    if (hydrated && enabled) setLocked(true);
  }, [hydrated, enabled]);

  // Re-bloqueo al volver de background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      if (enabled && prev.match(/inactive|background/) && next === 'active') {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  // Lanza el prompt automáticamente cuando se bloquea.
  useEffect(() => {
    if (locked) void authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  if (!locked) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: palette.dark.bg,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        gap: 22,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 26,
          backgroundColor: palette.dark.primaryDim,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LockIcon size={38} />
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.dark.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 }}>
          App bloqueada
        </Text>
        <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
          Verifica tu identidad para continuar.
        </Text>
      </View>
      <Pressable
        onPress={authenticate}
        disabled={authing}
        style={({ pressed }) => ({
          backgroundColor: palette.dark.primary,
          paddingVertical: 14,
          paddingHorizontal: 36,
          borderRadius: 16,
          opacity: pressed || authing ? 0.8 : 1,
        })}
      >
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
          {authing ? 'Verificando…' : 'Desbloquear'}
        </Text>
      </Pressable>
    </View>
  );
};

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Keyboard,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { AxiosError } from 'axios';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { login } from '@services/auth';
import { normalizeError } from '@services/apiClient';
import { userCanAccessManager, filterActiveLocations } from '@/types/business';
import { palette, shadow } from '@theme/colors';
import { logger } from '@utils/logger';

const BRAND_DEEP = '#075E47';
const BRAND_MID = '#0E8A63';
const BRAND = '#10B981';

type IconProps = { color: string; size?: number };

const IconUser = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconLock = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2 0V7a5 5 0 0 1 10 0v4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconEye = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const IconEyeOff = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a9.3 9.3 0 0 0 2.6-.4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconArrowRight = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12h14M13 6l6 6-6 6"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Motivo decorativo: barras ascendentes (identidad financiera de la marca). */
const HeroBars = () => (
  <Svg width={200} height={92} viewBox="0 0 200 92" fill="none">
    {[
      { x: 0, h: 30 },
      { x: 34, h: 46 },
      { x: 68, h: 38 },
      { x: 102, h: 62 },
      { x: 136, h: 54 },
      { x: 170, h: 80 },
    ].map((b, i) => (
      <Rect
        key={i}
        x={b.x}
        y={92 - b.h}
        width={22}
        height={b.h}
        rx={6}
        fill="rgba(255,255,255,0.09)"
      />
    ))}
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setActiveBusinessUnit = useBusinessStore((s) => s.setActiveBusinessUnit);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<null | 'user' | 'pass'>(null);

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

  const c = palette.dark;
  const userBorder = focused === 'user' ? BRAND : c.border;
  const passBorder = error ? c.danger : focused === 'pass' ? BRAND : c.border;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ───────── HERO ───────── */}
        <LinearGradient
          colors={[BRAND_DEEP, BRAND_MID, BRAND]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            overflow: 'hidden',
          }}
        >
          {/* anillos decorativos */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -90,
              right: -70,
              width: 240,
              height: 240,
              borderRadius: 120,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.14)',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -40,
              right: -20,
              width: 150,
              height: 150,
              borderRadius: 75,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.10)',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: -60,
              left: -50,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />

          {/* Motivo de barras financieras, anclado abajo */}
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 16 }}>
            <HeroBars />
          </View>

          <SafeAreaView edges={['top']}>
            <View style={{ alignItems: 'center', paddingTop: 30, paddingBottom: 46, paddingHorizontal: 24 }}>
              {/* Icono real de la app, con anillo de acento */}
              <Animated.View
                entering={FadeInDown.delay(80).duration(600).springify().damping(14)}
                style={{
                  padding: 7,
                  borderRadius: 30,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.28)',
                }}
              >
                <View
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 24,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...shadow.hero,
                    shadowColor: '#02160F',
                    shadowOpacity: 0.4,
                  }}
                >
                  <Image
                    source={require('../../assets/icon.png')}
                    style={{ width: 78, height: 78, borderRadius: 19 }}
                    resizeMode="cover"
                  />
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(180).duration(500)}
                style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 27, fontWeight: '800', letterSpacing: -0.7 }}>
                  Comand
                </Text>
                <Text style={{ color: '#A7F3D0', fontSize: 27, fontWeight: '800', letterSpacing: -0.7 }}>
                  POS
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeIn.delay(280).duration(500)}
                style={{
                  marginTop: 8,
                  paddingHorizontal: 13,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                }}
              >
                <Text style={{ color: '#EAFDF5', fontSize: 11, fontWeight: '800', letterSpacing: 3 }}>
                  MANAGER
                </Text>
              </Animated.View>

              {/* Propuesta de valor */}
              <Animated.View
                entering={FadeIn.delay(360).duration(500)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}
              >
                {['Ventas', 'Reportes', 'Metas'].map((t, i) => (
                  <React.Fragment key={t}>
                    {i > 0 ? (
                      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(234,253,245,0.5)' }} />
                    ) : null}
                    <Text style={{ color: 'rgba(234,253,245,0.85)', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 }}>
                      {t}
                    </Text>
                  </React.Fragment>
                ))}
              </Animated.View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ───────── FORM ───────── */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(600).springify().damping(16)}
          style={{ paddingHorizontal: 24, marginTop: 28 }}
        >
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
            Bienvenido de nuevo
          </Text>
          <Text style={{ color: c.textDim, fontSize: 14, marginTop: 4, marginBottom: 26 }}>
            Ingresa para ver tus reportes y ventas
          </Text>

          {/* Usuario */}
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
            Email o usuario
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 54,
              borderWidth: 1.5,
              borderColor: userBorder,
              borderRadius: 15,
              paddingHorizontal: 14,
              backgroundColor: focused === 'user' ? c.primaryDim : '#FFFFFF',
              marginBottom: 18,
            }}
          >
            <IconUser color={focused === 'user' ? BRAND : c.textMuted} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocused('user')}
              onBlur={() => setFocused(null)}
              placeholder="admin@empresa.com"
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500', color: c.text }}
            />
          </View>

          {/* Contraseña */}
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
            Contraseña
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 54,
              borderWidth: 1.5,
              borderColor: passBorder,
              borderRadius: 15,
              paddingHorizontal: 14,
              backgroundColor: focused === 'pass' ? c.primaryDim : '#FFFFFF',
              marginBottom: 10,
            }}
          >
            <IconLock color={focused === 'pass' ? BRAND : c.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('pass')}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500', color: c.text }}
            />
            <Pressable
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}
            >
              {showPassword ? (
                <IconEyeOff color={c.textMuted} />
              ) : (
                <IconEye color={c.textMuted} />
              )}
            </Pressable>
          </View>

          {/* Error */}
          {error ? (
            <Animated.Text
              entering={FadeIn.duration(200)}
              style={{ color: c.danger, fontSize: 13, fontWeight: '600', marginBottom: 6 }}
            >
              {error}
            </Animated.Text>
          ) : null}

          {/* Botón */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 16,
              marginTop: 18,
              overflow: 'hidden',
              opacity: loading ? 0.7 : pressed ? 0.92 : 1,
              ...shadow.hero,
            })}
          >
            <LinearGradient
              colors={[BRAND, BRAND_MID]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>
                {loading ? 'Iniciando…' : 'Iniciar sesión'}
              </Text>
              {loading ? null : <IconArrowRight color="#FFFFFF" size={19} />}
            </LinearGradient>
          </Pressable>

          {/* Footer */}
          <Text
            style={{
              color: c.textMuted,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 24,
              lineHeight: 18,
            }}
          >
            Acceso exclusivo para usuarios autorizados{'\n'}del sistema de punto de venta ComandPOS
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

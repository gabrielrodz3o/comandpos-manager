import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useBusinessStore } from '@store/useBusinessStore';
import { Card } from '@components/ui';
import { palette } from '@theme/colors';
import { buName, locName } from '@utils/format';
import { logger } from '@utils/logger';

const BRAND_DEEP = '#075E47';
const BRAND_MID = '#0E8A63';
const BRAND = '#10B981';

type IconProps = { color: string; size?: number };

const IconLayers = ({ color, size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3 2 8l10 5 10-5-10-5ZM2 16l10 5 10-5M2 12l10 5 10-5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconStore = ({ color, size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 9h16M4 9 5 4h14l1 5M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0M9 20v-5h6v5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SelectLocationScreen() {
  const router = useRouter();
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const setSelected = useBusinessStore((s) => s.setSelectedLocation);

  const locations = useMemo(
    () => (activeBu?.locations ?? []).filter((l) => l.status_id == null || l.status_id === 1),
    [activeBu],
  );

  const handlePick = (locationId: number | null) => {
    logger.info('[select-location]', locationId ? `Picked location ${locationId}` : 'Picked consolidated');
    setSelected(locationId);
    router.replace('/(tabs)/today');
  };

  const Chevron = () => (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: palette.dark.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: BRAND_MID, fontSize: 15, fontWeight: '800' }}>›</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.dark.bg }}>
      <LinearGradient
        colors={[BRAND_DEEP, BRAND_MID, BRAND]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -70,
            right: -50,
            width: 190,
            height: 190,
            borderRadius: 95,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        />
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 }}>
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>
              {buName(activeBu).toUpperCase()}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginTop: 8 }}>
              Selecciona sucursal
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 4 }}>
              Elige una sucursal o consolida los datos de todas.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40, gap: 10 }}>
        {/* Consolidado */}
        <Animated.View entering={FadeInDown.delay(80).duration(420)}>
          <Pressable onPress={() => handlePick(null)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Card variant="default">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 15,
                    backgroundColor: palette.dark.primaryDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconLayers color={BRAND_MID} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}>
                    Consolidado
                  </Text>
                  <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 3 }}>
                    Todas las sucursales · {locations.length}
                  </Text>
                </View>
                <Chevron />
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.dark.border }} />
          <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
            O ELEGIR UNA
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.dark.border }} />
        </View>

        {locations.map((loc, i) => (
          <Animated.View key={loc.id} entering={FadeInDown.delay(160 + i * 60).duration(420)}>
            <Pressable onPress={() => handlePick(loc.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <Card variant="default">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 15,
                      backgroundColor: palette.dark.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconStore color={palette.dark.textDim} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}
                      numberOfLines={1}
                    >
                      {locName(loc)}
                    </Text>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 3 }}>
                      {loc.code ?? '—'}
                      {loc.address ? ` · ${loc.address.split('\n')[0]}` : ''}
                    </Text>
                  </View>
                  <Chevron />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

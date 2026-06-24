import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { palette, shadow } from '@theme/colors';
import { Card } from '@components/ui';
import { buName, pbImageUrl } from '@utils/format';
import { logger } from '@utils/logger';
import type { BusinessUnitAccess } from '@/types/business';
import { filterActiveLocations } from '@/types/business';

const BRAND_DEEP = '#075E47';
const BRAND_MID = '#0E8A63';
const BRAND = '#10B981';

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '•';

export default function SelectBusinessScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveBusinessUnit = useBusinessStore((s) => s.setActiveBusinessUnit);

  const businessUnits = user?.business_units_with_access ?? [];

  const [query, setQuery] = useState('');

  // Normaliza texto: minúsculas y sin acentos para que "panaderia" matchee "Panadería".
  const norm = (s: unknown): string =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

  // Índice de búsqueda por empresa: junta todos los campos buscables en un solo string.
  const searchIndex = useMemo(
    () =>
      businessUnits.map((bu) => {
        const parts: unknown[] = [
          buName(bu),
          bu.business_unit_name,
          bu.business_unit_description,
          bu.business_unit_description_short,
          bu.business_unit_description_long,
          bu.rnc,
          bu.business_unit_address,
        ];
        for (const loc of bu.locations ?? []) {
          parts.push(loc.name, loc.description_short, loc.description_long, loc.code, loc.address, loc.rnl);
        }
        return { bu, haystack: norm(parts.filter(Boolean).join(' ')) };
      }),
    [businessUnits],
  );

  const filteredUnits = useMemo(() => {
    const q = norm(query).trim();
    if (!q) return businessUnits;
    // Cada palabra del query debe aparecer en algún campo (AND entre términos).
    const terms = q.split(/\s+/);
    return searchIndex
      .filter(({ haystack }) => terms.every((t) => haystack.includes(t)))
      .map(({ bu }) => bu);
  }, [businessUnits, searchIndex, query]);

  const handleSelect = (bu: BusinessUnitAccess) => {
    const activeLocs = filterActiveLocations(bu.locations ?? []);
    logger.info(
      '[select-business]',
      `Picked BU ${bu.business_unit_id} (${buName(bu)}) with ${activeLocs.length} active location(s)`,
    );
    setActiveBusinessUnit(bu);
    if (activeLocs.length === 0) {
      alert('Esta empresa no tiene sucursales activas.');
      return;
    }
    if (activeLocs.length > 1) {
      router.replace('/(auth)/select-location');
    } else {
      router.replace('/(tabs)/today');
    }
  };

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
              PASO 1 DE 2
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginTop: 8 }}>
              Selecciona empresa
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 4 }}>
              {businessUnits.length} {businessUnits.length === 1 ? 'empresa disponible' : 'empresas disponibles'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: palette.dark.soft,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 48,
          }}
        >
          <Text style={{ color: palette.dark.textDim, fontSize: 16 }}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar empresa o RNC"
            placeholderTextColor={palette.dark.textDim}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={{ flex: 1, color: palette.dark.text, fontSize: 15, fontWeight: '500' }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Text style={{ color: palette.dark.textDim, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40, gap: 10 }}>
        {filteredUnits.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ color: palette.dark.textDim, fontSize: 14, fontWeight: '500' }}>
              No se encontraron empresas
            </Text>
          </View>
        ) : null}
        {filteredUnits.map((bu, i) => {
          const locCount = filterActiveLocations(bu.locations ?? []).length;
          const logoUrl = pbImageUrl(bu.business_unit_image_storage);
          return (
            <Animated.View key={bu.business_unit_id} entering={FadeInDown.delay(80 + i * 60).duration(420)}>
              <Pressable onPress={() => handleSelect(bu)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <Card variant="default">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    {logoUrl ? (
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 15,
                          backgroundColor: palette.dark.soft,
                          overflow: 'hidden',
                        }}
                      >
                        <Image source={{ uri: logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                    ) : (
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
                        <Text style={{ color: BRAND_MID, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
                          {initialsOf(buName(bu))}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}
                        numberOfLines={1}
                      >
                        {buName(bu)}
                      </Text>
                      <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500', marginTop: 3 }}>
                        {locCount} {locCount === 1 ? 'sucursal' : 'sucursales'}
                        {bu.rnc ? ` · RNC ${bu.rnc}` : ''}
                      </Text>
                    </View>
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
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

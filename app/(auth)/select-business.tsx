import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { palette } from '@theme/colors';
import { Card } from '@components/ui';
import { buName, pbImageUrl } from '@utils/format';
import { logger } from '@utils/logger';
import type { BusinessUnitAccess } from '@/types/business';
import { filterActiveLocations } from '@/types/business';

export default function SelectBusinessScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveBusinessUnit = useBusinessStore((s) => s.setActiveBusinessUnit);

  const businessUnits = user?.business_units_with_access ?? [];

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
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }}>
      <View style={{ padding: 24, paddingBottom: 12 }}>
        <Text style={{ color: palette.dark.text, fontSize: 26, fontWeight: '700', marginBottom: 6, letterSpacing: -0.7 }}>
          Selecciona empresa
        </Text>
        <Text style={{ color: palette.dark.textDim, fontSize: 14 }}>
          {businessUnits.length} empresas disponibles
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        {businessUnits.map((bu) => {
          const locCount = filterActiveLocations(bu.locations ?? []).length;
          const logoUrl = pbImageUrl(bu.business_unit_image_storage);
          return (
            <Pressable
              key={bu.business_unit_id}
              onPress={() => handleSelect(bu)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card variant="default">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {logoUrl ? (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        backgroundColor: palette.dark.soft,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={{ uri: logoUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        backgroundColor: palette.dark.primaryDim,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>🏢</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: palette.dark.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }}
                      numberOfLines={1}
                    >
                      {buName(bu)}
                    </Text>
                    <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                      {locCount} {locCount === 1 ? 'sucursal' : 'sucursales'}
                      {bu.rnc ? ` · RNC ${bu.rnc}` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 22 }}>›</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

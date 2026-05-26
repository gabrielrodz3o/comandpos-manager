import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBusinessStore } from '@store/useBusinessStore';
import { Card } from '@components/ui';
import { palette } from '@theme/colors';
import { buName, locName } from '@utils/format';
import { logger } from '@utils/logger';

export default function SelectLocationScreen() {
  const router = useRouter();
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const setSelected = useBusinessStore((s) => s.setSelectedLocation);

  // Solo locations activas (status_id === 1)
  const locations = useMemo(
    () => (activeBu?.locations ?? []).filter((l) => l.status_id == null || l.status_id === 1),
    [activeBu],
  );

  const handlePick = (locationId: number | null) => {
    logger.info('[select-location]', locationId ? `Picked location ${locationId}` : 'Picked consolidated');
    setSelected(locationId);
    router.replace('/(tabs)/today');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }}>
      <View style={{ padding: 24, paddingBottom: 12 }}>
        <Text style={{ color: palette.dark.textDim, fontSize: 13, fontWeight: '500' }}>
          {buName(activeBu)}
        </Text>
        <Text style={{ color: palette.dark.text, fontSize: 26, fontWeight: '700', marginTop: 4, letterSpacing: -0.7 }}>
          Selecciona sucursal
        </Text>
        <Text style={{ color: palette.dark.textDim, fontSize: 14, marginTop: 6 }}>
          Elige una sucursal o consolida los datos de todas.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        {/* Consolidado */}
        <Pressable
          onPress={() => handlePick(null)}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Card variant="default">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
                <Text style={{ fontSize: 22 }}>🌐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }}>
                  Consolidado
                </Text>
                <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 2 }}>
                  Todas las sucursales · {locations.length}
                </Text>
              </View>
              <Text style={{ color: palette.dark.textMuted, fontSize: 22 }}>›</Text>
            </View>
          </Card>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.dark.border }} />
          <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
            O ELEGIR UNA
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.dark.border }} />
        </View>

        {locations.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => handlePick(loc.id)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Card variant="default">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: palette.dark.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🏬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: palette.dark.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }}
                    numberOfLines={1}
                  >
                    {locName(loc)}
                  </Text>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 2 }}>
                    {loc.code ?? '—'}
                    {loc.address ? ` · ${loc.address.split('\n')[0]}` : ''}
                  </Text>
                </View>
                <Text style={{ color: palette.dark.textMuted, fontSize: 22 }}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

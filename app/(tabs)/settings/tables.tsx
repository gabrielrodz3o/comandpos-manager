import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { palette } from '@theme/colors';
import { fmtInt } from '@utils/format';
import { usePlaces, useTablesByPlace } from '@hooks/useManagement';

const TABLE_STATE_STYLE: Record<number, { label: string; bg: string; color: string }> = {
  1: { label: 'Libre', bg: '#ECFDF5', color: '#065F46' },
  2: { label: 'Ocupada', bg: '#FEF3C7', color: '#92400E' },
  3: { label: 'Reservada', bg: '#EFF6FF', color: '#1D4ED8' },
  4: { label: 'Mantenim.', bg: '#FECDD3', color: '#9F1239' },
};

export default function TablesScreen() {
  const router = useRouter();
  const { data: places, isLoading: loadingPlaces, eff } = usePlaces();
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  // Auto-select first place
  useEffect(() => {
    if (!selectedPlaceId && places && places.length > 0) {
      setSelectedPlaceId(places[0].place_id);
    }
  }, [places, selectedPlaceId]);

  const { data: tables, isLoading: loadingTables, isFetching, refetch, isRefetching } =
    useTablesByPlace(selectedPlaceId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
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
              Mesas
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(places?.length ?? 0)} áreas · {fmtInt(tables?.length ?? 0)} mesas en {' '}
              {places?.find((p) => p.place_id === selectedPlaceId)?.place_name ?? '—'}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ActiveLocationBanner eff={eff} />
        </View>

        {/* Places tabs */}
        {!eff.needsExplicitSelection && places && places.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
          >
            {places.map((p) => {
              const active = selectedPlaceId === p.place_id;
              return (
                <Pressable
                  key={p.place_id}
                  onPress={() => setSelectedPlaceId(p.place_id)}
                  style={({ pressed }) => ({
                    backgroundColor: active ? palette.dark.text : palette.dark.surface,
                    borderWidth: 1,
                    borderColor: active ? palette.dark.text : palette.dark.border,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: active ? '#FFFFFF' : palette.dark.text,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {p.place_name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <InlineFetchingBar visible={isFetching && !loadingTables} />

        <View style={{ paddingHorizontal: 16 }}>
          {eff.needsExplicitSelection ? null : loadingPlaces || loadingTables ? (
            <LoadingState label="Cargando mesas…" />
          ) : !tables || tables.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin mesas en esta área.
              </Text>
            </Card>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              {tables.map((t) => {
                const sty = TABLE_STATE_STYLE[t.table_state_id ?? 1] ?? TABLE_STATE_STYLE[1];
                return (
                  <View
                    key={t.id}
                    style={{
                      width: '31%',
                      backgroundColor: sty.bg,
                      borderRadius: 14,
                      padding: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: sty.color + '33',
                    }}
                  >
                    <Text
                      style={{
                        color: sty.color,
                        fontSize: 22,
                        fontWeight: '800',
                        letterSpacing: -0.5,
                      }}
                      numberOfLines={1}
                    >
                      {t.table_name}
                    </Text>
                    <Text style={{ color: sty.color, fontSize: 10, fontWeight: '700', marginTop: 4 }}>
                      {sty.label.toUpperCase()}
                    </Text>
                    {t.chairs ? (
                      <Text style={{ color: sty.color, fontSize: 10, marginTop: 2, opacity: 0.7 }}>
                        🪑 {t.chairs}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

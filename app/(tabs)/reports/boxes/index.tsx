import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportHeader } from '@components/reports/ReportHeader';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette } from '@theme/colors';
import { fmtCurrency } from '@utils/format';
import { useBoxesList } from '@hooks/useBoxes';
import type { BoxAmount } from '@/types/reports';

const totalAmount = (amounts: BoxAmount[] | null, key: 'amount_opened' | 'amount_closed'): number => {
  if (!amounts?.length) return 0;
  return amounts.reduce((sum, a) => sum + Number(a[key] ?? 0), 0);
};

const formatDateTime = (raw: string): string => {
  try {
    return new Date(raw).toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
};

export default function BoxesIndex() {
  const router = useRouter();
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useBoxesList();
  const entries = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <ReportHeader title="Cajas" subtitle={`${entries.length} aperturas en el período`} />

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState
              label="Cargando cajas…"
              hint="Trayendo aperturas y cierres del período."
              variant="centered"
            />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : entries.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin aperturas de caja en este período.
              </Text>
            </Card>
          ) : (
            entries.map((b) => {
              const opened = totalAmount(b.amounts, 'amount_opened');
              const closed = totalAmount(b.amounts, 'amount_closed');
              return (
                <Pressable
                  key={b.box_entry_id}
                  onPress={() => router.push(`/(tabs)/reports/boxes/${b.box_entry_id}`)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <Card variant="default">
                    <View
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}>
                            {b.box_name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: b.is_open ? '#FEF3C7' : palette.dark.primaryDim,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: b.is_open ? '#92400E' : palette.dark.success,
                                fontSize: 9,
                                fontWeight: '800',
                                letterSpacing: 0.5,
                              }}
                            >
                              {b.is_open ? 'ABIERTA' : 'CERRADA'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
                          {b.use_fullname}
                        </Text>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }}>
                          {formatDateTime(b.open_at)}
                          {b.close_at ? ` → ${formatDateTime(b.close_at)}` : ' · sin cerrar'}
                          {b.shift_code ? ` · ${b.shift_code}` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                          {fmtCurrency(b.is_open ? opened : closed, 'DOP', 2)}
                        </Text>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 2 }}>
                          {b.is_open ? 'apertura' : 'cierre · ver detalle'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

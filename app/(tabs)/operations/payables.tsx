import React from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useAccountsPayable } from '@hooks/useAdmin';
import type { PayableSupplier, PayableAgingBucket } from '@/types/admin';

const money = (n: unknown) => fmtCurrency(n, 'DOP', 2);

const AGING_COLOR: Record<string, string> = {
  'AL DIA': '#10B981',
  '1-30 DIAS': '#F59E0B',
  '31-60 DIAS': '#F97316',
  '61-90 DIAS': '#EF4444',
  'MAS DE 90 DIAS': '#991B1B',
};

export default function PayablesScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useAccountsPayable();

  const kpis = data?.kpis;
  const aging = data?.aging_analysis ?? [];
  const top = (data?.top_proveedores_deuda ?? data?.resumen_por_proveedor ?? []).slice(0, 30);

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
              Cuentas por Pagar
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              Deuda con proveedores
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState label="Cargando cuentas por pagar…" hint="Saldos y vencimientos." variant="centered" />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : (
            <>
              {/* Total */}
              <Card variant="default">
                <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  TOTAL POR PAGAR
                </Text>
                <Text style={{ color: palette.dark.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 }}>
                  {money(kpis?.total_por_pagar)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <MiniStat label="Proveedores" value={fmtInt(kpis?.total_proveedores)} />
                  <MiniStat label="Facturas" value={fmtInt(kpis?.total_facturas)} />
                  <MiniStat
                    label="Vencidos"
                    value={fmtInt(kpis?.proveedores_vencidos)}
                    danger={(kpis?.proveedores_vencidos ?? 0) > 0}
                  />
                </View>
              </Card>

              {/* Aging */}
              {aging.length > 0 ? (
                <Card variant="default">
                  <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
                    Antigüedad de saldos
                  </Text>
                  <View style={{ gap: 8 }}>
                    {aging.map((a) => (
                      <AgingRow key={a.aging_category} bucket={a} />
                    ))}
                  </View>
                </Card>
              ) : null}

              {/* Top proveedores */}
              {top.length > 0 ? (
                <Card variant="default" padded={false}>
                  <View style={{ padding: 14, paddingBottom: 8 }}>
                    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                      Proveedores con más deuda
                    </Text>
                  </View>
                  {top.map((s, i) => (
                    <SupplierRow key={`sup-${s.entity_id}-${i}`} sup={s} isFirst={i === 0} />
                  ))}
                </Card>
              ) : (
                <Card>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                    Sin cuentas por pagar pendientes. 🎉
                  </Text>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MiniStat: React.FC<{ label: string; value: string; danger?: boolean }> = ({ label, value, danger }) => (
  <View style={{ flex: 1, backgroundColor: palette.dark.soft, borderRadius: 10, padding: 10 }}>
    <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color: danger ? palette.dark.danger : palette.dark.text, fontSize: 16, fontWeight: '800', marginTop: 3 }}>
      {value}
    </Text>
  </View>
);

const AgingRow: React.FC<{ bucket: PayableAgingBucket }> = ({ bucket }) => {
  const color = AGING_COLOR[bucket.aging_category] ?? palette.dark.textMuted;
  const pct = Math.max(0, Math.min(100, Number(bucket.porcentaje_del_total) || 0));
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '600' }}>
          {bucket.aging_category} · {fmtInt(bucket.num_facturas)} fact.
        </Text>
        <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{money(bucket.monto_total)}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: palette.dark.soft, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: 6, backgroundColor: color }} />
      </View>
    </View>
  );
};

const SupplierRow: React.FC<{ sup: PayableSupplier; isFirst: boolean }> = ({ sup, isFirst }) => {
  const overdue = (sup.max_dias_vencidos ?? 0) > 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: palette.dark.border,
      }}
    >
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
          {sup.entity_name}
        </Text>
        <Text style={{ color: overdue ? palette.dark.danger : palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
          {fmtInt(sup.num_facturas)} factura(s)
          {overdue ? ` · ${fmtInt(sup.max_dias_vencidos)}d vencido` : ' · al día'}
        </Text>
      </View>
      <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800' }}>
        {money(sup.total_pendiente)}
      </Text>
    </View>
  );
};

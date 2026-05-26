import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportHeader } from '@components/reports/ReportHeader';
import { ExportButton } from '@components/reports/ExportButton';
import { useBusinessStore } from '@store/useBusinessStore';
import { useFiltersStore } from '@store/useFiltersStore';
import { buName } from '@utils/format';
import { KpiCard } from '@components/dashboard/KpiCard';
import { SectionCard } from '@components/dashboard/SectionCard';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtPct, fmtInt } from '@utils/format';
import { usePlKpis, usePlTrends } from '@hooks/useProfitLoss';
import type { PlKpisFinancial } from '@/types/reports';

const EMPTY_KPIS: PlKpisFinancial = {
  ventas_brutas: 0, descuentos: 0, ingresos_envio: 0, ventas_netas: 0,
  itbis_cobrado: 0, propinas: 0, costo_ventas: 0, ganancia_bruta: 0,
  total_gastos: 0, total_nomina: 0, total_ocupacion: 0, gastos_sin_nomina: 0,
  cortesias_venta: 0, mermas_costo: 0, total_compras: 0, num_facturas: 0,
  total_comisiones: 0, ebitda: 0, ganancia_neta: 0,
};

const n = (v: unknown) => Number(v ?? 0);

const Row: React.FC<{ label: string; value: string; sub?: boolean; bold?: boolean; positive?: boolean; negative?: boolean }> = ({
  label, value, sub, bold, positive, negative,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingLeft: sub ? 16 : 0,
      borderBottomWidth: bold ? 1.5 : 0.5,
      borderBottomColor: bold ? palette.dark.text : palette.dark.border,
    }}
  >
    <Text
      style={{
        color: sub ? palette.dark.textDim : palette.dark.text,
        fontSize: sub ? 12 : 13,
        fontWeight: bold ? '700' : sub ? '500' : '600',
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        color: positive ? palette.dark.success : negative ? palette.dark.danger : palette.dark.text,
        fontSize: sub ? 12 : 13,
        fontWeight: bold ? '800' : sub ? '500' : '600',
      }}
    >
      {value}
    </Text>
  </View>
);

export default function ProfitLossScreen() {
  const bu = useBusinessStore((s) => s.activeBusinessUnit);
  const selectedLocId = useBusinessStore((s) => s.selectedLocationId);
  const locationName = bu?.locations?.find((l) => l.id === selectedLocId)?.description_long;
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);
  const kpisQ = usePlKpis();
  const trendsQ = usePlTrends();

  // Merge: prefer kpis, fallback to estado_resultados
  const k = { ...EMPTY_KPIS, ...(kpisQ.data?.kpis ?? {}) };
  const er = kpisQ.data?.estado_resultados;
  const gananciaNeta = n(er?.ganancia_neta) || n(k.ganancia_neta) || n(k.ebitda);
  const ebitda = n(er?.ebitda) || n(k.ebitda);

  const isLoading = kpisQ.isLoading || trendsQ.isLoading;
  const isFetching = kpisQ.isFetching || trendsQ.isFetching;
  const isRefetching = kpisQ.isRefetching || trendsQ.isRefetching;
  const error = kpisQ.error ?? trendsQ.error;

  const hasAnyData =
    n(k.ventas_brutas) || n(k.ventas_netas) || n(k.total_gastos) || n(er?.ingresos?.ventas_brutas);

  const onRefresh = () => {
    kpisQ.refetch();
    trendsQ.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      >
        <ReportHeader
          title="Estado de Resultados"
          subtitle="P&L del período"
          actions={
            hasAnyData ? (
              <ExportButton
                title="Estado de Resultados (P&L)"
                businessName={buName(bu)}
                locationName={locationName}
                dateRange={`${startDate} → ${endDate}`}
                sections={[
                  {
                    title: 'Estado de Resultados',
                    rows: [
                      { label: 'Ventas Brutas', value: fmtCurrency(k.ventas_brutas) },
                      { label: '(–) Descuentos', value: fmtCurrency(k.descuentos), negative: true },
                      { label: '(+) Envíos', value: fmtCurrency(k.ingresos_envio), positive: true },
                      { label: '= Ventas Netas', value: fmtCurrency(k.ventas_netas) },
                      { label: 'Costo de Ventas', value: fmtCurrency(k.costo_ventas), negative: true },
                      { label: '= Ganancia Bruta', value: fmtCurrency(k.ganancia_bruta), positive: true },
                      { label: 'Nómina', value: fmtCurrency(k.total_nomina), negative: true },
                      { label: 'Gastos Operativos', value: fmtCurrency(k.gastos_sin_nomina), negative: true },
                      { label: 'Cortesías', value: fmtCurrency(k.cortesias_venta), negative: true },
                      { label: 'Mermas', value: fmtCurrency(k.mermas_costo), negative: true },
                      { label: 'Comisiones', value: fmtCurrency(k.total_comisiones), negative: true },
                      { label: 'EBITDA', value: fmtCurrency(ebitda), positive: ebitda >= 0, negative: ebitda < 0 },
                      { label: 'GANANCIA NETA', value: fmtCurrency(gananciaNeta), positive: gananciaNeta >= 0, negative: gananciaNeta < 0 },
                    ],
                  },
                  {
                    title: 'Composición de ingresos',
                    rows: [
                      { label: 'Propinas', value: fmtCurrency(k.propinas) },
                      { label: 'ITBIS Cobrado', value: fmtCurrency(k.itbis_cobrado) },
                      { label: 'Compras del período', value: fmtCurrency(k.total_compras) },
                      { label: 'Número de facturas', value: fmtInt(k.num_facturas) },
                    ],
                  },
                ]}
              />
            ) : null
          }
        />

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          {isLoading ? (
            <LoadingState
              label="Calculando estado de resultados…"
              hint="Estamos consolidando ventas, costos, gastos y nómina del período."
              variant="centered"
            />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar el reporte.'}
              </Text>
            </Card>
          ) : !hasAnyData ? (
            <Card>
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
                Sin movimientos
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center' }}>
                No hay datos contables en el período seleccionado. Prueba con un rango más amplio.
              </Text>
            </Card>
          ) : (
            <>
              {/* Hero */}
              <KpiCard
                variant="hero"
                label="Ganancia Neta"
                value={fmtCurrency(gananciaNeta)}
                delta={
                  n(k.ventas_netas) > 0 ? (gananciaNeta / n(k.ventas_netas)) * 100 : undefined
                }
                hint={`EBITDA ${fmtCurrency(ebitda)}`}
              />

              {/* KPIs */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Ventas Netas"
                  value={fmtCurrency(k.ventas_netas)}
                  emoji="💰"
                  hint={`${fmtInt(k.num_facturas)} facturas`}
                />
                <KpiCard
                  label="Ganancia Bruta"
                  value={fmtCurrency(k.ganancia_bruta)}
                  emoji="📈"
                  hint={`${fmtPct((n(k.ganancia_bruta) / Math.max(1, n(k.ventas_netas))) * 100)} margen`}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Gastos Op."
                  value={fmtCurrency(n(k.total_gastos) + n(k.total_nomina))}
                  emoji="🧾"
                  hint={`Nómina ${fmtCurrency(k.total_nomina)}`}
                />
                <KpiCard
                  label="EBITDA"
                  value={fmtCurrency(ebitda)}
                  emoji="💎"
                  hint={`${fmtPct((ebitda / Math.max(1, n(k.ventas_netas))) * 100)} margen`}
                />
              </View>

              {/* P&L Detalle */}
              <SectionCard title="Estado de Resultados" subtitle="Desglose línea por línea" emoji="📊">
                <Row label="Ventas Brutas" value={fmtCurrency(k.ventas_brutas)} />
                <Row label="(–) Descuentos" value={`(${fmtCurrency(k.descuentos)})`} sub negative />
                <Row label="(+) Envíos" value={fmtCurrency(k.ingresos_envio)} sub positive />
                <Row label="= Ventas Netas" value={fmtCurrency(k.ventas_netas)} bold />

                <View style={{ height: 6 }} />
                <Row label="Costo de Ventas" value={`(${fmtCurrency(k.costo_ventas)})`} negative />
                <Row label="= Ganancia Bruta" value={fmtCurrency(k.ganancia_bruta)} bold positive />

                <View style={{ height: 6 }} />
                <Row label="Nómina" value={`(${fmtCurrency(k.total_nomina)})`} sub negative />
                <Row label="Gastos Operativos" value={`(${fmtCurrency(k.gastos_sin_nomina)})`} sub negative />
                {n(k.total_ocupacion) ? (
                  <Row label="Ocupación" value={`(${fmtCurrency(k.total_ocupacion)})`} sub negative />
                ) : null}
                <Row label="Total Gastos Op." value={`(${fmtCurrency(n(k.total_gastos) + n(k.total_nomina))})`} bold negative />

                <View style={{ height: 6 }} />
                <Row label="Cortesías" value={`(${fmtCurrency(k.cortesias_venta)})`} sub negative />
                <Row label="Mermas" value={`(${fmtCurrency(k.mermas_costo)})`} sub negative />
                <Row label="Comisiones" value={`(${fmtCurrency(k.total_comisiones)})`} sub negative />

                <View style={{ height: 8 }} />
                <Row label="EBITDA" value={fmtCurrency(ebitda)} bold positive={ebitda >= 0} negative={ebitda < 0} />
                <Row
                  label="GANANCIA NETA"
                  value={fmtCurrency(gananciaNeta)}
                  bold
                  positive={gananciaNeta >= 0}
                  negative={gananciaNeta < 0}
                />
              </SectionCard>

              {/* Ingresos extras */}
              <SectionCard title="Composición de ingresos" emoji="💰">
                <Row label="Propinas" value={fmtCurrency(k.propinas)} sub />
                <Row label="ITBIS Cobrado" value={fmtCurrency(k.itbis_cobrado)} sub />
                <Row label="Compras del período" value={fmtCurrency(k.total_compras)} sub />
              </SectionCard>

              {trendsQ.data?.tendencia_diaria?.length ? (
                <SectionCard title="Tendencia diaria" subtitle={`${trendsQ.data.tendencia_diaria.length} días`} emoji="📈">
                  <View style={{ gap: 8 }}>
                    {trendsQ.data.tendencia_diaria.slice(-7).map((d, idx) => (
                      <View
                        key={`pl-d-${idx}`}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
                      >
                        <Text style={{ color: palette.dark.textDim, fontSize: 12 }}>{d.date}</Text>
                        <Text
                          style={{
                            color: n(d.utilidad) >= 0 ? palette.dark.success : palette.dark.danger,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {fmtCurrency(d.utilidad)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

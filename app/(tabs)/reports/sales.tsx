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
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import {
  useSalesSummary,
  useSalesPayments,
  useProductsAbc,
  useSalesTrends,
  useSalesLosses,
  useSalesCategories,
  useSalesComparatives,
} from '@hooks/useSalesReport';
import { DailyTrendLine } from '@components/charts/DailyTrendLine';
import { CategoriesDonut } from '@components/charts/CategoriesDonut';
import { ComparativesCard } from '@components/dashboard/ComparativesCard';
import { LossesPanel } from '@components/dashboard/LossesPanel';
import type { CategoryRow } from '@/types/reports';

export default function SalesReportScreen() {
  const bu = useBusinessStore((s) => s.activeBusinessUnit);
  const selectedLocId = useBusinessStore((s) => s.selectedLocationId);
  const locationName = bu?.locations?.find((l) => l.id === selectedLocId)?.description_long;
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);
  const summaryQ = useSalesSummary();
  const paymentsQ = useSalesPayments();
  const productsQ = useProductsAbc();
  const trendsQ = useSalesTrends();
  const lossesQ = useSalesLosses();
  const categoriesQ = useSalesCategories();
  const comparativesQ = useSalesComparatives();

  const summary = summaryQ.data?.current_period;
  const payments = paymentsQ.data?.pagos_por_metodo ?? [];
  const products = productsQ.data?.products ?? [];
  const trends = trendsQ.data;
  const losses = lossesQ.data;
  // Categories: backend devuelve array directo o { categories: [] }
  const categories: CategoryRow[] = Array.isArray(categoriesQ.data)
    ? categoriesQ.data
    : (categoriesQ.data as { categories?: CategoryRow[] } | undefined)?.categories ?? [];
  const comparatives = comparativesQ.data;

  const isLoading = summaryQ.isLoading || paymentsQ.isLoading || productsQ.isLoading;
  const isFetching =
    summaryQ.isFetching ||
    paymentsQ.isFetching ||
    productsQ.isFetching ||
    trendsQ.isFetching ||
    lossesQ.isFetching ||
    categoriesQ.isFetching ||
    comparativesQ.isFetching;
  const isRefetching = summaryQ.isRefetching || paymentsQ.isRefetching || productsQ.isRefetching;

  const onRefresh = () => {
    summaryQ.refetch();
    paymentsQ.refetch();
    productsQ.refetch();
    trendsQ.refetch();
    lossesQ.refetch();
    categoriesQ.refetch();
    comparativesQ.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      >
        <ReportHeader
          title="Ventas"
          subtitle="Resumen ejecutivo del período"
          actions={
            summary ? (
              <ExportButton
                title="Reporte de Ventas"
                businessName={buName(bu)}
                locationName={locationName}
                dateRange={`${startDate} → ${endDate}`}
                sections={[
                  {
                    title: 'Resumen ejecutivo',
                    rows: [
                      { label: 'Ventas netas', value: fmtCurrency(summary.total_sales) },
                      // Ventas ya netas de NC (server); la línea es informativa
                      ...(Number(summary.credit_notes_total) > 0
                        ? [{ label: `Notas de crédito (${fmtInt(summary.credit_notes_count)})`, value: `-${fmtCurrency(summary.credit_notes_total)}`, negative: true }]
                        : []),
                      { label: 'Facturas', value: fmtInt(summary.num_facturas) },
                      { label: 'Ticket promedio', value: fmtCurrency(summary.avg_ticket) },
                      { label: 'Costo de ventas', value: fmtCurrency(summary.total_cost) },
                      { label: 'Utilidad bruta', value: fmtCurrency(summary.total_profit), positive: true },
                      { label: 'Propinas', value: fmtCurrency(summary.total_tips) },
                      { label: 'Descuentos', value: fmtCurrency(summary.total_discounts), negative: true },
                      { label: 'ITBIS cobrado', value: fmtCurrency(summary.total_taxes) },
                      { label: 'Items vendidos', value: fmtInt(summary.total_items) },
                      { label: 'Utilidad real', value: fmtCurrency(summary.total_real_profit), positive: summary.total_real_profit >= 0, negative: summary.total_real_profit < 0 },
                    ],
                  },
                  ...(payments.length > 0
                    ? [
                        {
                          title: 'Métodos de pago',
                          rows: payments.slice(0, 10).map((p) => ({
                            label: `${p.payment_type_name} (${fmtInt(p.num_facturas)})`,
                            value: fmtCurrency(p.payment_amount),
                          })),
                        },
                      ]
                    : []),
                  ...(products.length > 0
                    ? [
                        {
                          title: 'Top 10 productos',
                          rows: products.slice(0, 10).map((p) => ({
                            label: `${p.rank}. ${p.product_name}`,
                            value: fmtCurrency(p.revenue),
                          })),
                        },
                      ]
                    : []),
                ]}
              />
            ) : null
          }
        />

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          {isLoading ? (
            <LoadingState
              label="Calculando ventas…"
              hint="Estamos consolidando facturas, pagos y productos."
              variant="centered"
            />
          ) : (
            <>
              {/* Hero — ventas totales (ya NETAS de notas de crédito, server) */}
              {summary ? (
                <KpiCard
                  variant="hero"
                  label="Ventas Netas"
                  value={fmtCurrency(summary.total_sales)}
                  delta={summary.compras_vs_ventas_pct}
                  hint={`${fmtInt(summary.num_facturas)} facturas · ${fmtInt(summary.days_with_sales)} días${
                    Number(summary.credit_notes_total) > 0
                      ? ` · NC −${fmtCurrency(summary.credit_notes_total)} (${fmtInt(summary.credit_notes_count)})`
                      : ''
                  }`}
                />
              ) : null}

              {/* KPI Grid */}
              {summary ? (
                <>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <KpiCard
                      label="Utilidad Bruta"
                      value={fmtCurrency(summary.total_profit)}
                      emoji="📈"
                      hint={`${fmtPct((summary.total_profit / (summary.total_sales || 1)) * 100)} margen`}
                    />
                    <KpiCard
                      label="Ticket Prom."
                      value={fmtCurrency(summary.avg_ticket)}
                      emoji="🎫"
                      hint={`Max ${fmtCurrency(summary.max_ticket)}`}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <KpiCard
                      label="Propinas"
                      value={fmtCurrency(summary.total_tips)}
                      emoji="💵"
                      hint={`Prom ${fmtCurrency(summary.avg_tip)}`}
                    />
                    <KpiCard
                      label="Descuentos"
                      value={fmtCurrency(summary.total_discounts)}
                      emoji="🏷️"
                      hint={`ITBIS ${fmtCurrency(summary.total_taxes)}`}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <KpiCard
                      label="Costo de Ventas"
                      value={fmtCurrency(summary.total_cost)}
                      emoji="📦"
                      hint={`Prime ${fmtPct(summary.prime_cost_pct)}`}
                    />
                    <KpiCard
                      label="Items vendidos"
                      value={fmtInt(summary.total_items)}
                      emoji="🛒"
                      hint={`${summary.items_per_invoice} por factura`}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <KpiCard
                      label="Gastos op."
                      value={fmtCurrency(summary.total_gastos)}
                      emoji="🧾"
                      hint={`Nómina ${fmtCurrency(summary.total_nomina)}`}
                    />
                    <KpiCard
                      label="Utilidad Real"
                      value={fmtCurrency(summary.total_real_profit)}
                      emoji="💎"
                      hint={`Comisiones ${fmtCurrency(summary.total_commissions)}`}
                    />
                  </View>
                </>
              ) : null}

              {/* Tendencia diaria */}
              {trends?.current?.length ? (
                <SectionCard
                  title="Tendencia diaria"
                  subtitle="Ventas día a día"
                  emoji="📈"
                >
                  <DailyTrendLine
                    current={trends.current}
                    previous={trends.previous}
                    field="total_sales"
                  />
                </SectionCard>
              ) : null}

              {/* Comparativos */}
              {comparatives?.vs_previous || comparatives?.vs_last_year ? (
                <SectionCard
                  title="Comparativo"
                  subtitle="Crecimiento del período"
                  emoji="📊"
                >
                  <View style={{ gap: 18 }}>
                    {comparatives.vs_previous ? (
                      <ComparativesCard title="vs período anterior" data={comparatives.vs_previous} />
                    ) : null}
                    {comparatives.vs_last_year ? (
                      <ComparativesCard title="vs año pasado" data={comparatives.vs_last_year} />
                    ) : null}
                  </View>
                </SectionCard>
              ) : null}

              {/* Categorías */}
              {categories.length > 0 ? (
                <SectionCard
                  title="Ventas por categoría"
                  subtitle={`${categories.length} categorías`}
                  emoji="🥧"
                >
                  <CategoriesDonut data={categories} />
                </SectionCard>
              ) : null}

              {/* Cortesías y Mermas */}
              {losses ? (
                <SectionCard
                  title="Cortesías y Mermas"
                  subtitle="Control de pérdidas"
                  emoji="⚠️"
                >
                  <LossesPanel data={losses} />
                </SectionCard>
              ) : null}

              {/* Métodos de pago */}
              {payments.length > 0 ? (
                <SectionCard title="Métodos de pago" subtitle={`${payments.length} métodos`} emoji="💳">
                  <View style={{ gap: 12 }}>
                    {payments.slice(0, 8).map((p, idx) => (
                      <View key={`pm-${idx}`} style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 3,
                                backgroundColor:
                                  p.payment_type_color || chartPalette[idx % chartPalette.length],
                              }}
                            />
                            <Text
                              style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1 }}
                              numberOfLines={1}
                            >
                              {p.payment_type_name}
                            </Text>
                          </View>
                          <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                            {fmtCurrency(p.payment_amount)}
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 5,
                            backgroundColor: palette.dark.soft,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              width: `${Math.min(100, p.porcentaje)}%`,
                              height: '100%',
                              backgroundColor:
                                p.payment_type_color || chartPalette[idx % chartPalette.length],
                            }}
                          />
                        </View>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                          {fmtPct(p.porcentaje, 1)} · {fmtInt(p.num_facturas)} facturas
                        </Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              ) : null}

              {/* Productos ABC */}
              {products.length > 0 ? (
                <SectionCard title="Top productos" subtitle="Por ingresos" emoji="🏆">
                  <View style={{ gap: 14 }}>
                    {products.slice(0, 10).map((p, idx) => {
                      const max = Math.max(...products.slice(0, 10).map((x) => x.revenue || 0));
                      const pct = max > 0 ? (p.revenue / max) * 100 : 0;
                      return (
                        <View key={`abc-${idx}`} style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 7,
                                  backgroundColor:
                                    p.abc_class === 'A'
                                      ? '#ECFDF5'
                                      : p.abc_class === 'B'
                                      ? '#FFFBEB'
                                      : palette.dark.soft,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text
                                  style={{
                                    color:
                                      p.abc_class === 'A'
                                        ? palette.dark.success
                                        : p.abc_class === 'B'
                                        ? palette.dark.warning
                                        : palette.dark.text,
                                    fontSize: 11,
                                    fontWeight: '800',
                                  }}
                                >
                                  {p.abc_class ?? p.rank}
                                </Text>
                              </View>
                              <Text
                                style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1 }}
                                numberOfLines={1}
                              >
                                {p.product_name}
                              </Text>
                            </View>
                            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                              {fmtCurrency(p.revenue)}
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 4,
                              backgroundColor: palette.dark.soft,
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: palette.dark.primary,
                              }}
                            />
                          </View>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                            {fmtInt(p.quantity_sold)} unid. {p.category_name ? `· ${p.category_name}` : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </SectionCard>
              ) : null}

              {!summary && !isLoading ? (
                <Card>
                  <Text style={{ color: palette.dark.textDim, textAlign: 'center', fontSize: 13 }}>
                    Sin datos en este período.
                  </Text>
                </Card>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


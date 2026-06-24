import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportHeader } from '@components/reports/ReportHeader';
import { KpiCard } from '@components/dashboard/KpiCard';
import { SectionCard } from '@components/dashboard/SectionCard';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import { usePurchasesExpenses } from '@hooks/usePurchasesExpenses';

export default function PurchasesExpensesScreen() {
  const { data, isLoading, isFetching, isRefetching, refetch, error } = usePurchasesExpenses();
  const summary = data?.summary;
  const series = data?.time_series ?? [];
  const expenses = data?.expense_breakdown ?? [];
  const suppliers = data?.top_suppliers ?? [];
  const recent = data?.recent ?? [];

  // El backend a veces devuelve el `summary` con totales en 0 aunque los
  // desgloses (expense_breakdown / top_suppliers) sí traen montos. En ese caso
  // derivamos los KPIs sumando los desgloses para no mostrar RD$0 incorrecto.
  const sumBy = <T,>(arr: T[], key: keyof T): number =>
    arr.reduce((acc, x) => acc + (Number(x?.[key]) || 0), 0);

  const totalExpenses = Number(summary?.total_expenses) || sumBy(expenses, 'total');
  const totalPurchases = Number(summary?.total_purchases) || sumBy(suppliers, 'purchases_total');
  const totalCombined =
    Number(summary?.total_combined) || totalPurchases + totalExpenses;
  const unclassifiedTotal =
    Number(summary?.unclassified_expenses_total) ||
    sumBy(expenses.filter((e) => e.is_unclassified), 'total');
  const unclassifiedPct =
    Number(summary?.unclassified_pct) ||
    (totalExpenses > 0 ? (unclassifiedTotal / totalExpenses) * 100 : 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <ReportHeader title="Compras y Gastos" subtitle="Proveedores y categorías" />

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          {isLoading ? (
            <LoadingState
              label="Cargando compras y gastos…"
              hint="Consolidando proveedores, categorías y facturas."
              variant="centered"
            />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar el reporte.'}
              </Text>
            </Card>
          ) : !summary ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin datos en este período.
              </Text>
            </Card>
          ) : (
            <>
              {/* Hero */}
              <KpiCard
                variant="hero"
                label="Total Compras + Gastos"
                value={fmtCurrency(totalCombined)}
                hint={`${fmtInt((summary.purchases_count ?? 0) + (summary.expenses_count ?? 0))} facturas`}
              />

              {/* KPIs */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Compras"
                  value={fmtCurrency(totalPurchases)}
                  emoji="🛍️"
                  hint={`${fmtInt(summary.purchases_count)} órdenes`}
                />
                <KpiCard
                  label="Gastos"
                  value={fmtCurrency(totalExpenses)}
                  emoji="🧾"
                  hint={`${fmtInt(summary.expenses_count)} registros`}
                />
              </View>
              {summary.unclassified_pct != null ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <KpiCard
                    label="Sin clasificar"
                    value={fmtCurrency(unclassifiedTotal)}
                    emoji="⚠️"
                    hint={`${fmtPct(unclassifiedPct)} del total`}
                  />
                  <KpiCard
                    label="Días sin egresos"
                    value={fmtInt(summary.zero_egress_days)}
                    emoji="📅"
                    hint={`de ${fmtInt(summary.total_days)} días`}
                  />
                </View>
              ) : null}

              {/* Categorías de gastos */}
              {expenses.length > 0 ? (
                <SectionCard
                  title="Categorías de gastos"
                  subtitle={`${expenses.length} categorías`}
                  emoji="🏷️"
                >
                  <View style={{ gap: 12 }}>
                    {expenses.slice(0, 8).map((e, idx) => {
                      const max = Math.max(...expenses.map((x) => x.total || 0));
                      const pct = max > 0 ? (e.total / max) * 100 : 0;
                      return (
                        <View key={`ec-${idx}`} style={{ gap: 6 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              <View
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: 3,
                                  backgroundColor: chartPalette[idx % chartPalette.length],
                                }}
                              />
                              <Text
                                style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1 }}
                                numberOfLines={1}
                              >
                                {e.name || 'Sin clasificar'}
                              </Text>
                              {e.is_unclassified ? (
                                <Text style={{ color: palette.dark.warning, fontSize: 10, fontWeight: '700' }}>!</Text>
                              ) : null}
                            </View>
                            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                              {fmtCurrency(e.total)}
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
                                backgroundColor: chartPalette[idx % chartPalette.length],
                              }}
                            />
                          </View>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                            {fmtInt(e.count)} facturas · prom {fmtCurrency(e.avg_amount)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </SectionCard>
              ) : null}

              {/* Top proveedores */}
              {suppliers.length > 0 ? (
                <SectionCard
                  title="Top proveedores"
                  subtitle={`${suppliers.length} proveedores`}
                  emoji="🏢"
                >
                  <View style={{ gap: 12 }}>
                    {suppliers.slice(0, 8).map((s, idx) => (
                      <View
                        key={`sup-${idx}`}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                      >
                        <View
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 9,
                            backgroundColor: palette.dark.soft,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '800' }}>
                            {idx + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                            numberOfLines={1}
                          >
                            {s.name}
                          </Text>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                            {fmtInt(s.invoice_count)} facturas
                          </Text>
                        </View>
                        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                          {fmtCurrency(s.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              ) : null}

              {/* Recientes */}
              {recent.length > 0 ? (
                <SectionCard title="Recientes" subtitle="Últimas facturas" emoji="🕐">
                  <View style={{ gap: 10 }}>
                    {recent.slice(0, 6).map((r, idx) => (
                      <View
                        key={`rc-${r.id}-${idx}`}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 4,
                          borderBottomWidth: idx < Math.min(5, recent.length - 1) ? 0.5 : 0,
                          borderBottomColor: palette.dark.border,
                          paddingBottom: 10,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                            numberOfLines={1}
                          >
                            {r.entity_name ?? 'Sin proveedor'}
                          </Text>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                            {r.invoice_ncf ?? r.invoice_number} · {r.expense_type_name ?? r.kind}
                            {r.emission_date ? ` · ${r.emission_date.slice(0, 10)}` : ''}
                          </Text>
                        </View>
                        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                          {fmtCurrency(r.total_amount)}
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

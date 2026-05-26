import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-gifted-charts';
import { ReportHeader } from '@components/reports/ReportHeader';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { KpiCard } from '@components/dashboard/KpiCard';
import { SectionCard } from '@components/dashboard/SectionCard';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import { useTipsAnalysis } from '@hooks/useTipsAnalysis';

export default function TipsAnalysisScreen() {
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useTipsAnalysis();
  const kpis = data?.kpis_generales;
  const ranges = data?.distribucion_rangos ?? [];
  const waiters = data?.tips_por_mesero ?? [];
  const shifts = data?.tips_por_turno ?? [];

  const pieData = ranges.map((r, idx) => ({
    value: r.total,
    color: chartPalette[idx % chartPalette.length],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <ReportHeader title="Propinas" subtitle="Análisis y distribución" />

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState
              label="Analizando propinas…"
              hint="Calculando distribución por rango, mesero y turno."
              variant="centered"
            />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar el reporte.'}
              </Text>
            </Card>
          ) : !kpis ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin propinas en este período.
              </Text>
            </Card>
          ) : (
            <>
              {/* Hero */}
              <KpiCard
                variant="hero"
                label="Total Propinas"
                value={fmtCurrency(kpis.total_tips)}
                delta={kpis.tips_as_pct_of_sales}
                hint={`${fmtPct(kpis.tips_as_pct_of_sales ?? 0)} sobre ventas`}
              />

              {/* KPIs */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Prom. propina"
                  value={fmtCurrency(kpis.avg_tip_amount)}
                  emoji="💵"
                  hint={`${fmtPct(kpis.avg_tip_percentage ?? 0)} prom.`}
                />
                <KpiCard
                  label="% Facturas c/ propina"
                  value={fmtPct(kpis.pct_invoices_with_tip ?? 0)}
                  emoji="📊"
                  hint={`${fmtInt(kpis.invoices_with_tip)} de ${fmtInt(kpis.total_invoices)}`}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Propina máxima"
                  value={fmtCurrency(kpis.max_tip)}
                  emoji="🚀"
                />
                <KpiCard
                  label="Ventas asoc."
                  value={fmtCurrency(kpis.total_sales)}
                  emoji="🧾"
                />
              </View>

              {/* Distribución por rangos */}
              {ranges.length > 0 ? (
                <SectionCard title="Distribución" subtitle="Por rango de propina" emoji="🥧">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                    <PieChart
                      data={pieData}
                      donut
                      radius={64}
                      innerRadius={46}
                      innerCircleColor={palette.dark.surface}
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center' }}>
                          <Text
                            style={{
                              color: palette.dark.textMuted,
                              fontSize: 9,
                              fontWeight: '600',
                              letterSpacing: 1,
                            }}
                          >
                            TOTAL
                          </Text>
                          <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                            {fmtCurrency(kpis.total_tips)}
                          </Text>
                        </View>
                      )}
                      isAnimated
                    />
                    <View style={{ flex: 1, gap: 8 }}>
                      {ranges.map((r, idx) => (
                        <View
                          key={`r-${idx}`}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                        >
                          <View
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: 3,
                              backgroundColor: chartPalette[idx % chartPalette.length],
                            }}
                          />
                          <Text
                            style={{
                              color: palette.dark.text,
                              fontSize: 12,
                              fontWeight: '500',
                              flex: 1,
                            }}
                          >
                            {r.tip_range}
                          </Text>
                          <Text
                            style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '600' }}
                          >
                            {fmtPct(r.pct, 0)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </SectionCard>
              ) : null}

              {/* Por mesero */}
              {waiters.length > 0 ? (
                <SectionCard title="Top meseros" subtitle="Por propinas" emoji="🏆">
                  <View style={{ gap: 14 }}>
                    {waiters.slice(0, 8).map((w, idx) => {
                      const max = Math.max(...waiters.map((x) => x.total_tips || 0));
                      const pct = max > 0 ? (w.total_tips / max) * 100 : 0;
                      return (
                        <View key={`tw-${w.waiter_id ?? idx}`} style={{ gap: 6 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 7,
                                  backgroundColor: palette.dark.soft,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text
                                  style={{ color: palette.dark.text, fontSize: 11, fontWeight: '800' }}
                                >
                                  {idx + 1}
                                </Text>
                              </View>
                              <Text
                                style={{
                                  color: palette.dark.text,
                                  fontSize: 13,
                                  fontWeight: '600',
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {w.waiter_name}
                              </Text>
                            </View>
                            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                              {fmtCurrency(w.total_tips)}
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
                            {fmtInt(w.invoices_count)} facturas · prom {fmtCurrency(w.avg_tip)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </SectionCard>
              ) : null}

              {/* Por turno */}
              {shifts.length > 0 ? (
                <SectionCard title="Por turno" subtitle="Distribución del día" emoji="🌅">
                  <View style={{ gap: 10 }}>
                    {shifts.map((s, idx) => (
                      <View
                        key={`s-${idx}`}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                        >
                          {s.shift}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}
                          >
                            {fmtCurrency(s.total_tips)}
                          </Text>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                            {fmtInt(s.invoices_count)} facturas
                          </Text>
                        </View>
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

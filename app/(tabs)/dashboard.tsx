import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/useAuthStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { useFiltersStore } from '@store/useFiltersStore';
import { useFinancialOverview } from '@hooks/useFinancialOverview';
import { KpiCard } from '@components/dashboard/KpiCard';
import { PresetChips } from '@components/dashboard/PresetChips';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { SectionCard } from '@components/dashboard/SectionCard';
import { TopProductsList } from '@components/dashboard/TopProductsList';
import { TopCustomersList } from '@components/dashboard/TopCustomersList';
import { AgingCards } from '@components/dashboard/AgingCards';
import { HeatmapGrid } from '@components/dashboard/HeatmapGrid';
import { LocationComparison } from '@components/dashboard/LocationComparison';
import { InsightsPanel } from '@components/dashboard/InsightsPanel';
import { MonthlyBarChart } from '@components/charts/MonthlyBarChart';
import { ExpenseDonut } from '@components/charts/ExpenseDonut';
import { CashFlowLine } from '@components/charts/CashFlowLine';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct, buName } from '@utils/format';
import { rangeSpanDays } from '@utils/dates';
import { generateInsights } from '@utils/insights';
// Skeleton unused removed

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const bu = useBusinessStore((s) => s.activeBusinessUnit);
  const selectedLocationId = useBusinessStore((s) => s.selectedLocationId);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);
  const hasMultiLocations = (bu?.locations?.length ?? 0) > 1;
  const showComparison = hasMultiLocations && selectedLocationId == null;

  const { data, isLoading, isRefetching, isFetching, refetch, error } = useFinancialOverview();
  const summary = data?.summary;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={palette.dark.textMuted}
            colors={[palette.dark.primary]}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}>
          <Text style={{ color: palette.dark.textDim, fontSize: 13, fontWeight: '500' }}>
            ¡Hola, {user?.use_fullname ?? user?.use_username ?? user?.username ?? 'usuario'}!
          </Text>
          <Text style={{ color: palette.dark.text, fontSize: 30, fontWeight: '700', marginTop: 3, letterSpacing: -0.8 }}>
            Dashboard
          </Text>
          <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 4, fontWeight: '500' }} numberOfLines={1}>
            {buName(bu)} · {rangeSpanDays(startDate, endDate)} días
          </Text>
        </View>

        {/* Presets */}
        <View style={{ marginBottom: 16 }}>
          <PresetChips />
        </View>

        {/* Location selector */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        {/* Content */}
        {isLoading ? (
          <View style={{ paddingHorizontal: 20 }}>
            <LoadingState
              label="Cargando dashboard…"
              hint="Estamos preparando KPIs, charts y top productos."
              variant="centered"
            />
          </View>
        ) : error ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                Error al cargar
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12 }}>
                {(error as Error)?.message ?? 'No se pudo conectar al servidor.'}
              </Text>
            </Card>
          </View>
        ) : !summary ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin datos en este período.
              </Text>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {/* Insights generados automáticamente */}
            {(() => {
              const insights = generateInsights(data ?? null);
              return insights.length > 0 ? (
                <SectionCard
                  title="Insights automáticos"
                  subtitle="Análisis de tus indicadores"
                  emoji="✨"
                >
                  <InsightsPanel insights={insights} />
                </SectionCard>
              ) : null;
            })()}

            {/* Hero — Utilidad Neta */}
            <KpiCard
              variant="hero"
              label="Utilidad Neta"
              value={fmtCurrency(summary.utilidad_neta)}
              delta={summary.margen_neto_pct}
              hint={`Margen neto · ${fmtPct(summary.margen_neto_pct)}`}
            />

            {/* KPI Grid */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                label="Ventas"
                value={fmtCurrency(summary.ventas_total)}
                emoji="💰"
                hint={`${fmtInt(summary.ventas_count)} facturas`}
              />
              <KpiCard
                label="Utilidad Bruta"
                value={fmtCurrency(summary.utilidad_bruta)}
                emoji="📈"
                hint={`${fmtPct(summary.margen_bruto_pct)} margen`}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                label="Compras"
                value={fmtCurrency(summary.compras_total)}
                emoji="🛍️"
                hint={`${fmtInt(summary.compras_count)} órdenes`}
              />
              <KpiCard
                label="Gastos"
                value={fmtCurrency(summary.gastos_total)}
                emoji="🧾"
                hint={`${fmtInt(summary.gastos_count)} registros`}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                label="ITBIS Neto"
                value={fmtCurrency(summary.itbis_neto)}
                emoji="📑"
                hint={`Cobr ${fmtCurrency(summary.itbis_cobrado)}`}
              />
              <KpiCard
                label="CxC / CxP"
                value={`${fmtCurrency(summary.cxc_total)} / ${fmtCurrency(summary.cxp_total)}`.substring(0, 22)}
                emoji="🔄"
                hint={`DSO ${Math.round(summary.dso || 0)}d · DPO ${Math.round(summary.dpo || 0)}d`}
              />
            </View>

            {/* Monthly P&L */}
            {data?.monthly_series?.length ? (
              <SectionCard
                title="Ventas vs Costos y Gastos"
                subtitle="Tendencia mensual"
                emoji="📊"
              >
                <MonthlyBarChart data={data.monthly_series} />
              </SectionCard>
            ) : null}

            {/* Expense breakdown */}
            {data?.expense_breakdown?.length ? (
              <SectionCard
                title="Distribución de gastos"
                subtitle="Top categorías"
                emoji="🥧"
              >
                <ExpenseDonut data={data.expense_breakdown} total={summary.gastos_total} />
              </SectionCard>
            ) : null}

            {/* Cash flow */}
            {data?.cash_flow?.length ? (
              <SectionCard
                title="Flujo de caja"
                subtitle={`Agrupado por ${data.cash_flow_bucket}`}
                emoji="💵"
              >
                <CashFlowLine data={data.cash_flow} />
              </SectionCard>
            ) : null}

            {/* Top products */}
            {data?.top_products_profit?.length ? (
              <SectionCard
                title="Productos top"
                subtitle="Por ingresos"
                emoji="🏆"
              >
                <TopProductsList data={data.top_products_profit} />
              </SectionCard>
            ) : null}

            {/* Comparar sucursales (solo en consolidado) */}
            {showComparison ? (
              <SectionCard
                title="Comparar sucursales"
                subtitle="Ranking por ventas"
                emoji="🏬"
              >
                <LocationComparison />
              </SectionCard>
            ) : null}

            {/* Top customers (Pareto) */}
            {data?.top_customers?.length ? (
              <SectionCard
                title="Top clientes"
                subtitle="Concentración de ingresos"
                emoji="👑"
              >
                <TopCustomersList data={data.top_customers} />
              </SectionCard>
            ) : null}

            {/* Aging CxC / CxP */}
            {data?.aging_receivable || data?.aging_payable ? (
              <SectionCard
                title="Aging financiero"
                subtitle="Por cobrar y por pagar"
                emoji="📅"
              >
                <AgingCards
                  receivable={data.aging_receivable}
                  payable={data.aging_payable}
                />
              </SectionCard>
            ) : null}

            {/* Heatmap hora × día */}
            {data?.heatmap?.length ? (
              <SectionCard
                title="Heatmap de ventas"
                subtitle="Hora × Día — intensidad de actividad"
                emoji="🔥"
              >
                <HeatmapGrid data={data.heatmap} />
              </SectionCard>
            ) : null}

            {/* Footer */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '500' }}>
                {startDate} → {endDate}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
import { GoalProgress } from '@components/dashboard/GoalProgress';
import { useGoalsStore, periodKey } from '@store/useGoalsStore';
import { MonthlyBarChart } from '@components/charts/MonthlyBarChart';
import { ExpenseDonut } from '@components/charts/ExpenseDonut';
import { CashFlowLine } from '@components/charts/CashFlowLine';
import { Card, LoadingState, InlineFetchingBar, RangePickerSheet, fmtTime12, IconMoney, IconTrend, IconBox, IconInvoice, IconLayers, IconSparkles, IconPie, IconTrophy, IconStore, IconStar, IconCalendar, IconFlame } from '@components/ui';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtCompact, fmtInt, fmtPct, buName } from '@utils/format';
import { rangeSpanDays } from '@utils/dates';
import { generateInsights } from '@utils/insights';
// Skeleton unused removed

/** "hace 2 min", "hace 1 h", "justo ahora" — para el timestamp de actualización. */
const fmtRelativeTime = (ts?: number): string => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'justo ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
};

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const bu = useBusinessStore((s) => s.activeBusinessUnit);
  const selectedLocationId = useBusinessStore((s) => s.selectedLocationId);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);
  const startTime = useFiltersStore((s) => s.startTime);
  const endTime = useFiltersStore((s) => s.endTime);
  const activePresetDays = useFiltersStore((s) => s.activePresetDays);
  const setCustom = useFiltersStore((s) => s.setCustom);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasMultiLocations = (bu?.locations?.length ?? 0) > 1;
  // #4 — comparar sucursales siempre que haya varias (incluso con una seleccionada).
  const showComparison = hasMultiLocations;

  const { data, isLoading, isRefetching, isFetching, refetch, error, dataUpdatedAt } =
    useFinancialOverview();
  const summary = data?.summary;
  const prev = data?.previous;

  // % de cambio vs período anterior; undefined si no hay base válida (no muestra delta).
  const pctChange = (curr: number, base?: number): number | undefined =>
    base && base > 0 ? ((curr - base) / base) * 100 : undefined;

  const goalPeriod = periodKey(startDate);
  const periodGoal = useGoalsStore((s) => s.goals[goalPeriod]);

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
            {startTime && endTime ? ` · ${fmtTime12(startTime)}–${fmtTime12(endTime)}` : ''}
          </Text>
          {dataUpdatedAt && !isLoading ? (
            <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              Actualizado {fmtRelativeTime(dataUpdatedAt)}
            </Text>
          ) : null}
        </View>

        {/* Presets + rango personalizado */}
        <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <PresetChips />
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setPickerOpen(true);
            }}
            style={({ pressed }) => ({
              marginRight: 16,
              marginLeft: 4,
              width: 42,
              height: 38,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              backgroundColor: activePresetDays === null ? palette.dark.text : palette.dark.surface,
              borderColor: activePresetDays === null ? palette.dark.text : palette.dark.border,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
          </Pressable>
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
            {/* Hero — Utilidad Neta */}
            <KpiCard
              variant="hero"
              label="Utilidad Neta"
              value={fmtCurrency(summary.utilidad_neta)}
              delta={pctChange(summary.utilidad_neta, prev?.utilidad_neta)}
              hint={
                prev
                  ? `Margen ${fmtPct(summary.margen_neto_pct)} · vs período ant.`
                  : `Margen neto · ${fmtPct(summary.margen_neto_pct)}`
              }
            />

            {/* KPI Grid */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                label="Ventas"
                value={fmtCurrency(summary.ventas_total)}
                delta={pctChange(summary.ventas_total, prev?.ventas_total)}
                icon={<IconMoney color={palette.dark.primary} size={16} />}
                hint={`${fmtInt(summary.ventas_count)} facturas`}
              />
              <KpiCard
                label="Utilidad Bruta"
                value={fmtCurrency(summary.utilidad_bruta)}
                delta={pctChange(summary.utilidad_bruta, prev?.utilidad_bruta)}
                icon={<IconTrend color={palette.dark.primary} size={16} />}
                hint={`${fmtPct(summary.margen_bruto_pct)} margen`}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                label="Compras"
                value={fmtCurrency(summary.compras_total)}
                delta={pctChange(summary.compras_total, prev?.compras_total)}
                icon={<IconBox color={palette.dark.primary} size={16} />}
                hint={`${fmtInt(summary.compras_count)} órdenes`}
              />
              <KpiCard
                label="Gastos"
                value={fmtCurrency(summary.gastos_total)}
                delta={pctChange(summary.gastos_total, prev?.gastos_total)}
                invertDelta
                icon={<IconInvoice color={palette.dark.primary} size={16} />}
                hint={`${fmtInt(summary.gastos_count)} registros`}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <KpiCard
                label="ITBIS Neto"
                value={fmtCurrency(summary.itbis_neto)}
                icon={<IconInvoice color={palette.dark.primary} size={16} />}
                hint={`Cobr ${fmtCurrency(summary.itbis_cobrado)}`}
              />
              <KpiCard
                label="CxC / CxP"
                value={`${fmtCompact(summary.cxc_total)} / ${fmtCompact(summary.cxp_total)}`}
                icon={<IconLayers color={palette.dark.primary} size={16} />}
                hint={`DSO ${Math.round(summary.dso || 0)}d · DPO ${Math.round(summary.dpo || 0)}d`}
              />
            </View>

            {/* Metas del mes (locales) */}
            {periodGoal && (periodGoal.salesGoal > 0 || periodGoal.expenseBudget > 0) ? (
              <SectionCard
                title="Metas del mes"
                subtitle="Progreso vs. tu objetivo"
                icon={<IconTrend color={palette.dark.primary} size={18} />}
              >
                <GoalProgress
                  salesActual={summary.ventas_total}
                  salesGoal={periodGoal.salesGoal}
                  expenseActual={summary.gastos_total}
                  expenseBudget={periodGoal.expenseBudget}
                />
              </SectionCard>
            ) : null}

            {/* Monthly P&L */}
            {data?.monthly_series?.length ? (
              <SectionCard
                title="Ventas vs Costos y Gastos"
                subtitle="Tendencia mensual"
                icon={<IconTrend color={palette.dark.primary} size={18} />}
                onPress={() => router.push('/(tabs)/reports/profit-loss')}
              >
                <MonthlyBarChart data={data.monthly_series} />
              </SectionCard>
            ) : null}

            {/* Expense breakdown */}
            {data?.expense_breakdown?.length ? (
              <SectionCard
                title="Distribución de gastos"
                subtitle="Top categorías"
                icon={<IconPie color={palette.dark.primary} size={18} />}
                onPress={() => router.push('/(tabs)/reports/purchases-expenses')}
              >
                <ExpenseDonut data={data.expense_breakdown} total={summary.gastos_total} />
              </SectionCard>
            ) : null}

            {/* Cash flow */}
            {data?.cash_flow?.length ? (
              <SectionCard
                title="Flujo de caja"
                subtitle={`Agrupado por ${data.cash_flow_bucket}`}
                icon={<IconMoney color={palette.dark.primary} size={18} />}
                onPress={() => router.push('/(tabs)/reports/boxes')}
              >
                <CashFlowLine data={data.cash_flow} />
              </SectionCard>
            ) : null}

            {/* Top products */}
            {data?.top_products_profit?.length ? (
              <SectionCard
                title="Productos top"
                subtitle="Por ingresos"
                icon={<IconTrophy color={palette.dark.primary} size={18} />}
                onPress={() => router.push('/(tabs)/reports/sales')}
              >
                <TopProductsList data={data.top_products_profit} />
              </SectionCard>
            ) : null}

            {/* Comparar sucursales (solo en consolidado) */}
            {showComparison ? (
              <SectionCard
                title="Comparar sucursales"
                subtitle="Ranking por ventas"
                icon={<IconStore color={palette.dark.primary} size={18} />}
              >
                <LocationComparison />
              </SectionCard>
            ) : null}

            {/* Top customers (Pareto) */}
            {data?.top_customers?.length ? (
              <SectionCard
                title="Top clientes"
                subtitle="Concentración de ingresos"
                icon={<IconStar color={palette.dark.primary} size={18} />}
                onPress={() => router.push('/(tabs)/reports/sales')}
              >
                <TopCustomersList data={data.top_customers} />
              </SectionCard>
            ) : null}

            {/* Aging CxC / CxP */}
            {data?.aging_receivable || data?.aging_payable ? (
              <SectionCard
                title="Aging financiero"
                subtitle="Por cobrar y por pagar"
                icon={<IconCalendar color={palette.dark.primary} size={18} />}
                onPress={() => router.push('/(tabs)/operations/receivables')}
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
                icon={<IconFlame color={palette.dark.primary} size={18} />}
              >
                <HeatmapGrid data={data.heatmap} />
              </SectionCard>
            ) : null}

            {/* Insights generados automáticamente */}
            {(() => {
              const insights = generateInsights(data ?? null);
              return insights.length > 0 ? (
                <SectionCard
                  title="Insights automáticos"
                  subtitle="Análisis de tus indicadores"
                  icon={<IconSparkles color={palette.dark.primary} size={18} />}
                >
                  <InsightsPanel insights={insights} />
                </SectionCard>
              ) : null;
            })()}

            {/* Footer */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '500' }}>
                {startDate} → {endDate}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <RangePickerSheet
        visible={pickerOpen}
        initial={{
          start: startDate,
          end: endDate,
          startTime,
          endTime,
        }}
        onClose={() => setPickerOpen(false)}
        onApply={(sel) => {
          setCustom(sel.start, sel.end, sel.startTime, sel.endTime);
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

